import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsUUID,
} from 'class-validator';
import { DocumentType } from '../entities/legal-document.entity';
import type { DocumentMetadata } from '../entities/legal-document.entity';

export class CreateDocumentDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  title: string;

  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @IsObject()
  @IsOptional()
  metadata?: DocumentMetadata;
}
