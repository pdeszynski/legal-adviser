import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { DocumentsService } from './services/documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { LegalDocument } from './entities/legal-document.entity';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generate(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<LegalDocument> {
    const document = await this.documentsService.create(createDocumentDto);
    return this.documentsService.startGeneration(document.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LegalDocument> {
    return this.documentsService.findByIdOrFail(id);
  }

  // I should probably also add GET / to list documents, matching the service capabilities,
  // but the task specifically asked for POST /api/documents/generate.
  // I'll stick to the requested endpoint + findOne for verification convenience.
}
