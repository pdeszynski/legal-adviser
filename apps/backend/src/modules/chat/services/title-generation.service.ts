import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Service for generating chat session titles using AI Engine.
 *
 * This service calls the AI Engine's title generation endpoint
 * to create descriptive titles based on the first user message.
 */
@Injectable()
export class TitleGenerationService {
  private readonly logger = new Logger(TitleGenerationService.name);
  private readonly aiEngineUrl: string;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiEngineUrl = this.configService.get<string>(
      'AI_ENGINE_URL',
      'http://localhost:8000',
    );
    this.timeout = this.configService.get<number>(
      'TITLE_GENERATION_TIMEOUT_MS',
      5000,
    );
  }

  /**
   * Generate a title for a chat session based on the first message.
   *
   * @param firstMessage - The first user message in the session
   * @param sessionId - The session ID for tracking
   * @returns A generated title (3-6 words) or a fallback from the message
   */
  async generateTitle(
    firstMessage: string,
    sessionId: string,
  ): Promise<string> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Generating title for session ${sessionId}: message_length=${firstMessage.length}`,
      );

      const url = `${this.aiEngineUrl}/api/v1/chat/generate-title`;

      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            first_message: firstMessage.substring(0, 500), // Limit input length
            session_id: sessionId,
          },
          {
            timeout: this.timeout,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const title = response.data?.title;

      if (!title || typeof title !== 'string') {
        throw new Error('Invalid response from AI Engine');
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Title generated for session ${sessionId}: title="${title}", duration=${duration}ms`,
      );

      return title;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.warn(
        `Title generation failed for session ${sessionId}, using fallback: error=${error.message}, duration=${duration}ms`,
      );

      // Return fallback title
      return this.generateFallbackTitle(firstMessage);
    }
  }

  /**
   * Generate a simple fallback title from the first message.
   *
   * Used when AI generation fails. Takes the first meaningful words
   * from the message and truncates to ~50 characters.
   *
   * @param message - The first user message
   * @returns A simple title derived from the message
   */
  private generateFallbackTitle(message: string): string {
    // Remove common greetings and prefixes (Polish and English)
    const cleaned = message
      .replace(
        /^(hi|hello|hey|cz[\s]*e[\s]*ść|dzi[\- ]?eki[\- ]?dobry|dobry|dzień dobry|good morning)[,!\s]*/i,
        '',
      )
      .trim();

    // Extract first few meaningful words (skip articles, prepositions)
    const words = cleaned.split(/\s+/).slice(0, 8);

    // Filter out short words and common filler words
    const skipWords = new Set([
      'i',
      'a',
      'w',
      'z',
      'na',
      'do',
      'o',
      'u',
      'za',
      'przez',
      'oraz',
      'lub',
      'the',
      'a',
      'an',
      'is',
      'are',
      'for',
      'to',
      'of',
      'in',
      'at',
      'on',
    ]);

    const meaningfulWords = words.filter(
      (word) => word.length > 2 && !skipWords.has(word.toLowerCase()),
    );

    if (meaningfulWords.length > 0) {
      let title = meaningfulWords.slice(0, 6).join(' ');
      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1);
      // Truncate to ~50 characters if needed
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }
      return title;
    }

    // Final fallback: truncate original message
    if (message.length > 50) {
      return message.substring(0, 47) + '...';
    }
    return message;
  }

  /**
   * Check if the title generation service is available.
   *
   * @returns true if the AI Engine is reachable, false otherwise
   */
  async isAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.aiEngineUrl}/health`, {
          timeout: 2000,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
