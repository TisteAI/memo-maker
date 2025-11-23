/**
 * Transcription Service
 * Handles audio transcription using OpenAI Whisper API
 */

import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { InternalError } from '../utils/errors.js';
import { Readable } from 'stream';
import { File } from 'buffer';

export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avgLogprob: number;
  compressionRatio: number;
  noSpeechProb: number;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

export class TranscriptionService {
  private openai: OpenAI;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for transcription service');
    }

    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  /**
   * Transcribe audio buffer using OpenAI Whisper
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    language: string = 'en'
  ): Promise<TranscriptionResult> {
    try {
      logger.info({ size: audioBuffer.length, language }, 'Starting transcription');

      // Create File object from buffer
      const file = new File([audioBuffer], 'audio.mp3', {
        type: 'audio/mpeg',
      });

      // Call Whisper API with verbose_json response format
      const response = await this.openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      // Calculate duration from segments
      const duration = response.segments && response.segments.length > 0
        ? response.segments[response.segments.length - 1].end
        : 0;

      const result: TranscriptionResult = {
        text: response.text,
        segments: (response.segments || []) as TranscriptionSegment[],
        language: response.language || language,
        duration: Math.ceil(duration / 60), // Convert to minutes
      };

      logger.info(
        {
          textLength: result.text.length,
          segmentCount: result.segments.length,
          duration: result.duration,
        },
        'Transcription completed'
      );

      return result;
    } catch (error: any) {
      logger.error({ error, message: error.message }, 'Transcription failed');

      if (error.code === 'insufficient_quota') {
        throw new InternalError('OpenAI API quota exceeded');
      }

      if (error.status === 413) {
        throw new InternalError('Audio file too large for transcription');
      }

      throw new InternalError(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Estimate cost of transcription
   * Whisper pricing: $0.006 per minute
   */
  estimateCost(durationMinutes: number): number {
    return durationMinutes * 0.006;
  }

  /**
   * Check if audio duration is within limits
   */
  checkDurationLimit(durationMinutes: number, tier: string): boolean {
    const limits: Record<string, number> = {
      FREE: 120, // 2 hours per month
      PRO: 600, // 10 hours per month
      ENTERPRISE: Infinity,
    };

    return durationMinutes <= (limits[tier] || 0);
  }
}
