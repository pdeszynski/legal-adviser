import {
  Field,
  InputType,
  ObjectType,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import { IsUUID, IsEnum, IsOptional } from 'class-validator';

/**
 * Chat Export Format
 *
 * Supported export formats for chat sessions.
 */
export enum ChatExportFormat {
  /** Portable Document Format - formatted conversation with citations */
  PDF = 'PDF',
  /** Markdown format - clean .md file with proper formatting */
  MARKDOWN = 'MARKDOWN',
  /** JSON format - raw data including all metadata */
  JSON = 'JSON',
}

// Register enum with GraphQL
registerEnumType(ChatExportFormat, {
  name: 'ChatExportFormat',
  description: 'Export format for chat sessions',
});

/**
 * Input for exporting a chat session
 */
@InputType('ExportChatSessionInput')
export class ExportChatSessionInput {
  @Field(() => ID, {
    description: 'ID of the chat session to export',
  })
  @IsUUID()
  sessionId: string;

  @Field(() => ChatExportFormat, {
    description: 'Export format (PDF, MARKDOWN, or JSON)',
  })
  @IsEnum(ChatExportFormat)
  format: ChatExportFormat;

  @Field(() => String, {
    nullable: true,
    description: 'Optional custom filename (without extension)',
  })
  @IsOptional()
  filename?: string;
}

/**
 * Base export result with common fields
 */
@ObjectType('ChatExportResult')
export class ChatExportResult {
  @Field(() => ID, {
    description: 'Session ID that was exported',
  })
  sessionId: string;

  @Field(() => ChatExportFormat, {
    description: 'Format of the export',
  })
  format: ChatExportFormat;

  @Field(() => String, {
    description: 'Filename for the export',
  })
  filename: string;

  @Field(() => String, {
    description: 'MIME type of the export',
  })
  mimeType: string;

  @Field(() => Number, {
    description: 'Size of the export in bytes',
  })
  fileSizeBytes: number;

  @Field(() => String, {
    description: 'Base64-encoded content of the export',
  })
  contentBase64: string;

  @Field(() => GraphQLISODateTime, {
    description: 'Timestamp when the export was generated',
  })
  exportedAt: Date;
}

/**
 * PDF-specific export result with additional metadata
 */
@ObjectType('ChatExportPdfResult')
export class ChatExportPdfResult extends ChatExportResult {
  @Field(() => Number, {
    description: 'Number of pages in the PDF',
  })
  pageCount: number;
}

// Import GraphQLISODateTime for use in the class
import { GraphQLISODateTime } from '@nestjs/graphql';
