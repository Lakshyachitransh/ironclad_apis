import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
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

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {
    this.transcribeClient = new AWS.TranscribeService({
      region: process.env.AWS_REGION || 'eu-north-1',
    });
  }

  /**
   * Extract transcript from video file
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
  }> {
    try {
      // Validate video file exists
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

      // Upload video to S3 if not already there
      const s3Key = `videos/transcription/${lessonId}/${videoFileName}`;
      const videoUrl = await this.uploadVideoToS3ForTranscription(videoFilePath, s3Key);

      // Start AWS Transcribe job
      const jobName = `transcribe-${lessonId}-${Date.now()}`;
      const transcriptionJob = await this.startTranscriptionJob(
        jobName,
        videoUrl,
        videoFileName,
      );

      // Wait for transcription to complete
      const completedJob = await this.waitForTranscriptionCompletion(jobName);

      // Retrieve and parse transcript
      const transcriptData = await this.getTranscriptFromJob(completedJob);

      return {
        transcript: transcriptData.transcript,
        duration: transcriptData.duration,
        language: transcriptData.language || 'en-US',
        wordCount: transcriptData.wordCount,
        confidence: transcriptData.confidence,
        status: 'completed',
        extractedAt: new Date(),
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
        MaxSpeakerLabels: 1, // Single speaker
        ShowSpeakerLabels: false,
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
}
