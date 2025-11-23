/**
 * Memo Generation Service
 * Uses GPT-4 to generate structured memos from transcripts
 */

import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { InternalError, ValidationError } from '../utils/errors.js';
import { z } from 'zod';

// Schema for generated memo content
const memoContentSchema = z.object({
  summary: z.string().describe('A concise summary of the meeting'),
  keyPoints: z.array(z.string()).describe('Main points discussed'),
  actionItems: z.array(
    z.object({
      task: z.string(),
      owner: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
    })
  ).describe('Action items and tasks'),
  decisions: z.array(z.string()).describe('Decisions made during the meeting'),
  nextSteps: z.array(z.string()).optional().describe('Next steps or follow-ups'),
  attendees: z.array(z.string()).optional().describe('Meeting attendees mentioned'),
});

export type MemoContent = z.infer<typeof memoContentSchema>;

const SYSTEM_PROMPT = `You are an AI assistant that generates structured meeting memos from transcripts.

Your task is to analyze the transcript and create a comprehensive memo with:
1. A concise summary (2-3 sentences)
2. Key points discussed (bullet points)
3. Action items with owners and due dates when mentioned
4. Decisions made
5. Next steps or follow-ups
6. Attendees mentioned in the conversation

Extract information accurately from the transcript. If certain information (like due dates or owners) is not mentioned, omit those fields.

Respond with valid JSON matching the schema.`;

export class MemoGenerationService {
  private openai: OpenAI;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for memo generation service');
    }

    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate structured memo from transcript
   */
  async generateMemo(
    transcript: string,
    metadata?: {
      title?: string;
      participants?: string[];
      date?: Date;
    }
  ): Promise<MemoContent> {
    try {
      logger.info(
        {
          transcriptLength: transcript.length,
          hasMetadata: !!metadata,
        },
        'Starting memo generation'
      );

      // Build user prompt with metadata
      let userPrompt = `Generate a structured memo from the following meeting transcript:\n\n`;

      if (metadata) {
        if (metadata.title) {
          userPrompt += `Meeting Title: ${metadata.title}\n`;
        }
        if (metadata.date) {
          userPrompt += `Date: ${metadata.date.toLocaleDateString()}\n`;
        }
        if (metadata.participants && metadata.participants.length > 0) {
          userPrompt += `Expected Participants: ${metadata.participants.join(', ')}\n`;
        }
        userPrompt += `\n`;
      }

      userPrompt += `Transcript:\n${transcript}`;

      // Call GPT-4 with structured output
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent output
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new InternalError('Empty response from GPT-4');
      }

      // Parse and validate JSON response
      const parsed = JSON.parse(content);
      const validated = memoContentSchema.parse(parsed);

      logger.info(
        {
          summaryLength: validated.summary.length,
          keyPointsCount: validated.keyPoints.length,
          actionItemsCount: validated.actionItems.length,
          decisionsCount: validated.decisions.length,
        },
        'Memo generated successfully'
      );

      return validated;
    } catch (error: any) {
      logger.error({ error, message: error.message }, 'Memo generation failed');

      if (error instanceof z.ZodError) {
        logger.error({ errors: error.flatten() }, 'Invalid memo format from GPT-4');
        throw new ValidationError('Generated memo format is invalid', error.flatten());
      }

      if (error.code === 'insufficient_quota') {
        throw new InternalError('OpenAI API quota exceeded');
      }

      throw new InternalError(`Memo generation failed: ${error.message}`);
    }
  }

  /**
   * Estimate token usage for cost calculation
   * GPT-4o-mini pricing: $0.15/1M input tokens, $0.60/1M output tokens
   */
  estimateCost(transcriptLength: number): number {
    // Rough estimation: 1 token ≈ 4 characters
    const inputTokens = Math.ceil(transcriptLength / 4);
    const estimatedOutputTokens = 500; // Typical memo size

    const inputCost = (inputTokens / 1_000_000) * 0.15;
    const outputCost = (estimatedOutputTokens / 1_000_000) * 0.60;

    return inputCost + outputCost;
  }

  /**
   * Validate transcript before processing
   */
  validateTranscript(transcript: string): boolean {
    if (!transcript || transcript.trim().length === 0) {
      throw new ValidationError('Transcript is empty');
    }

    if (transcript.length < 50) {
      throw new ValidationError('Transcript too short (minimum 50 characters)');
    }

    if (transcript.length > 100000) {
      throw new ValidationError('Transcript too long (maximum 100,000 characters)');
    }

    return true;
  }

  /**
   * Generate a quick summary (for preview/notifications)
   */
  async generateQuickSummary(transcript: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a one-sentence summary of this meeting transcript.',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      return response.choices[0]?.message?.content || 'Summary unavailable';
    } catch (error) {
      logger.error({ error }, 'Quick summary generation failed');
      return 'Summary unavailable';
    }
  }
}
