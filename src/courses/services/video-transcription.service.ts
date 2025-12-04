import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import { OpenAI } from 'openai';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

interface TranscriptionJob {
  jobName: string;
  jobStatus: string;
  mediaFileUri: string;
  transcript?: string;
}

@Injectable()
export class VideoTranscriptionService {
  private transcribeClient: AWS.TranscribeService;
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {
    this.transcribeClient = new AWS.TranscribeService({
      region: process.env.AWS_REGION || 'eu-north-1',
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate AI summary from video transcript
   * Creates a concise educational summary for quiz generation
   */
  async generateVideoSummary(transcript: string): Promise<string> {
    if (!transcript || transcript.trim().length === 0) {
      throw new BadRequestException('Transcript cannot be empty');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content summarizer. Create a concise, clear summary of the following video transcript.

The summary should:
- Be 2-3 paragraphs (150-300 words)
- Capture the main learning objectives
- Include key concepts and important details
- Be suitable for generating multiple-choice quiz questions
- Use clear, academic language
- Focus on educational value

Return ONLY the summary text, no additional formatting or explanations.`,
          },
          {
            role: 'user',
            content: `Please summarize this video transcript:\n\n${transcript.substring(0, 4000)}`, // Limit to first 4000 chars
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const summary = response.choices[0].message.content?.trim();
      if (!summary) {
        throw new InternalServerErrorException('Failed to generate summary from AI response');
      }
      return summary;
    } catch (error) {
      console.error('Error generating video summary:', error);
      throw new InternalServerErrorException('Failed to generate video summary');
    }
  }

  /**
   * Generate summary directly from video file using OpenAI Vision
   * Skips AWS Transcribe and sends video directly to OpenAI
   * Much faster for getting summaries (1-2 minutes vs 5-30 minutes)
   * Perfect when you just need a summary, not full transcript
   */
  async generateSummaryFromVideoFile(
    videoUrl: string,
    videoFileName: string,
  ): Promise<{
    summary: string;
    generatedAt: Date;
  }> {
    try {
      // Validate video URL
      if (!videoUrl || (!videoUrl.startsWith('http') && !videoUrl.startsWith('s3://'))) {
        throw new BadRequestException('Invalid video URL');
      }

      // Normalize S3 URL if needed
      let processedUrl = videoUrl;
      if (videoUrl.startsWith('s3://')) {
        processedUrl = this.s3Service.normalizeS3Url(videoUrl);
      }

      console.log('Sending video to OpenAI for summarization:', processedUrl);

      // Call OpenAI Vision API with video file
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content analyzer. Watch the provided video and create a comprehensive educational summary.

The summary should:
- Be 3-4 paragraphs (300-500 words)
- Capture all main learning objectives and key concepts
- Highlight important definitions and explanations
- Include practical examples mentioned in the video
- Be suitable for generating multiple-choice quiz questions (include 5-10 potential quiz topics)
- Use clear, academic language
- Focus on educational value and learning outcomes

Format your response as:
SUMMARY:
[Your detailed summary here]

QUIZ TOPICS:
- [Topic 1]
- [Topic 2]
- [Topic 3]
...and more`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this educational video and provide a comprehensive summary with suggested quiz topics: ${videoFileName}`,
              },
              {
                type: 'video_url',
                video_url: {
                  url: processedUrl,
                },
              },
            ] as any,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content?.trim();
      if (!content) {
        throw new InternalServerErrorException('Failed to generate summary from OpenAI response');
      }

      console.log('Successfully generated video summary using OpenAI');

      return {
        summary: content,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating summary from video file:', error);
      throw new InternalServerErrorException(
        `Failed to generate summary from video: ${error.message}`,
      );
    }
  }

  /**
   * Extract transcript from video file or S3 URL
   * Supports video formats: MP4, MOV, MKV, AVI, etc.
   * Uses AWS Transcribe to generate accurate transcripts
   */
  async extractTranscriptFromVideo(
    videoFilePath: string,
    videoFileName: string,
    lessonId: string,
  ): Promise<{
    transcript: string;
    duration: number;
    language: string;
    wordCount: number;
    confidence: number;
    status: string;
    extractedAt: Date;
    jobName?: string;
  }> {
    try {
      let videoUrl: string;

      // Check if it's already an S3 URL
      if (videoFilePath.startsWith('http')) {
        // It's already an S3 URL, normalize to use current region
        videoUrl = this.s3Service.normalizeS3Url(videoFilePath);
        console.log('Using S3 URL for transcription:', videoUrl);
      } else {
        // It's a local file path, upload to S3
        if (!fs.existsSync(videoFilePath)) {
          throw new BadRequestException('Video file not found');
        }

        // Get video file size
        const fileStats = fs.statSync(videoFilePath);
        const fileSizeInMB = fileStats.size / (1024 * 1024);

        // AWS Transcribe has a max file size of 2GB, but we'll limit to 500MB
        if (fileSizeInMB > 500) {
          throw new BadRequestException('Video file exceeds 500MB size limit');
        }

        // Upload video to S3
        const s3Key = `videos/transcription/${lessonId}/${videoFileName}`;
        videoUrl = await this.uploadVideoToS3ForTranscription(videoFilePath, s3Key);
      }

      // Start AWS Transcribe job
      const jobName = `transcribe-${lessonId}-${Date.now()}`;
      const transcriptionJob = await this.startTranscriptionJob(
        jobName,
        videoUrl,
        videoFileName,
      );

      // Return job details immediately without waiting
      // Client should poll the transcription status
      return {
        transcript: '',
        duration: 0,
        language: 'en-US',
        wordCount: 0,
        confidence: 0,
        status: transcriptionJob.jobStatus || 'IN_PROGRESS',
        extractedAt: new Date(),
        jobName: jobName,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to extract transcript: ${error.message}`,
      );
    }
  }

  /**
   * Upload video to S3 for transcription processing
   */
  private async uploadVideoToS3ForTranscription(
    videoFilePath: string,
    s3Key: string,
  ): Promise<string> {
    try {
      const fileContent = fs.readFileSync(videoFilePath);
      const s3 = new AWS.S3({
        region: process.env.AWS_REGION || 'eu-north-1',
      });

      const params = {
        Bucket: process.env.AWS_S3_BUCKET || 'ironclad-bucket',
        Key: s3Key,
        Body: fileContent,
        ContentType: 'video/mp4',
        ServerSideEncryption: 'AES256',
      };

      await s3.upload(params).promise();

      // Return S3 URI for Transcribe
      const bucketName = process.env.AWS_S3_BUCKET || 'ironclad-bucket';
      return `s3://${bucketName}/${s3Key}`;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload video to S3: ${error.message}`,
      );
    }
  }

  /**
   * Start AWS Transcribe job for video transcription
   */
  private async startTranscriptionJob(
    jobName: string,
    mediaFileUri: string,
    videoFileName: string,
  ): Promise<TranscriptionJob> {
    const params = {
      TranscriptionJobName: jobName,
      LanguageCode: 'en-US',
      MediaFormat: 'mp4',
      Media: {
        MediaFileUri: mediaFileUri,
      },
      OutputBucketName: process.env.AWS_S3_BUCKET || 'ironclad-bucket',
      OutputKey: `transcripts/${jobName}.json`,
      Settings: {
        VocabularyName: undefined, // Optional: custom vocabulary
        ShowAlternatives: false,
        MaxSpeakerLabels: 2, // AWS requires minimum 2
        ShowSpeakerLabels: true, // Required when using MaxSpeakerLabels
      },
    };

    try {
      const result = await this.transcribeClient.startTranscriptionJob(params).promise();
      return {
        jobName: result.TranscriptionJob.TranscriptionJobName,
        jobStatus: result.TranscriptionJob.TranscriptionJobStatus,
        mediaFileUri: result.TranscriptionJob.Media.MediaFileUri,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to start transcription job: ${error.message}`,
      );
    }
  }

  /**
   * Wait for transcription job to complete with timeout
   */
  private async waitForTranscriptionCompletion(
    jobName: string,
    maxWaitTime: number = 3600000, // 1 hour max
  ): Promise<any> {
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const params = { TranscriptionJobName: jobName };

      try {
        const result = await this.transcribeClient
          .getTranscriptionJob(params)
          .promise();

        const job = result.TranscriptionJob;

        if (job.TranscriptionJobStatus === 'COMPLETED') {
          return job;
        } else if (job.TranscriptionJobStatus === 'FAILED') {
          throw new InternalServerErrorException(
            `Transcription job failed: ${job.FailureReason}`,
          );
        }

        // Wait before next check
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      } catch (error) {
        if (error.code !== 'InternalServerErrorException') {
          throw error;
        }
      }
    }

    throw new InternalServerErrorException(
      'Transcription job exceeded maximum wait time',
    );
  }

