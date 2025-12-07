import { Injectable, BadRequestException } from '@nestjs/common';
import { OpenAI } from 'openai';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export interface VideoSummaryResponse {
  summary: string;
  duration: number;
  keyPoints: string[];
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctOption: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GeneratedQuiz {
  questions: QuizQuestion[];
  topic: string;
}

@Injectable()
export class VideoProcessingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Download file from URL (supports S3 URLs and regular HTTPS)
   */
  private async downloadFile(videoUrl: string, filePath: string): Promise<void> {
    // Check if this is an S3 URL
    if (videoUrl.includes('s3.') && videoUrl.includes('amazonaws.com')) {
      return this.downloadFromS3(videoUrl, filePath);
    }

    // Fall back to regular HTTPS download
    return this.downloadFromHttps(videoUrl, filePath);
  }

  /**
   * Download file from S3 using AWS SDK v3
   */
  private async downloadFromS3(videoUrl: string, filePath: string): Promise<void> {
    try {
      // Parse S3 URL to extract bucket and key
      // Format: https://bucket.s3.region.amazonaws.com/key or https://s3.region.amazonaws.com/bucket/key
      const urlObj = new URL(videoUrl);
      let bucket: string;
      let key: string;
      let region = 'eu-north-1'; // Default region

      if (urlObj.hostname.includes('.s3.')) {
        // Format: bucket.s3.region.amazonaws.com
        const match = urlObj.hostname.match(/^([^.]+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/);
        if (match) {
          bucket = match[1];
          region = match[2];
        } else {
          throw new Error('Could not parse S3 bucket from URL');
        }
        key = urlObj.pathname.substring(1); // Remove leading slash
      } else if (urlObj.hostname.includes('s3.amazonaws.com')) {
        // Format: s3.region.amazonaws.com/bucket/key
        const parts = urlObj.pathname.substring(1).split('/');
        bucket = parts[0];
        key = parts.slice(1).join('/');
      } else {
        throw new Error('Invalid S3 URL format');
      }

      console.log(`S3 Download - Bucket: ${bucket}, Key: ${key}, Region: ${region}`);

      // Create S3 client
      const s3Client = new S3Client({ region });

      // Get object from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3Client.send(getObjectCommand);

      // Create write stream and pipe S3 response body to file
      if (!response.Body) {
        throw new Error('S3 response has no body');
      }

      return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);

        // Handle the ReadableStream
        const stream = response.Body as NodeJS.ReadableStream;
        stream.pipe(file);

        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(filePath);
          console.log(`S3 file downloaded successfully: ${filePath}, size: ${stats.size} bytes`);
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(filePath, () => reject(err));
        });

        stream.on('error', (err) => {
          file.close();
          fs.unlink(filePath, () => reject(err));
        });
      });
    } catch (error) {
      console.error(`S3 download error: ${error.message}`);
      throw new BadRequestException(`Failed to download video from S3: ${error.message}`);
    }
  }

  /**
   * Download file from regular HTTPS URL
   */
  private async downloadFromHttps(videoUrl: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = videoUrl.startsWith('https') ? https : http;
      const file = fs.createWriteStream(filePath);

      protocol
        .get(videoUrl, { timeout: 60000 }, (response) => {
          console.log(`Download response status: ${response.statusCode}`);
          console.log(`Content-Type: ${response.headers['content-type']}`);
          console.log(`Content-Length: ${response.headers['content-length']}`);

          // Check if redirect
          if (response.statusCode === 301 || response.statusCode === 302) {
            console.log(`Following redirect to: ${response.headers.location}`);
            file.close();
            fs.unlinkSync(filePath);
            this.downloadFromHttps(response.headers.location as string, filePath)
              .then(resolve)
              .catch(reject);
            return;
          }

          if (response.statusCode !== 200) {
            file.close();
            fs.unlinkSync(filePath);
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }

          response.pipe(file);
          file.on('finish', () => {
            file.close();
            const stats = fs.statSync(filePath);
            console.log(`File downloaded: ${filePath}, size: ${stats.size} bytes`);
            resolve();
          });
        })
        .on('error', (err) => {
          console.log(`Download error: ${err.message}`);
          fs.unlink(filePath, () => reject(err));
        })
        .on('timeout', () => {
          console.log('Download timeout');
          file.close();
          fs.unlink(filePath, () => reject(new Error('Download timeout')));
        });
    });
  }

  /**
   * Extract audio from video using ffmpeg
   * Requires ffmpeg to be installed on the system
   */
  private async extractAudioFromVideo(videoPath: string, audioPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Define ffmpeg path - try multiple locations
      const ffmpegPaths = [
        'ffmpeg', // System PATH
        'C:\\Users\\DELL\\AppData\\Local\\Microsoft\\WinGet\\Packages\\BtbN.FFmpeg.GPL.8.0_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-n8.0.1-17-g27a297f186-win64-gpl-8.0\\bin\\ffmpeg.exe',
        'C:\\Users\\DELL\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe',
      ];

      let ffmpegPath = ffmpegPaths[0];
      for (const p of ffmpegPaths) {
        if (fs.existsSync(p)) {
          ffmpegPath = p;
          console.log(`Found ffmpeg at: ${ffmpegPath}`);
          break;
        }
      }

      console.log(`Using ffmpeg: ${ffmpegPath}`);
      console.log(`Video path: ${videoPath}`);
      console.log(`Audio path: ${audioPath}`);

      // Verify video file exists and has content
      if (!fs.existsSync(videoPath)) {
        reject(new BadRequestException('Downloaded video file not found'));
        return;
      }

      const stats = fs.statSync(videoPath);
      console.log(`Video file size: ${stats.size} bytes`);
      if (stats.size === 0) {
        reject(new BadRequestException('Downloaded video file is empty'));
        return;
      }

      // Try to use ffmpeg to extract audio - let ffmpeg auto-detect format
      const command = `"${ffmpegPath}" -i "${videoPath}" -vn -acodec libmp3lame -ab 192k -y "${audioPath}"`;

      console.log(`Executing command: ${command}`);

      child_process.exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        console.log(`ffmpeg stdout: ${stdout}`);
        console.log(`ffmpeg stderr: ${stderr}`);
        
        // Check if audio file was created
        if (fs.existsSync(audioPath)) {
          const audioStats = fs.statSync(audioPath);
          console.log(`Audio file created: ${audioPath}, size: ${audioStats.size} bytes`);
          if (audioStats.size > 0) {
            resolve();
            return;
          }
        }

        if (error) {
          console.log(`ffmpeg error: ${error.message}`);
          // Check if ffmpeg is not installed
          if (stderr.includes('ffmpeg') || error.message.includes('not found') || error.message.includes('ENOENT')) {
            reject(
              new BadRequestException(
                'ffmpeg is not installed or not found. Install it to enable video audio extraction. On Windows: winget install BtbN.FFmpeg.GPL.8.0'
              )
            );
          } else if (stderr.includes('Error opening input') || stderr.includes('End of file') || stderr.includes('could not find codec')) {
            reject(new BadRequestException(`Video file format not supported or file is corrupted: ${stderr.substring(0, 200)}`));
          } else {
            reject(new BadRequestException(`Failed to extract audio: ${stderr.substring(0, 200)}`));
          }
          return;
        }
        console.log('Audio extraction completed successfully');
        resolve();
      });
    });
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  private async transcribeAudio(audioPath: string): Promise<string> {
    try {
      const audioStream = fs.createReadStream(audioPath);

      const transcript = await this.openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        language: 'en',
      });

      return transcript.text;
    } catch (error) {
      throw new BadRequestException(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Generate video summary using OpenAI API based on actual transcript
   */
  async generateVideoSummary(videoUrl: string): Promise<VideoSummaryResponse> {
    let videoPath: string | null = null;
    let audioPath: string | null = null;

    try {
      if (!videoUrl.startsWith('http')) {
        throw new BadRequestException('Invalid video URL. Must be a valid HTTP/HTTPS URL');
      }

      const tempDir = os.tmpdir();
      const timestamp = Date.now();

      // Download video
      videoPath = path.join(tempDir, `video_${timestamp}.mp4`);
      console.log(`Downloading video from ${videoUrl}...`);
      await this.downloadFile(videoUrl, videoPath);
      console.log(`Video downloaded to ${videoPath}`);

      // Extract audio
      audioPath = path.join(tempDir, `audio_${timestamp}.mp3`);
      console.log(`Extracting audio...`);
      await this.extractAudioFromVideo(videoPath, audioPath);
      console.log(`Audio extracted to ${audioPath}`);

      // Transcribe audio
      console.log(`Transcribing audio with Whisper...`);
      const transcript = await this.transcribeAudio(audioPath);
      console.log(`Transcript obtained: ${transcript.substring(0, 100)}...`);

      // Generate summary from transcript
      if (!transcript || transcript.trim().length === 0) {
        throw new BadRequestException('Could not transcribe video audio. Video may not have audio or audio is too quiet.');
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: `Based on this video transcript, generate a comprehensive educational summary:

TRANSCRIPT:
${transcript}

Please provide:
1. A detailed, educational summary (300-400 words) highlighting the main concepts
2. Estimated video duration (in seconds, based on transcript length - typically 150 words per minute)
3. Key learning points (5-7 bullet points)

Important: Respond with ONLY valid JSON (no markdown), in this exact format:
{"summary": "detailed summary here", "duration": 1800, "keyPoints": ["point 1", "point 2"]}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new BadRequestException('Failed to generate summary from transcript');
      }

      let result;
      try {
        const trimmed = content.trim();
        const cleaned = trimmed
          .replace(/^```json\n?/, '')
          .replace(/\n?```$/, '')
          .replace(/^```\n?/, '')
          .trim();

        result = JSON.parse(cleaned);
      } catch (parseError) {
        throw new BadRequestException(
          `Invalid JSON response from OpenAI. Got: ${content.substring(0, 150)}`
        );
      }

      // Validate required fields
      if (!result.summary || typeof result.summary !== 'string') {
        throw new BadRequestException('OpenAI response missing valid summary field');
      }
      if (typeof result.duration !== 'number' || result.duration < 0) {
        throw new BadRequestException('OpenAI response has invalid duration');
      }
      if (!Array.isArray(result.keyPoints) || result.keyPoints.length === 0) {
        throw new BadRequestException('OpenAI response missing keyPoints array');
      }

      return {
        summary: result.summary,
        duration: result.duration,
        keyPoints: result.keyPoints,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Video Processing Error:', error);
      throw new BadRequestException(
        `Error processing video: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      // Cleanup temporary files
      if (videoPath && fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);
        } catch (e) {
          console.warn(`Failed to delete temp video file: ${e}`);
        }
      }
      if (audioPath && fs.existsSync(audioPath)) {
        try {
          fs.unlinkSync(audioPath);
        } catch (e) {
          console.warn(`Failed to delete temp audio file: ${e}`);
        }
      }
    }
  }

  /**
   * Generate 5 quiz questions from video summary
   */
  async generateQuizFromSummary(summary: string, videoTitle: string): Promise<GeneratedQuiz> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: `You are an expert educational content creator. Generate 5 high-quality multiple-choice quiz questions based on this educational content:

Video Title: "${videoTitle}"

Content Summary:
${summary}

Requirements:
- Create exactly 5 questions with difficulty distribution: 2 easy, 2 medium, 1 hard
- Each question must have exactly 4 options (A, B, C, D)
- Questions should test comprehension and key concepts
- Include educational value and clear learning outcomes

Important: You MUST respond with ONLY valid JSON (no markdown, no code blocks), in this exact format:
{"topic": "topic name from content", "questions": [{"questionText": "question here?", "options": ["option A", "option B", "option C", "option D"], "correctOption": 0, "explanation": "why this is correct", "difficulty": "easy"}]}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new BadRequestException('Failed to generate quiz from OpenAI');
      }

      // Parse the JSON response with better error handling
      let result;
      try {
        const trimmed = content.trim();
        // Remove markdown code blocks if present
        const cleaned = trimmed
          .replace(/^```json\n?/, '')
          .replace(/\n?```$/, '')
          .replace(/^```\n?/, '')
          .trim();
        
        result = JSON.parse(cleaned);
      } catch (parseError) {
        throw new BadRequestException(
          `Invalid JSON response from OpenAI. Expected valid quiz JSON, got: ${content.substring(0, 150)}`
        );
      }

      // Validate the structure
      if (!result.topic || typeof result.topic !== 'string') {
        throw new BadRequestException('OpenAI response missing or invalid topic field');
      }
      if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
        throw new BadRequestException('OpenAI response missing questions array or it is empty');
      }

      // Validate each question
      for (let i = 0; i < result.questions.length; i++) {
        const q = result.questions[i];
        if (!q.questionText || typeof q.questionText !== 'string') {
          throw new BadRequestException(`Question ${i + 1} missing questionText`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new BadRequestException(`Question ${i + 1} must have exactly 4 options`);
        }
        if (typeof q.correctOption !== 'number' || q.correctOption < 0 || q.correctOption > 3) {
          throw new BadRequestException(`Question ${i + 1} has invalid correctOption`);
        }
        if (!q.explanation || typeof q.explanation !== 'string') {
          throw new BadRequestException(`Question ${i + 1} missing explanation`);
        }
        if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
          throw new BadRequestException(
            `Question ${i + 1} has invalid difficulty. Must be: easy, medium, or hard`
          );
        }
      }

      return {
        topic: result.topic,
        questions: result.questions,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('OpenAI Quiz Generation Error:', error);
      throw new BadRequestException(
        `Error generating quiz: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process video URL to generate both summary and quiz
   */
  async processVideoUrl(videoUrl: string, videoTitle: string) {
    try {
      // Step 1: Generate summary from video URL
      const summaryResult = await this.generateVideoSummary(videoUrl);

      // Step 2: Generate quiz from the summary
      const quizResult = await this.generateQuizFromSummary(summaryResult.summary, videoTitle);

      return {
        summary: summaryResult,
        quiz: quizResult,
      };
    } catch (error) {
      throw new BadRequestException(`Error processing video: ${error.message}`);
    }
  }
}
