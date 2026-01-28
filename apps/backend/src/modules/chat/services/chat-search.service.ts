import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMode } from '../entities/chat-session.entity';
import { MessageRole } from '../entities/chat-message.entity';
import {
  ChatContentSearchArgs,
  ChatContentSearchResult,
  ChatContentSearchResponse,
} from '../dto/chat-search.dto';

/**
 * Service for full-text search across chat messages
 *
 * Uses PostgreSQL full-text search with tsvector for efficient searching.
 * Supports filtering by mode, role, date range, and session title.
 * Provides highlighted content and context previews for matches.
 */
@Injectable()
export class ChatSearchService {
  private readonly logger = new Logger(ChatSearchService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
  ) {}

  /**
   * Perform full-text search across chat messages
   *
   * Uses PostgreSQL tsvector for efficient full-text search.
   * Results are ranked by relevance using ts_rank.
   */
  async searchContent(
    userId: string,
    args: ChatContentSearchArgs,
  ): Promise<ChatContentSearchResponse> {
    const {
      query,
      limit = 20,
      offset = 0,
      mode,
      role,
      sessionTitle,
      dateFrom,
      dateTo,
      contextLength = 150,
    } = args;

    // Validate and sanitize the search query
    const sanitizedQuery = this.sanitizeQuery(query);
    if (!sanitizedQuery) {
      return {
        results: [],
        totalCount: 0,
        count: 0,
        offset: 0,
        hasMore: false,
      };
    }

    // Build the PostgreSQL full-text search query
    const tsQuery = this.buildTsQuery(sanitizedQuery);

    // Main query for search results
    const queryBuilder = this.chatMessageRepository
      .createQueryBuilder('message')
      .select([
        'message.messageId as "messageId"',
        'message.sessionId as "sessionId"',
        'session.title as "sessionTitle"',
        'session.mode as "sessionMode"',
        'message.role as "role"',
        'message.content as "content"',
        'message.createdAt as "createdAt"',
        'message.sequenceOrder as "sequenceOrder"',
        'session.messageCount as "sessionMessageCount"',
        `ts_rank(
          to_tsvector('simple', message.content),
          to_tsquery('simple', :tsQuery)
        ) as "rank"`,
      ])
      .innerJoin('message.session', 'session')
      .where('session.userId = :userId', { userId })
      .andWhere(
        `to_tsvector('simple', message.content) @@ to_tsquery('simple', :tsQuery)`,
        {
          tsQuery,
        },
      )
      .orderBy('rank', 'DESC')
      .addOrderBy('message.createdAt', 'DESC')
      .limit(limit)
      .offset(offset);

    // Apply filters
    if (mode) {
      queryBuilder.andWhere('session.mode = :mode', { mode });
    }

    if (role) {
      queryBuilder.andWhere('message.role = :role', { role });
    }

    if (sessionTitle) {
      queryBuilder.andWhere('session.title ILIKE :sessionTitle', {
        sessionTitle: `%${sessionTitle}%`,
      });
    }

    if (dateFrom) {
      queryBuilder.andWhere('message.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('message.createdAt <= :dateTo', { dateTo });
    }

    // Get total count
    const countQueryBuilder = this.chatMessageRepository
      .createQueryBuilder('message')
      .innerJoin('message.session', 'session')
      .where('session.userId = :userId', { userId })
      .andWhere(
        `to_tsvector('simple', message.content) @@ to_tsquery('simple', :tsQuery)`,
        {
          tsQuery,
        },
      );

    // Apply same filters to count query
    if (mode) {
      countQueryBuilder.andWhere('session.mode = :mode', { mode });
    }

    if (role) {
      countQueryBuilder.andWhere('message.role = :role', { role });
    }

    if (sessionTitle) {
      countQueryBuilder.andWhere('session.title ILIKE :sessionTitle', {
        sessionTitle: `%${sessionTitle}%`,
      });
    }

    if (dateFrom) {
      countQueryBuilder.andWhere('message.createdAt >= :dateFrom', {
        dateFrom,
      });
    }

    if (dateTo) {
      countQueryBuilder.andWhere('message.createdAt <= :dateTo', { dateTo });
    }

    const totalCount = await countQueryBuilder.getCount();
    const rawResults = await queryBuilder.getRawMany();

    // Extract matched terms for highlighting
    const matchedTerms = this.extractMatchedTerms(sanitizedQuery);

    // Process results with highlighting
    const results: ChatContentSearchResult[] = rawResults.map((row: any) => {
      const highlightedContent = this.highlightMatches(
        row.content,
        matchedTerms,
      );
      const contextPreview = this.getContextPreview(
        row.content,
        matchedTerms,
        contextLength,
      );

      return {
        messageId: row.messageId,
        sessionId: row.sessionId,
        sessionTitle: row.sessionTitle,
        sessionMode: row.sessionMode as ChatMode,
        role: row.role,
        content: row.content,
        highlightedContent,
        contextPreview,
        rank: parseFloat(row.rank) || 0,
        matchedTerms,
        createdAt: row.createdAt,
        sequenceOrder: row.sequenceOrder,
        sessionMessageCount: row.sessionMessageCount || 0,
      };
    });

    return {
      results,
      totalCount,
      count: results.length,
      offset,
      hasMore: offset + results.length < totalCount,
    };
  }

  /**
   * Sanitize and normalize search query
   * Removes special characters and normalizes whitespace
   */
  private sanitizeQuery(query: string): string {
    if (!query || query.trim().length === 0) {
      return '';
    }

    // Remove special characters that could break tsquery
    // Keep letters, numbers, spaces, and basic punctuation
    let sanitized = query
      .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Handle quoted phrases for exact matching
    const quotedPhrases: string[] = [];
    const quoteRegex = /"([^"]+)"/g;
    let match;
    while ((match = quoteRegex.exec(query)) !== null) {
      quotedPhrases.push(match[1].replace(/\s+/g, '&'));
    }