  /**
   * Get transcript from completed job
   */
  private async getTranscriptFromJob(job: any): Promise<{
    transcript: string;
    duration: number;
    language: string;
    wordCount: number;
    confidence: number;
  }> {
    try {
      const s3 = new AWS.S3({
        region: process.env.AWS_REGION || 'eu-north-1',
      });

      // Get transcript file from S3
      const transcriptUri = job.Transcript.TranscriptFileUri;
      const bucketName = process.env.AWS_S3_BUCKET || 'ironclad-bucket';
      const key = transcriptUri.replace(`s3://${bucketName}/`, '');

      const params = {
        Bucket: bucketName,
        Key: key,
      };

      const data = await s3.getObject(params).promise();
      const transcriptJson = JSON.parse(data.Body.toString('utf-8'));

      // Extract transcript text
      const transcriptItems = transcriptJson.results.transcripts;
      const fullTranscript = transcriptItems
        .map((t: any) => t.transcript)
        .join(' ')
        .trim();

      // Calculate statistics
      const wordCount = fullTranscript.split(/\s+/).length;
      const items = transcriptJson.results.items || [];
      const confidenceScores = items
        .filter((item: any) => item.confidence)
        .map((item: any) => parseFloat(item.confidence));
      const averageConfidence =
        confidenceScores.length > 0
          ? confidenceScores.reduce((a: number, b: number) => a + b, 0) /
            confidenceScores.length
          : 0;

      return {
        transcript: fullTranscript,
        duration: job.MediaDurationSeconds || 0,
        language: job.LanguageCode || 'en-US',
        wordCount,
        confidence: Math.round(averageConfidence * 100),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve transcript: ${error.message}`,
      );
    }
  }

  /**
   * Extract transcript from local video file (fallback for testing)
   * Uses simple audio extraction and basic transcription
   */
  async extractTranscriptLocal(videoFilePath: string): Promise<string> {
    try {
      // This is a simplified fallback for testing
      // In production, use AWS Transcribe or similar service

      if (!fs.existsSync(videoFilePath)) {
        throw new BadRequestException('Video file not found');
      }

      // Return a placeholder - in real scenario, would process audio
      const fileName = path.basename(videoFilePath);
      return `[Raw transcript from ${fileName}]\nAudio extraction and transcription would be performed here using AWS Transcribe or similar service.`;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to extract transcript locally: ${error.message}`,
      );
    }
  }

