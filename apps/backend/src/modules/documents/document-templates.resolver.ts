import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { DocumentTemplate } from './entities/document-template.entity';
import { TemplateEngineService } from './services/template-engine.service';
import { DocumentsService } from './services/documents.service';
import { CreateTemplateInput } from './dto/create-template.input';
import { UpdateTemplateInput } from './dto/update-template.input';
import { GenerateFromTemplateInput } from './dto/generate-from-template.input';
import { LegalDocument } from './entities/legal-document.entity';
import { DocumentType, DocumentStatus } from './entities/legal-document.entity';

@Resolver(() => DocumentTemplate)
@UseGuards(GqlAuthGuard)
export class DocumentTemplatesResolver {
  constructor(
    private readonly templateEngineService: TemplateEngineService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Query(() => [DocumentTemplate], { name: 'documentTemplates' })
  async findAll(): Promise<DocumentTemplate[]> {
    return this.templateEngineService.findAll();
  }

  @Query(() => DocumentTemplate, { name: 'documentTemplate' })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DocumentTemplate> {
    return this.templateEngineService.findByIdOrFail(id);
  }

  @Mutation(() => DocumentTemplate)
  async createDocumentTemplate(
    @Args('input') input: CreateTemplateInput,
  ): Promise<DocumentTemplate> {
    return this.templateEngineService.create(input);
  }

  @Mutation(() => DocumentTemplate)
  async updateDocumentTemplate(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTemplateInput,
  ): Promise<DocumentTemplate> {
    return this.templateEngineService.update(id, input);
  }

  @Mutation(() => Boolean)
  async deleteDocumentTemplate(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.templateEngineService.delete(id);
    return true;
  }

  @Mutation(() => LegalDocument)
  async generateDocumentFromTemplate(
    @Args('input') input: GenerateFromTemplateInput,
  ): Promise<LegalDocument> {
    const { templateId, sessionId, title, variables } = input;

    const template = await this.templateEngineService.findByIdOrFail(
      templateId,
    );

    const processedContent = await this.templateEngineService.processTemplate(
      templateId,
      variables,
    );

    const documentType = this.mapCategoryToDocumentType(template.category);

    const document = await this.documentsService.create({
      sessionId,
      title,
      type: documentType,
      metadata: {
        generatedFromTemplate: true,
        templateId: template.id,
        templateName: template.name,
      },
    });

    // Update with content and status after creation
    await this.documentsService.update(document.id, {
      contentRaw: processedContent,
    });

    // Manually set status and content on the returned object
    // since the update doesn't return the updated document
    document.contentRaw = processedContent;
    document.status = DocumentStatus.COMPLETED;

    return document;
  }

  private mapCategoryToDocumentType(
    category: string,
  ): (typeof DocumentType)[keyof typeof DocumentType] {
    const mapping: Record<
      string,
      (typeof DocumentType)[keyof typeof DocumentType]
    > = {
      LAWSUIT: DocumentType.LAWSUIT,
      COMPLAINT: DocumentType.COMPLAINT,
      CONTRACT: DocumentType.CONTRACT,
      MOTION: DocumentType.OTHER,
      LETTER: DocumentType.OTHER,
      OTHER: DocumentType.OTHER,
    };

    return mapping[category] || DocumentType.OTHER;
  }
}
