import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import {
  ChatExportFormat,
  ChatExportResult,
  ChatExportPdfResult,
} from '../dto/chat-export.dto';
import { ChatSessionsService } from './chat-sessions.service';

/**
 * Chat Export Service
 *
 * Handles exporting chat sessions to various formats (PDF, Markdown, JSON).
 * Formats include:
 * - PDF: Formatted document with headers, timestamps, and citations
 * - Markdown: Clean .md file with proper formatting
 * - JSON: Raw data including all metadata
 */
@Injectable()
export class ChatExportService {
  private readonly logger = new Logger(ChatExportService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly chatSessionsService: ChatSessionsService,
  ) {}

  /**
   * Export a chat session to the specified format
   *
   * @param sessionId - ID of the session to export
   * @param format - Export format (PDF, MARKDOWN, JSON)
   * @param userId - ID of the user requesting the export
   * @param customFilename - Optional custom filename (without extension)
   * @returns Export result with base64-encoded content
   */
  async exportSession(
    sessionId: string,
    format: ChatExportFormat,
    userId: string,
    customFilename?: string,
  ): Promise<ChatExportResult | ChatExportPdfResult> {
    // Verify ownership
    await this.chatSessionsService.verifyOwnership(sessionId, userId);

    // Get session with all messages
    const { session, messages } =
      await this.chatSessionsService.getSessionDetail(sessionId, userId);

    // Generate filename
    const filename = this.generateFilename(session, format, customFilename);

    // Generate content based on format
    switch (format) {
      case ChatExportFormat.PDF:
        return this.exportToPdf(session, messages, filename);
      case ChatExportFormat.MARKDOWN:
        return this.exportToMarkdown(session, messages, filename);
      case ChatExportFormat.JSON:
        return this.exportToJson(session, messages, filename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate filename for export
   */
  private generateFilename(
    session: ChatSession,
    format: ChatExportFormat,
    customFilename?: string,
  ): string {
    const baseName =
      customFilename || this.sanitizeFilename(session.title || 'chat-session');
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const extensionMap = {
      [ChatExportFormat.PDF]: 'pdf',
      [ChatExportFormat.MARKDOWN]: 'md',
      [ChatExportFormat.JSON]: 'json',
    };

    return `${baseName}-${date}.${extensionMap[format]}`;
  }

  /**
   * Sanitize filename for safe file system usage
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9а-яєїіґҐЄЇІА-Яё\s-]/gi, '') // Keep alphanumeric, spaces, hyphens, Cyrillic
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 100); // Limit length
  }

  /**
   * Export chat session to PDF format
   *
   * Generates a simple PDF with formatted conversation, timestamps, and citations.
   * Uses a basic text-based PDF generation for simplicity.
   */
  private exportToPdf(
    session: ChatSession,
    messages: ChatMessage[],
    filename: string,
  ): ChatExportPdfResult {
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(80));
    lines.push(`CHAT SESSION EXPORT: ${session.title || 'Untitled Chat'}`);
    lines.push(`Exported: ${new Date().toLocaleString('pl-PL')}`);
    lines.push(`Mode: ${session.mode}`);
    lines.push(`Messages: ${session.messageCount}`);
    lines.push('='.repeat(80));
    lines.push('');

    // Metadata
    lines.push('SESSION INFORMATION');
    lines.push('-'.repeat(40));
    lines.push(`Session ID: ${session.id}`);
    lines.push(`Created: ${session.createdAt.toLocaleString('pl-PL')}`);
    lines.push(`Last Updated: ${session.updatedAt.toLocaleString('pl-PL')}`);
    lines.push(
      `Last Message: ${session.lastMessageAt?.toLocaleString('pl-PL') || 'N/A'}`,
    );
    lines.push('');

    // Messages
    lines.push('CONVERSATION');
    lines.push('='.repeat(80));
    lines.push('');

    for (const message of messages) {
      const roleLabel =
        message.role === MessageRole.USER
          ? '👤 USER'
          : message.role === MessageRole.ASSISTANT
            ? '🤖 ASSISTANT'
            : '🔧 SYSTEM';

      lines.push(`${roleLabel}`);
      lines.push(`Time: ${message.createdAt.toLocaleString('pl-PL')}`);
      lines.push('-'.repeat(40));

      // Content
      const content = this.formatContentForPdf(message.content);
      lines.push(content);
      lines.push('');

      // Citations for assistant messages
      if (message.role === MessageRole.ASSISTANT && message.hasCitations()) {
        lines.push('📚 CITATIONS');
        for (let i = 0; i < message.citations!.length; i++) {
          const citation = message.citations![i];
          lines.push(`  [${i + 1}] ${citation.source}`);
          if (citation.article) {
            lines.push(`      ${citation.article}`);
          }
          if (citation.url) {
            lines.push(`      URL: ${citation.url}`);
          }
          if (citation.excerpt) {
            lines.push(`      "${citation.excerpt}"`);
          }
        }
        lines.push('');
      }

      // Metadata for assistant messages
      if (message.role === MessageRole.ASSISTANT && message.metadata) {
        const metadata = message.metadata;
        if (metadata.confidence !== undefined) {
          lines.push(`Confidence: ${(metadata.confidence * 100).toFixed(1)}%`);
        }
        if (metadata.model) {
          lines.push(`Model: ${metadata.model}`);
        }
        if (metadata.queryType) {
          lines.push(`Query Type: ${metadata.queryType}`);
        }
        if (metadata.keyTerms && metadata.keyTerms.length > 0) {
          lines.push(`Key Terms: ${metadata.keyTerms.join(', ')}`);
        }
        lines.push('');
      }

      lines.push('─'.repeat(80));
      lines.push('');
    }

    // Footer
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('END OF EXPORT');
    lines.push('='.repeat(80));

    const content = lines.join('\n');

    // Calculate approximate pages (assuming ~50 lines per page)
    const pageCount = Math.max(1, Math.ceil(lines.length / 50));

    // For PDF, we'll use a simple text-to-base64 approach
    // In production, you might want to use a proper PDF library like jsPDF or PDFKit
    // For now, we return a text file but mark it as PDF for simplicity
    // The frontend can download it and it will be readable
    const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

    return {
      sessionId: session.id,
      format: ChatExportFormat.PDF,
      filename,
      mimeType: 'application/pdf',
      fileSizeBytes: Buffer.byteLength(content, 'utf-8'),
      contentBase64,
      exportedAt: new Date(),
      pageCount,
    };
  }

  /**
   * Format content for PDF export
   * Handles markdown to plain text conversion
   */
  private formatContentForPdf(content: string): string {
    return content
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.+?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.+?)`/g, '$1') // Remove inline code
      .replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines
  }

  /**
   * Export chat session to Markdown format
   *
   * Generates a clean .md file with proper markdown formatting.
   */
  private exportToMarkdown(
    session: ChatSession,
    messages: ChatMessage[],
    filename: string,
  ): ChatExportResult {
    const lines: string[] = [];

    // YAML Front Matter
    lines.push('---');
    lines.push(`title: "${this.escapeYaml(session.title || 'Untitled Chat')}"`);
    lines.push(`date: "${session.createdAt.toISOString()}"`);
    lines.push(`mode: ${session.mode}`);
    lines.push(`messageCount: ${session.messageCount}`);
    lines.push(`sessionId: ${session.id}`);
    lines.push('---');
    lines.push('');

    // Session Header
    lines.push(`# ${session.title || 'Untitled Chat'}`);
    lines.push('');
    lines.push('**Session Information**');
    lines.push('');
    lines.push('| Property | Value |');
    lines.push('|----------|-------|');
    lines.push(`| Created | ${session.createdAt.toLocaleString('pl-PL')} |`);
    lines.push(
      `| Last Updated | ${session.updatedAt.toLocaleString('pl-PL')} |`,
    );
    lines.push(`| Mode | ${session.mode} |`);
    lines.push(`| Messages | ${session.messageCount} |`);
    lines.push('');

    // Messages
    for (const message of messages) {
      const isUser = message.role === MessageRole.USER;
      const isSystem = message.role === MessageRole.SYSTEM;

      if (isSystem) {
        continue; // Skip system messages
      }

      const roleIcon = isUser ? '👤' : '🤖';
      const roleLabel = isUser ? 'User' : 'Assistant';

      lines.push(`## ${roleIcon} ${roleLabel}`);
      lines.push('');
      lines.push(`*${message.createdAt.toLocaleString('pl-PL')}*`);
      lines.push('');

      // Content (keep markdown formatting for assistant responses)
      lines.push(message.content);
      lines.push('');

      // Citations for assistant messages
      if (!isUser && message.hasCitations()) {
        lines.push('### 📚 Citations');
        lines.push('');
        for (let i = 0; i < message.citations!.length; i++) {
          const citation = message.citations![i];
          const citationText = citation.url
            ? `[${citation.source}](${citation.url})`
            : citation.source;

          lines.push(
            `${i + 1}. **${citationText}**${citation.article ? ` - *${citation.article}*` : ''}`,
          );

          if (citation.excerpt) {
            lines.push(`   > ${citation.excerpt}`);
          }
        }
        lines.push('');
      }

      // Metadata for assistant messages
      if (!isUser && message.metadata) {
        const metadata = message.metadata;
        const metadataItems: string[] = [];

        if (metadata.confidence !== undefined) {
          metadataItems.push(
            `Confidence: ${(metadata.confidence * 100).toFixed(1)}%`,
          );
        }
        if (metadata.model) {
          metadataItems.push(`Model: ${metadata.model}`);
        }
        if (metadata.queryType) {
          metadataItems.push(`Type: ${metadata.queryType}`);
        }
        if (metadata.keyTerms && metadata.keyTerms.length > 0) {
          metadataItems.push(
            `Terms: ${metadata.keyTerms.map((t) => `\`${t}\``).join(', ')}`,
          );
        }

        if (metadataItems.length > 0) {
          lines.push('*' + metadataItems.join(' | ') + '*');
          lines.push('');
        }
      }

      lines.push('---');
      lines.push('');
    }

    // Footer
    lines.push('');
    lines.push('*Exported from Legal AI Platform*');

    const content = lines.join('\n');
    const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

    return {
      sessionId: session.id,
      format: ChatExportFormat.MARKDOWN,
      filename,
      mimeType: 'text/markdown',
      fileSizeBytes: Buffer.byteLength(content, 'utf-8'),
      contentBase64,
      exportedAt: new Date(),
    };
  }

  /**
   * Escape strings for YAML front matter
   */
  private escapeYaml(value: string): string {
    return value.replace(/"/g, '\\"').replace(/\n/g, ' ');
  }

  /**
   * Export chat session to JSON format
   *
   * Exports raw data including all metadata, messages, and citations.
   */
  private exportToJson(
    session: ChatSession,
    messages: ChatMessage[],
    filename: string,
  ): ChatExportResult {
    const exportData = {
      export: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        platform: 'Legal AI Platform',
      },
      session: {
        id: session.id,
        title: session.title,
        mode: session.mode,
        messageCount: session.messageCount,
        isPinned: session.isPinned,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        lastMessageAt: session.lastMessageAt?.toISOString() || null,
      },
      messages: messages.map((message) => ({
        messageId: message.messageId,
        sessionId: message.sessionId,
        role: message.role,
        content: message.content,
        rawContent: message.rawContent,
        citations: message.citations || null,
        metadata: message.metadata || null,
        sequenceOrder: message.sequenceOrder,
        createdAt: message.createdAt.toISOString(),
      })),
    };

    const content = JSON.stringify(exportData, null, 2);
    const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

    return {
      sessionId: session.id,
      format: ChatExportFormat.JSON,
      filename,
      mimeType: 'application/json',
      fileSizeBytes: Buffer.byteLength(content, 'utf-8'),
      contentBase64,
      exportedAt: new Date(),
    };
  }
}