  /**
   * Save transcript to database
   */
  async saveTranscriptToDatabase(
    lessonId: string,
    transcript: string,
    metadata: {
      duration: number;
      language: string;
      wordCount: number;
      confidence: number;
    },
  ): Promise<any> {
    try {
      // Update lesson with transcript data
      const updatedLesson = await this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          description: transcript, // Store transcript in description field
          // You may want to add transcript-specific fields to the schema
        },
      });

      return {
        lessonId: updatedLesson.id,
        transcript,
        metadata,
        savedAt: new Date(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to save transcript: ${error.message}`,
      );
    }
  }

  /**
   * Get saved transcript for lesson
   */
  async getTranscriptForLesson(lessonId: string): Promise<{
    lessonId: string;
    transcript: string;
    retrievedAt: Date;
  }> {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson || !lesson.description) {
        throw new BadRequestException('No transcript found for this lesson');
      }

      return {
        lessonId,
        transcript: lesson.description,
        retrievedAt: new Date(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve transcript: ${error.message}`,
      );
    }
  }

  /**
   * Generate transcript summary using simple text processing
   * For more advanced summarization, consider using AWS Comprehend
   */
  async generateTranscriptSummary(transcript: string): Promise<string> {
    try {
      if (!transcript || transcript.length === 0) {
        throw new BadRequestException('Transcript cannot be empty');
      }

      // Simple summary generation - extract key sentences
      const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
      const summaryLength = Math.ceil(sentences.length / 3); // 1/3 of original

      // Score sentences by keyword frequency
      const scoredSentences = sentences.map((sentence: string) => ({
        text: sentence.trim(),
        score: this.calculateSentenceScore(sentence, transcript),
      }));

      // Sort by score and take top sentences
      const topSentences = scoredSentences
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, summaryLength)
        .map((s: any) => s.text)
        .join(' ');

      return topSentences;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate summary: ${error.message}`,
      );
    }
  }

  /**
   * Calculate sentence importance score
   */
  private calculateSentenceScore(sentence: string, fullText: string): number {
    const words = sentence.split(/\s+/);
    let score = 0;

    // Simple scoring: longer sentences with common terms
    score += words.length * 0.1;

    // Score based on word frequency
    words.forEach((word: string) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 3) {
        const frequency = (fullText.match(new RegExp(cleanWord, 'gi')) || [])
          .length;
        score += frequency * 0.05;
      }
    });

    return score;
  }

  /**
   * Check transcription job status and retrieve transcript if completed
   */
  async checkTranscriptionStatus(
    jobName: string,
  ): Promise<{
    status: string;
    transcript?: string;
    duration?: number;
    language?: string;
    wordCount?: number;
    confidence?: number;
  }> {
    try {
      const params = { TranscriptionJobName: jobName };
      const result = await this.transcribeClient.getTranscriptionJob(params).promise();
      const job = result.TranscriptionJob;

      if (job.TranscriptionJobStatus === 'COMPLETED') {
        const transcriptData = await this.getTranscriptFromJob(job);
        return {
          status: 'COMPLETED',
          transcript: transcriptData.transcript,
          duration: transcriptData.duration,
          language: transcriptData.language,
          wordCount: transcriptData.wordCount,
          confidence: transcriptData.confidence,
        };
      } else if (job.TranscriptionJobStatus === 'FAILED') {
        return {
          status: 'FAILED',
        };
      }

      return {
        status: job.TranscriptionJobStatus,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to check transcription status: ${error.message}`,
      );
    }
  }
}