    // Remove quoted phrases from sanitized query
    sanitized = sanitized.replace(/"[^"]+"/g, '').trim();

    // Combine: quoted phrases use AND (&), other words use OR (|)
    const terms = sanitized.split(/\s+/).filter((t) => t.length > 0);

    // If we have quoted phrases, they take precedence
    if (quotedPhrases.length > 0) {
      return quotedPhrases.join(' | ');
    }

    // For regular terms, use AND operator for better relevance
    // This ensures all words must be present
    return terms.length > 0 ? terms.join(' & ') : '';
  }

  /**
   * Build PostgreSQL tsquery from sanitized query string
   */
  private buildTsQuery(sanitizedQuery: string): string {
    if (!sanitizedQuery) {
      return '';
    }

    // Handle prefix matching (e.g., "contract*" matches "contract", "contracts", "contractual")
    // PostgreSQL tsquery uses :* for prefix matching
    return sanitizedQuery
      .split(/\s+/)
      .map((term) => {
        // If term doesn't already have a wildcard, add one for prefix matching
        if (term.includes('&') || term.includes('|')) {
          return term; // Compound term, leave as is
        }
        return `${term}:*`;
      })
      .join(' & ');
  }

  /**
   * Extract matched terms from the search query
   * Returns a list of terms for highlighting
   */
  private extractMatchedTerms(query: string): string[] {
    if (!query) {
      return [];
    }

    // Split by operators and quotes to get actual terms
    return query
      .replace(/[&|:*()]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .map((t) => t.toLowerCase());
  }

  /**
   * Highlight matching terms in the content
   * Uses markdown-style highlighting with ** markers
   */
  private highlightMatches(content: string, matchedTerms: string[]): string {
    if (!matchedTerms.length) {
      return content;
    }

    // Create a regex pattern for all matched terms (case-insensitive)
    // Escape special regex characters in terms
    const escapedTerms = matchedTerms.map((term) =>
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );

    if (escapedTerms.length === 0) {
      return content;
    }

    const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

    // Replace matches with highlighted version
    return content.replace(pattern, '**$1**');
  }

  /**
   * Get a context preview around the first match
   * Shows surrounding text for better context
   */
  private getContextPreview(
    content: string,
    matchedTerms: string[],
    contextLength: number,
  ): string | null {
    if (!matchedTerms.length || !content) {
      return null;
    }

    // Find the position of the first match
    let firstMatchPos = -1;
    let firstMatchTerm = '';

    for (const term of matchedTerms) {
      const pos = content.toLowerCase().indexOf(term.toLowerCase());
      if (pos !== -1 && (firstMatchPos === -1 || pos < firstMatchPos)) {
        firstMatchPos = pos;
        firstMatchTerm = term;
      }
    }

    if (firstMatchPos === -1) {
      return null;
    }

    // Calculate window around the match
    const start = Math.max(0, firstMatchPos - contextLength);
    const end = Math.min(
      content.length,
      firstMatchPos + firstMatchTerm.length + contextLength,
    );

    let preview = content.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) {
      preview = '...' + preview;
    }
    if (end < content.length) {
      preview = preview + '...';
    }

    return preview;
  }

  /**
   * Get search suggestions based on partial input
   * Can be used for autocomplete functionality
   */
  async getSearchSuggestions(
    userId: string,
    partial: string,
    limit = 5,
  ): Promise<string[]> {
    if (!partial || partial.trim().length < 2) {
      return [];
    }

    const sanitizedPartial = partial.trim();

    // Search for messages containing the partial term
    const messages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .innerJoin('message.session', 'session')
      .where('session.userId = :userId', { userId })
      .andWhere('message.content ILIKE :partial', {
        partial: `%${sanitizedPartial}%`,
      })
      .select(['message.content'])
      .limit(limit * 3) // Get more to extract unique suggestions
      .getMany();

    // Extract unique words from the messages that start with the partial
    const words = new Set<string>();
    for (const message of messages) {
      const matches = message.content.match(
        new RegExp(`\\b(${sanitizedPartial}\\w*)`, 'gi'),
      );
      if (matches) {
        for (const match of matches) {
          if (match.length >= 3) {
            words.add(match.toLowerCase());
          }
        }
      }
      if (words.size >= limit) {
        break;
      }
    }

    return Array.from(words).slice(0, limit);
  }
}
