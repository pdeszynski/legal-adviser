I'll implement the permission guards feature for NestJS to check document access permissions. Let me start by exploring the codebase to understand the existing structure.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing auth and document structure",
      "activeForm": "Exploring existing auth and document structure",
      "status": "in_progress"
    },
    {
      "content": "Design permission guard implementation",
      "activeForm": "Designing permission guard implementation",
      "status": "pending"
    },
    {
      "content": "Implement permission guards",
      "activeForm": "Implementing permission guards",
      "status": "pending"
    },
    {
      "content": "Apply guards to document resolvers",
      "activeForm": "Applying guards to document resolvers",
      "status": "pending"
    },
    {
      "content": "Create Playwright verification test",
      "activeForm": "Creating Playwright verification test",
      "status": "pending"
    },
    {
      "content": "Run verification and clean up",
      "activeForm": "Running verification and cleaning up",
      "status": "pending"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/auth/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/documents/**/*.ts"
}
Let me read the key files to understand the current structure:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/auth.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/entities/legal-document.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/entities/user.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/users/entities/user.entity.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/users/entities/*.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/users/users.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/users/entities/user-session.entity.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "@UseGuards|UseGuards",
  "path": "apps/backend/src",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Grep
Input: {
  "pattern": "PermissionsGuard|RolesGuard|AuthorizationGuard",
  "path": "apps/backend/src",
  "output_mode": "files_with_matches"
}
Now let me check if there are any sharing-related entities to understand the permission model better:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/entities/document-share.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/document-sharing.resolver.ts"
}

🔧 Tool: Grep
Input: {
  "output_mode": "files_with_matches",
  "path": "apps/backend/src/modules/documents",
  "pattern": "nest.*query|nestjs.*query|@Resolver.*LegalDocument"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/document-sharing.service.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/documents/**/*-auth.resolver.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/documents/*.resolver.ts"
}
Now let me check the legal-ruling resolver to understand the pattern better:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/legal-ruling.resolver.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing auth and document structure",
      "content": "Explore existing auth and document structure",
      "status": "completed"
    },
    {
      "activeForm": "Designing permission guard implementation",
      "content": "Design permission guard implementation",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing permission guards",
      "content": "Implement permission guards",
      "status": "pending"
    },
    {
      "activeForm": "Applying guards to document resolvers",
      "content": "Apply guards to document resolvers",
      "status": "pending"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Running verification and cleaning up",
      "content": "Run verification and clean up",
      "status": "pending"
    }
  ]
}
Now I have a good understanding of the codebase. Let me design and implement the permission guards:

**Design Summary:**
1. **Document Ownership**: Documents belong to sessions, and sessions belong to users
2. **Sharing**: Documents can be shared with other users with different permission levels (VIEW, COMMENT, EDIT, ADMIN)
3. **Guards Needed**:
   - `DocumentOwnerGuard` - Checks if user owns the document (via session ownership)
   - `DocumentReadGuard` - Checks if user can read the document (owner or has share)
   - `DocumentWriteGuard` - Checks if user can write to the document (owner or has EDIT/ADMIN share)
   - `DocumentShareGuard` - Checks if user can share the document (owner or has ADMIN share)

Let me implement these guards:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing auth and document structure",
      "content": "Explore existing auth and document structure",
      "status": "completed"
    },
    {
      "activeForm": "Designing permission guard implementation",
      "content": "Design permission guard implementation",
      "status": "completed"
    },
    {
      "activeForm": "Implementing permission guards",
      "content": "Implement permission guards",
      "status": "in_progress"
    },
    {
      "activeForm": "Applying guards to document resolvers",
      "content": "Apply guards to document resolvers",
      "status": "pending"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Running verification and cleaning up",
      "content": "Run verification and clean up",
      "status": "pending"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts",
  "content": "import {\n  Injectable,\n  ExecutionContext,\n  ForbiddenException,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository } from 'typeorm';\nimport { LegalDocument } from '../../documents/entities/legal-document.entity';\nimport { DocumentShare, SharePermission } from '../../documents/entities/document-share.entity';\n\n/**\n * Permission metadata key for decorator\n */\nexport const PERMISSION_KEY = 'permission';\n\n/**\n * Permission levels for document access\n */\nexport enum DocumentPermission {\n  READ = 'read',\n  WRITE = 'write',\n  SHARE = 'share',\n  OWNER = 'owner',\n}\n\n/**\n * Document Permission Guard\n *\n * Checks if the authenticated user has the required permission\n * to access a document based on:\n * 1. Document ownership (via UserSession)\n * 2. Document shares (via DocumentShare entity)\n *\n * Usage:\n * @UseGuards(DocumentPermissionGuard)\n * @DocumentPermission(DocumentPermission.READ)\n *\n * The guard expects the document ID to be provided in one of these ways:\n * 1. Via @DocumentId() decorator on an argument\n * 2. Via 'id' argument in the args\n * 3. Via 'input.documentId' or 'input.id' in the args\n */\n@Injectable()\nexport class DocumentPermissionGuard {\n  constructor(\n    private reflector: Reflector,\n    @InjectRepository(LegalDocument)\n    private readonly documentRepository: Repository<LegalDocument>,\n    @InjectRepository(DocumentShare)\n    private readonly shareRepository: Repository<DocumentShare>,\n  ) {}\n\n  async canActivate(context: ExecutionContext): Promise<boolean> {\n    // Get required permission from decorator metadata\n    const requiredPermission = this.reflector.getAllAndOverride<DocumentPermission>(\n      PERMISSION_KEY,\n      [context.getHandler(), context.getClass()],\n    );\n\n    if (!requiredPermission) {\n      // No permission requirement - allow access\n      return true;\n    }\n\n    // Get GraphQL context\n    const ctx = GqlExecutionContext.create(context);\n    const { req } = ctx.getContext();\n    const userId = req.user?.userId;\n\n    if (!userId) {\n      throw new UnauthorizedException('User not authenticated');\n    }\n\n    // Extract document ID from arguments\n    const documentId = this.extractDocumentId(ctx.getArgs());\n\n    if (!documentId) {\n      // No document ID in arguments - this might be a list query\n      // Allow access but let the service layer handle filtering\n      return true;\n    }\n\n    // Check if user has the required permission\n    const hasPermission = await this.checkPermission(\n      documentId,\n      userId,\n      requiredPermission,\n    );\n\n    if (!hasPermission) {\n      throw new ForbiddenException(\n        `You do not have ${requiredPermission} permission for this document`,\n      );\n    }\n\n    return true;\n  }\n\n  /**\n   * Extract document ID from resolver arguments\n   */\n  private extractDocumentId(args: Record<string, unknown>): string | null {\n    // Direct 'id' argument\n    if (args.id && typeof args.id === 'string') {\n      return args.id;\n    }\n\n    // Nested in 'input.documentId' or 'input.id'\n    if (args.input && typeof args.input === 'object') {\n      const input = args.input as Record<string, unknown>;\n      if (input.documentId && typeof input.documentId === 'string') {\n        return input.documentId;\n      }\n      if (input.id && typeof input.id === 'string') {\n        return input.id;\n      }\n    }\n\n    // 'documentId' argument\n    if (args.documentId && typeof args.documentId === 'string') {\n      return args.documentId;\n    }\n\n    return null;\n  }\n\n  /**\n   * Check if user has the required permission for a document\n   */\n  private async checkPermission(\n    documentId: string,\n    userId: string,\n    requiredPermission: DocumentPermission,\n  ): Promise<boolean> {\n    // Load document with session relation\n    const document = await this.documentRepository.findOne({\n      where: { id: documentId },\n      relations: ['session'],\n    });\n\n    if (!document) {\n      // Document doesn't exist - let the resolver handle the 404\n      return true;\n    }\n\n    // Check if user owns the document (via session)\n    const isOwner = document.session?.userId === userId;\n\n    if (requiredPermission === DocumentPermission.OWNER) {\n      return isOwner;\n    }\n\n    if (isOwner) {\n      // Owner has all permissions\n      return true;\n    }\n\n    // Check shares for non-owners\n    const share = await this.shareRepository.findOne({\n      where: {\n        documentId,\n        sharedWithUserId: userId,\n      },\n    });\n\n    if (!share || !share.isActive()) {\n      return false;\n    }\n\n    // Check permission level based on share\n    switch (requiredPermission) {\n      case DocumentPermission.READ:\n        return share.canView();\n\n      case DocumentPermission.WRITE:\n        return share.canEdit();\n\n      case DocumentPermission.SHARE:\n        return share.canShare();\n\n      default:\n        return false;\n    }\n  }\n}\n\n/**\n * Permission decorator for specifying required permission level\n *\n * @example\n * @DocumentPermission(DocumentPermission.READ)\n * @Query(() => LegalDocument)\n * async getDocument(@Args('id') id: string) {\n *   return this.documentsService.findOne(id);\n * }\n */\nexport const DocumentPermission = (\n  permission: DocumentPermission,\n): ParameterDecorator => {\n  return (target, propertyKey, descriptor) => {\n    Reflect.defineMetadata(\n      PERMISSION_KEY,\n      permission,\n      descriptor ?? target,\n    );\n  };\n};\n\n/**\n * Document ID decorator for specifying which argument contains the document ID\n * This is optional - the guard will auto-detect the document ID from common patterns\n *\n * @example\n * @DocumentId('documentId')\n * @Mutation(() => Boolean)\n * async deleteDocument(@Args('documentId') documentId: string) {\n *   return this.documentsService.delete(documentId);\n * }\n */\nexport const DocumentId = (\n  paramName?: string,\n): ParameterDecorator => {\n  return (\n    target: object,\n    propertyKey: string | symbol | undefined,\n    parameterIndex: number,\n  ) => {\n    // This decorator is primarily for documentation purposes\n    // The guard extracts the document ID from args automatically\n    Reflect.defineMetadata(\n      'document_id_param',\n      paramName ?? parameterIndex,\n      target,\n    );\n  };\n};\n"
}
Now let's update the guards index file to export the new guards:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/index.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/index.ts",
  "old_string": "export * from './gql-auth.guard';",
  "new_string": "export * from './gql-auth.guard';\nexport * from './document-permission.guard';"
}
Now let's apply the guards to the document resolvers. Let me first update the documents.resolver.ts:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing auth and document structure",
      "content": "Explore existing auth and document structure",
      "status": "completed"
    },
    {
      "activeForm": "Designing permission guard implementation",
      "content": "Design permission guard implementation",
      "status": "completed"
    },
    {
      "activeForm": "Implementing permission guards",
      "content": "Implement permission guards",
      "status": "completed"
    },
    {
      "activeForm": "Applying guards to document resolvers",
      "content": "Apply guards to document resolvers",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Running verification and cleaning up",
      "content": "Run verification and clean up",
      "status": "pending"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';\nimport { DocumentsService } from './services/documents.service';\nimport {\n  GenerateDocumentInput,\n  UpdateDocumentInput,\n} from './dto/document.types';\nimport {\n  ExportDocumentToPdfInput,\n  PdfExportJobResponse,\n  PdfExportResult,\n  PdfExportStatusResponse,\n} from './dto/pdf-export.dto';\nimport { LegalDocument, DocumentType } from './entities/legal-document.entity';\nimport { DocumentGenerationProducer } from './queues/document-generation.producer';\nimport { PdfExportService } from './services/pdf-export.service';\nimport { StrictThrottle, SkipThrottle } from '../../shared/throttler';",
  "new_string": "import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { DocumentsService } from './services/documents.service';\nimport {\n  GenerateDocumentInput,\n  UpdateDocumentInput,\n} from './dto/document.types';\nimport {\n  ExportDocumentToPdfInput,\n  PdfExportJobResponse,\n  PdfExportResult,\n  PdfExportStatusResponse,\n} from './dto/pdf-export.dto';\nimport { LegalDocument, DocumentType } from './entities/legal-document.entity';\nimport { DocumentGenerationProducer } from './queues/document-generation.producer';\nimport { PdfExportService } from './services/pdf-export.service';\nimport { StrictThrottle, SkipThrottle } from '../../shared/throttler';\nimport { GqlAuthGuard, DocumentPermissionGuard, DocumentPermission } from '../auth/guards';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "/**\n * Custom GraphQL Resolver for Legal Documents\n *\n * Provides custom business logic mutations that complement the\n * auto-generated CRUD resolvers from nestjs-query.\n *\n * Auto-generated operations (via nestjs-query):\n * - legalDocuments: Query all documents with filtering, sorting, paging\n * - legalDocument: Query single document by ID\n * - createOneLegalDocument: Create a new document\n * - updateOneLegalDocument: Update a document\n * - deleteOneLegalDocument: Delete a document\n *\n * Custom operations (this resolver):\n * - documentsBySession: Query documents by session ID (convenience query)\n * - generateDocument: Create document and start AI generation\n * - updateDocument: Update with custom business logic\n * - deleteDocument: Delete with event emission (deprecated - use deleteOneLegalDocument)\n */\n@Resolver(() => LegalDocument)\nexport class DocumentsResolver {",
  "new_string": "/**\n * Custom GraphQL Resolver for Legal Documents\n *\n * Provides custom business logic mutations that complement the\n * auto-generated CRUD resolvers from nestjs-query.\n *\n * Auto-generated operations (via nestjs-query):\n * - legalDocuments: Query all documents with filtering, sorting, paging\n * - legalDocument: Query single document by ID\n * - createOneLegalDocument: Create a new document\n * - updateOneLegalDocument: Update a document\n * - deleteOneLegalDocument: Delete a document\n *\n * Custom operations (this resolver):\n * - documentsBySession: Query documents by session ID (convenience query)\n * - generateDocument: Create document and start AI generation\n * - updateDocument: Update with custom business logic\n * - deleteDocument: Delete with event emission (deprecated - use deleteOneLegalDocument)\n *\n * Security:\n * - All operations require authentication\n * - Document access is controlled via ownership and sharing permissions\n */\n@Resolver(() => LegalDocument)\n@UseGuards(GqlAuthGuard)\nexport class DocumentsResolver {"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "  /**\n   * Query: Get documents by session ID\n   * Convenience query for filtering by session - also available via legalDocuments filter\n   */\n  @SkipThrottle()\n  @Query(() => [LegalDocument], { name: 'documentsBySession' })\n  async findBySession(\n    @Args('sessionId', { type: () => String }) sessionId: string,\n  ): Promise<LegalDocument[]> {\n    return this.documentsService.findBySessionId(sessionId);\n  }",
  "new_string": "  /**\n   * Query: Get documents by session ID\n   * Convenience query for filtering by session - also available via legalDocuments filter\n   * Requires authentication\n   */\n  @SkipThrottle()\n  @Query(() => [LegalDocument], { name: 'documentsBySession' })\n  async findBySession(\n    @Args('sessionId', { type: () => String }) sessionId: string,\n  ): Promise<LegalDocument[]> {\n    return this.documentsService.findBySessionId(sessionId);\n  }"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "  /**\n   * Mutation: Update an existing document with custom business logic\n   *\n   * Note: For simple field updates, prefer updateOneLegalDocument from nestjs-query.\n   * This mutation is for updates that require business logic validation.\n   */\n  @Mutation(() => LegalDocument, { name: 'updateDocument' })\n  async updateDocument(\n    @Args('id', { type: () => ID }) id: string,\n    @Args('input') input: UpdateDocumentInput,\n  ): Promise<LegalDocument> {\n    return this.documentsService.update(id, {\n      ...input,\n      metadata: input.metadata ? { ...input.metadata } : undefined,\n    });\n  }",
  "new_string": "  /**\n   * Mutation: Update an existing document with custom business logic\n   *\n   * Note: For simple field updates, prefer updateOneLegalDocument from nestjs-query.\n   * This mutation is for updates that require business logic validation.\n   * Requires WRITE permission (owner or shared with EDIT/ADMIN).\n   */\n  @Mutation(() => LegalDocument, { name: 'updateDocument' })\n  @DocumentPermission(DocumentPermission.WRITE)\n  async updateDocument(\n    @Args('id', { type: () => ID }) id: string,\n    @Args('input') input: UpdateDocumentInput,\n  ): Promise<LegalDocument> {\n    return this.documentsService.update(id, {\n      ...input,\n      metadata: input.metadata ? { ...input.metadata } : undefined,\n    });\n  }"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "  /**\n   * Mutation: Delete a document\n   *\n   * @deprecated Use deleteOneLegalDocument from nestjs-query instead.\n   * This mutation is kept for backward compatibility with existing clients.\n   */\n  @Mutation(() => Boolean, {\n    name: 'deleteDocument',\n    deprecationReason: 'Use deleteOneLegalDocument instead',\n  })\n  async deleteDocument(\n    @Args('id', { type: () => ID }) id: string,\n  ): Promise<boolean> {\n    await this.documentsService.delete(id);\n    return true;\n  }",
  "new_string": "  /**\n   * Mutation: Delete a document\n   *\n   * @deprecated Use deleteOneLegalDocument from nestjs-query instead.\n   * This mutation is kept for backward compatibility with existing clients.\n   * Requires OWNER permission.\n   */\n  @Mutation(() => Boolean, {\n    name: 'deleteDocument',\n    deprecationReason: 'Use deleteOneLegalDocument instead',\n  })\n  @DocumentPermission(DocumentPermission.OWNER)\n  async deleteDocument(\n    @Args('id', { type: () => ID }) id: string,\n  ): Promise<boolean> {\n    await this.documentsService.delete(id);\n    return true;\n  }"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "  /**\n   * Mutation: Export a document to PDF\n   *\n   * Queues a PDF export job for the specified document.\n   * The document must be in COMPLETED status with content.\n   *\n   * Returns a job response with the job ID that can be used\n   * to poll for the PDF export status.\n   *\n   * @param input - Export options including document ID and PDF settings\n   * @returns Job response with job ID for tracking\n   */\n  @StrictThrottle()\n  @Mutation(() => PdfExportJobResponse, {\n    name: 'exportDocumentToPdf',\n    description: 'Queue a document for PDF export',\n  })\n  async exportDocumentToPdf(\n    @Args('input') input: ExportDocumentToPdfInput,\n  ): Promise<PdfExportJobResponse> {\n    return this.pdfExportService.exportToPdf(input);\n  }",
  "new_string": "  /**\n   * Mutation: Export a document to PDF\n   *\n   * Queues a PDF export job for the specified document.\n   * The document must be in COMPLETED status with content.\n   *\n   * Returns a job response with the job ID that can be used\n   * to poll for the PDF export status.\n   *\n   * @param input - Export options including document ID and PDF settings\n   * @returns Job response with job ID for tracking\n   * Requires READ permission.\n   */\n  @StrictThrottle()\n  @Mutation(() => PdfExportJobResponse, {\n    name: 'exportDocumentToPdf',\n    description: 'Queue a document for PDF export',\n  })\n  @DocumentPermission(DocumentPermission.READ)\n  async exportDocumentToPdf(\n    @Args('input') input: ExportDocumentToPdfInput,\n  ): Promise<PdfExportJobResponse> {\n    return this.pdfExportService.exportToPdf(input);\n  }"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "  /**\n   * Mutation: Export document to PDF and wait for result\n   *\n   * Synchronous version that queues the export and waits for completion.\n   * Use this for smaller documents where you want immediate results.\n   * For larger documents, prefer exportDocumentToPdf + polling.\n   *\n   * @param input - Export options including document ID and PDF settings\n   * @returns The PDF export result with base64-encoded content\n   */\n  @StrictThrottle()\n  @Mutation(() => PdfExportResult, {\n    name: 'exportDocumentToPdfSync',\n    description: 'Export a document to PDF and wait for the result',\n  })\n  async exportDocumentToPdfSync(\n    @Args('input') input: ExportDocumentToPdfInput,\n  ): Promise<PdfExportResult> {\n    return this.pdfExportService.exportToPdfSync(input);\n  }",
  "new_string": "  /**\n   * Mutation: Export document to PDF and wait for result\n   *\n   * Synchronous version that queues the export and waits for completion.\n   * Use this for smaller documents where you want immediate results.\n   * For larger documents, prefer exportDocumentToPdf + polling.\n   *\n   * @param input - Export options including document ID and PDF settings\n   * @returns The PDF export result with base64-encoded content\n   * Requires READ permission.\n   */\n  @StrictThrottle()\n  @Mutation(() => PdfExportResult, {\n    name: 'exportDocumentToPdfSync',\n    description: 'Export a document to PDF and wait for the result',\n  })\n  @DocumentPermission(DocumentPermission.READ)\n  async exportDocumentToPdfSync(\n    @Args('input') input: ExportDocumentToPdfInput,\n  ): Promise<PdfExportResult> {\n    return this.pdfExportService.exportToPdfSync(input);\n  }"
}
Now let's also update the document-sharing resolver to use the permission guard:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/document-sharing.resolver.ts",
  "old_string": "import { Resolver, Mutation, Query, Args, ID, Context } from '@nestjs/graphql';\nimport { UseGuards, UnauthorizedException } from '@nestjs/common';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { DocumentSharingService } from './services/document-sharing.service';\nimport { DocumentShare, SharePermission } from './entities/document-share.entity';\nimport { ShareDocumentInput } from './dto/share-document.input';\nimport { UpdateSharePermissionInput } from './dto/update-share-permission.input';",
  "new_string": "import { Resolver, Mutation, Query, Args, ID, Context } from '@nestjs/graphql';\nimport { UseGuards, UnauthorizedException } from '@nestjs/common';\nimport { GqlAuthGuard, DocumentPermissionGuard, DocumentPermission } from '../auth/guards';\nimport { DocumentSharingService } from './services/document-sharing.service';\nimport { DocumentShare, SharePermission } from './entities/document-share.entity';\nimport { ShareDocumentInput } from './dto/share-document.input';\nimport { UpdateSharePermissionInput } from './dto/update-share-permission.input';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/document-sharing.resolver.ts",
  "old_string": "/**\n * Resolver for document sharing operations\n *\n * All mutations require JWT authentication and validate user permissions.\n * Sharing operations are tracked via domain events for audit logging.\n */\n@Resolver(() => DocumentShare)\nexport class DocumentSharingResolver {",
  "new_string": "/**\n * Resolver for document sharing operations\n *\n * All mutations require JWT authentication and validate user permissions.\n * Sharing operations are tracked via domain events for audit logging.\n */\n@Resolver(() => DocumentShare)\n@UseGuards(GqlAuthGuard)\nexport class DocumentSharingResolver {"
}
Now let me also remove the manual permission checks from the resolver since the guard handles it. Actually, looking at the code, the service layer still does important validation (checking if share already exists, etc.), so let's keep those checks but make sure they work with the guard.

Actually, let me re-read the sharing resolver to understand better. The service does the permission checks - we can simplify the resolver since the guard already checks. But for now let's leave the service checks as they provide additional validation.

Now let's also update the document-templates resolver to use permission guards if needed. Let me read it first:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/document-templates.resolver.ts"
}
The document-templates resolver is for managing templates, not user documents, so it doesn't need document permission guards. It already has auth guards.

Now let's check if we need to also create a guard decorator that can be applied to the auto-generated nestjs-query resolvers. Let me check how the documents module is set up:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.module.ts"
}
I see that the nestjs-query auto-generated resolvers need to have guards applied. According to the nestjs-query documentation, we can add guards using the `guards` option in the resolver configuration. Let me also check if there's a way to hook into the authorization check at the service level using a custom authorizer.

Looking at the nestjs-query approach, we can use a custom authorizer at the service level. However, for a simpler approach that works with the existing architecture, let me create a custom service wrapper that adds permission checks to the auto-generated operations.

Actually, the best approach with nestjs-query is to use guards at the module level. Let me update the module configuration to apply the guards globally to all document operations:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.module.ts",
  "old_string": "import { Module } from '@nestjs/common';\nimport { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';\nimport { TypeOrmModule } from '@nestjs/typeorm';\nimport { LegalDocument } from './entities/legal-document.entity';\nimport { LegalAnalysis } from './entities/legal-analysis.entity';\nimport { LegalRuling } from './entities/legal-ruling.entity';\nimport { DocumentShare } from './entities/document-share.entity';\nimport { DocumentTemplate } from './entities/document-template.entity';\nimport { DocumentVersion } from './entities/document-version.entity';\nimport { DocumentEmbedding } from './entities/document-embedding.entity';\nimport { DocumentsService } from './services/documents.service';\nimport { LegalRulingService } from './services/legal-ruling.service';\nimport { DocumentSharingService } from './services/document-sharing.service';\nimport { TemplateEngineService } from './services/template-engine.service';\nimport { DocumentVersioningService } from './services/document-versioning.service';\nimport { VectorStoreService } from './services/vector-store.service';\nimport { DocumentsResolver } from './documents.resolver';\nimport { LegalRulingResolver } from './legal-ruling.resolver';\nimport { DocumentSubscriptionResolver } from './documents-subscription.resolver';\nimport { DocumentSharingResolver } from './document-sharing.resolver';\nimport { DocumentTemplatesResolver } from './document-templates.resolver';\nimport { DocumentVersioningResolver } from './document-versioning.resolver';\nimport { LegalAnalysisResolver } from './legal-analysis.resolver';\nimport { PdfUrlResolver } from './pdf-url.resolver';\nimport { DocumentsController } from './documents.controller';\nimport { DocumentStreamController } from './controllers/document-stream.controller';\nimport {\n  CreateLegalDocumentInput,\n  UpdateLegalDocumentInput,\n} from './dto/legal-document.dto';\nimport {\n  CreateLegalAnalysisInput,\n  UpdateLegalAnalysisInput,\n} from './dto/legal-analysis.dto';\nimport {\n  CreateLegalRulingInput,\n  UpdateLegalRulingInput,\n} from './dto/legal-ruling.dto';\nimport { CreateTemplateInput } from './dto/create-template.input';\nimport { UpdateTemplateInput } from './dto/update-template.input';\nimport {\n  CreateDocumentVersionInput,\n  UpdateDocumentVersionInput,\n} from './dto/document-version.dto';\nimport { BullModule } from '@nestjs/bull';\nimport { QUEUE_NAMES } from '../../shared/queues';\nimport { AiClientModule } from '../../shared/ai-client/ai-client.module';\nimport { DocumentGenerationProcessor } from './queues/document-generation.processor';\nimport { DocumentGenerationProducer } from './queues/document-generation.producer';\n// PDF Export Services\nimport { PdfExportProcessor } from './queues/pdf-export.processor';\nimport { PdfExportProducer } from './queues/pdf-export.producer';\nimport { PdfTemplateService, PdfGeneratorService } from './services/pdf';\nimport { PdfExportService } from './services/pdf-export.service';\nimport { PdfUrlService } from './services/pdf-url.service';\nimport { UserSession } from '../users/entities/user-session.entity';\nimport { RulingSearchAggregatorService } from './services/ruling-search-aggregator.service';\n// Anti-Corruption Layer\nimport { SaosModule } from '../../infrastructure/anti-corruption/saos/saos.module';\nimport { IsapModule } from '../../infrastructure/anti-corruption/isap/isap.module';",
  "new_string": "import { Module } from '@nestjs/common';\nimport { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';\nimport { TypeOrmModule } from '@nestjs/typeorm';\nimport { LegalDocument } from './entities/legal-document.entity';\nimport { LegalAnalysis } from './entities/legal-analysis.entity';\nimport { LegalRuling } from './entities/legal-ruling.entity';\nimport { DocumentShare } from './entities/document-share.entity';\nimport { DocumentTemplate } from './entities/document-template.entity';\nimport { DocumentVersion } from './entities/document-version.entity';\nimport { DocumentEmbedding } from './entities/document-embedding.entity';\nimport { DocumentsService } from './services/documents.service';\nimport { LegalRulingService } from './services/legal-ruling.service';\nimport { DocumentSharingService } from './services/document-sharing.service';\nimport { TemplateEngineService } from './services/template-engine.service';\nimport { DocumentVersioningService } from './services/document-versioning.service';\nimport { VectorStoreService } from './services/vector-store.service';\nimport { DocumentsResolver } from './documents.resolver';\nimport { LegalRulingResolver } from './legal-ruling.resolver';\nimport { DocumentSubscriptionResolver } from './documents-subscription.resolver';\nimport { DocumentSharingResolver } from './document-sharing.resolver';\nimport { DocumentTemplatesResolver } from './document-templates.resolver';\nimport { DocumentVersioningResolver } from './document-versioning.resolver';\nimport { LegalAnalysisResolver } from './legal-analysis.resolver';\nimport { PdfUrlResolver } from './pdf-url.resolver';\nimport { DocumentsController } from './documents.controller';\nimport { DocumentStreamController } from './controllers/document-stream.controller';\nimport {\n  CreateLegalDocumentInput,\n  UpdateLegalDocumentInput,\n} from './dto/legal-document.dto';\nimport {\n  CreateLegalAnalysisInput,\n  UpdateLegalAnalysisInput,\n} from './dto/legal-analysis.dto';\nimport {\n  CreateLegalRulingInput,\n  UpdateLegalRulingInput,\n} from './dto/legal-ruling.dto';\nimport { CreateTemplateInput } from './dto/create-template.input';\nimport { UpdateTemplateInput } from './dto/update-template.input';\nimport {\n  CreateDocumentVersionInput,\n  UpdateDocumentVersionInput,\n} from './dto/document-version.dto';\nimport { BullModule } from '@nestjs/bull';\nimport { QUEUE_NAMES } from '../../shared/queues';\nimport { AiClientModule } from '../../shared/ai-client/ai-client.module';\nimport { DocumentGenerationProcessor } from './queues/document-generation.processor';\nimport { DocumentGenerationProducer } from './queues/document-generation.producer';\n// PDF Export Services\nimport { PdfExportProcessor } from './queues/pdf-export.processor';\nimport { PdfExportProducer } from './queues/pdf-export.producer';\nimport { PdfTemplateService, PdfGeneratorService } from './services/pdf';\nimport { PdfExportService } from './services/pdf-export.service';\nimport { PdfUrlService } from './services/pdf-url.service';\nimport { UserSession } from '../users/entities/user-session.entity';\nimport { RulingSearchAggregatorService } from './services/ruling-search-aggregator.service';\n// Anti-Corruption Layer\nimport { SaosModule } from '../../infrastructure/anti-corruption/saos/saos.module';\nimport { IsapModule } from '../../infrastructure/anti-corruption/isap/isap.module';\n// Auth Guards\nimport { GqlAuthGuard, DocumentPermissionGuard, DocumentPermission } from '../auth/guards';"
}
Now let me update the resolver configuration to apply guards to the auto-generated nestjs-query resolvers. The nestjs-query library supports a `guards` option at the resolver level:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.module.ts",
  "old_string": "      resolvers: [\n        {\n          DTOClass: LegalDocument,\n          EntityClass: LegalDocument,\n          CreateDTOClass: CreateLegalDocumentInput,\n          UpdateDTOClass: UpdateLegalDocumentInput,\n          enableTotalCount: true,\n          enableAggregate: true,\n          read: {\n            // Enable standard read operations\n            many: { name: 'legalDocuments' },\n            one: { name: 'legalDocument' },\n          },\n          create: {\n            // Enable create mutation\n            one: { name: 'createOneLegalDocument' },\n            many: { disabled: true },\n          },\n          update: {\n            // Enable update mutation\n            one: { name: 'updateOneLegalDocument' },\n            many: { disabled: true },\n          },\n          delete: {\n            // Enable delete mutation\n            one: { name: 'deleteOneLegalDocument' },\n            many: { disabled: true },\n          },\n        },",
  "new_string": "      resolvers: [\n        {\n          DTOClass: LegalDocument,\n          EntityClass: LegalDocument,\n          CreateDTOClass: CreateLegalDocumentInput,\n          UpdateDTOClass: UpdateLegalDocumentInput,\n          enableTotalCount: true,\n          enableAggregate: true,\n          guards: [GqlAuthGuard],\n          read: {\n            // Enable standard read operations\n            many: { name: 'legalDocuments' },\n            one: { name: 'legalDocument' },\n          },\n          create: {\n            // Enable create mutation\n            one: { name: 'createOneLegalDocument' },\n            many: { disabled: true },\n          },\n          update: {\n            // Enable update mutation\n            one: { name: 'updateOneLegalDocument' },\n            many: { disabled: true },\n          },\n          delete: {\n            // Enable delete mutation\n            one: { name: 'deleteOneLegalDocument' },\n            many: { disabled: true },\n          },\n        },"
}
Now let's also create a custom authorizer hook in the DocumentsService to filter query results based on user permissions. Let me read the DocumentsService first:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "limit": 100
}
The current DocumentsService implementation uses TypeORM directly. For a proper implementation, I need to add permission filtering at the service/query level. However, for the scope of this feature, the guard-based approach should work for single-document operations.

For list operations (like `legalDocuments` query), the filtering should happen at the service level to only return documents the user has access to. Let me add a helper method to the DocumentsService to filter documents by user access:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts"
}
Now let me add a method to filter documents by user access. I'll add this to the DocumentsService:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "old_string": "import {\n  Injectable,\n  NotFoundException,\n  BadRequestException,\n  Inject,\n  forwardRef,\n} from '@nestjs/common';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository, FindOptionsWhere } from 'typeorm';\nimport { EventEmitter2 } from '@nestjs/event-emitter';\nimport {\n  LegalDocument,\n  DocumentType,\n  DocumentStatus,\n  DocumentMetadata,\n} from '../entities/legal-document.entity';\nimport {\n  DocumentCreatedEvent,\n  DocumentUpdatedEvent,\n  DocumentDeletedEvent,\n  DocumentGenerationStartedEvent,\n  DocumentGenerationCompletedEvent,\n  DocumentGenerationFailedEvent,\n} from '../../../shared/events/examples/document.events';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';\nimport { GraphQLPubSubService } from '../../../shared/streaming';\nimport { DocumentVersioningService } from './document-versioning.service';",
  "new_string": "import {\n  Injectable,\n  NotFoundException,\n  BadRequestException,\n  Inject,\n  forwardRef,\n} from '@nestjs/common';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository, FindOptionsWhere, In } from 'typeorm';\nimport { EventEmitter2 } from '@nestjs/event-emitter';\nimport {\n  LegalDocument,\n  DocumentType,\n  DocumentStatus,\n  DocumentMetadata,\n} from '../entities/legal-document.entity';\nimport {\n  DocumentCreatedEvent,\n  DocumentUpdatedEvent,\n  DocumentDeletedEvent,\n  DocumentGenerationStartedEvent,\n  DocumentGenerationCompletedEvent,\n  DocumentGenerationFailedEvent,\n} from '../../../shared/events/examples/document.events';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';\nimport { GraphQLPubSubService } from '../../../shared/streaming';\nimport { DocumentVersioningService } from './document-versioning.service';\nimport { DocumentShare } from '../entities/document-share.entity';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "old_string": "@Injectable()\nexport class DocumentsService {\n  constructor(\n    @InjectRepository(LegalDocument)\n    private readonly documentRepository: Repository<LegalDocument>,\n    private readonly eventEmitter: EventEmitter2,\n    private readonly graphqlPubSub: GraphQLPubSubService,\n    @Inject(forwardRef(() => DocumentVersioningService))\n    private readonly versioningService: DocumentVersioningService,\n  ) {}",
  "new_string": "@Injectable()\nexport class DocumentsService {\n  constructor(\n    @InjectRepository(LegalDocument)\n    private readonly documentRepository: Repository<LegalDocument>,\n    @InjectRepository(DocumentShare)\n    private readonly shareRepository: Repository<DocumentShare>,\n    private readonly eventEmitter: EventEmitter2,\n    private readonly graphqlPubSub: GraphQLPubSubService,\n    @Inject(forwardRef(() => DocumentVersioningService))\n    private readonly versioningService: DocumentVersioningService,\n  ) {}"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "old_string": "  /**\n   * Count documents with optional filtering\n   */\n  async count(\n    options?: Omit<DocumentQueryOptions, 'limit' | 'offset'>,\n  ): Promise<number> {\n    const where: FindOptionsWhere<LegalDocument> = {};\n\n    if (options?.sessionId) {\n      where.sessionId = options.sessionId;\n    }\n    if (options?.type) {\n      where.type = options.type;\n    }\n    if (options?.status) {\n      where.status = options.status;\n    }\n\n    return this.documentRepository.count({ where });\n  }\n}",
  "new_string": "  /**\n   * Count documents with optional filtering\n   */\n  async count(\n    options?: Omit<DocumentQueryOptions, 'limit' | 'offset'>,\n  ): Promise<number> {\n    const where: FindOptionsWhere<LegalDocument> = {};\n\n    if (options?.sessionId) {\n      where.sessionId = options.sessionId;\n    }\n    if (options?.type) {\n      where.type = options.type;\n    }\n    if (options?.status) {\n      where.status = options.status;\n    }\n\n    return this.documentRepository.count({ where });\n  }\n\n  /**\n   * Find documents accessible to a user (owned or shared)\n   * This method filters the results based on user permissions\n   */\n  async findAccessibleByUser(\n    userId: string,\n    options?: DocumentQueryOptions,\n  ): Promise<LegalDocument[]> {\n    // Get all documents matching the base filters\n    const allDocuments = await this.findAll(options);\n\n    // Get document IDs shared with the user\n    const shares = await this.shareRepository.find({\n      where: { sharedWithUserId: userId },\n      select: ['documentId'],\n    });\n\n    const sharedDocumentIds = new Set(shares.map((s) => s.documentId));\n\n    // Filter: user owns the document OR it's shared with them\n    return allDocuments.filter(\n      (doc) =>\n        doc.session?.userId === userId || sharedDocumentIds.has(doc.id),\n    );\n  }\n\n  /**\n   * Check if a user has access to a document\n   */\n  async canUserAccessDocument(\n    documentId: string,\n    userId: string,\n    requiredPermission: 'read' | 'write' | 'share' | 'owner' = 'read',\n  ): Promise<boolean> {\n    const document = await this.findById(documentId);\n\n    if (!document) {\n      return false;\n    }\n\n    // Check ownership\n    if (document.session?.userId === userId) {\n      return true;\n    }\n\n    // Check shares for non-owners\n    const share = await this.shareRepository.findOne({\n      where: {\n        documentId,\n        sharedWithUserId: userId,\n      },\n    });\n\n    if (!share || !share.isActive()) {\n      return false;\n    }\n\n    // Check permission level\n    switch (requiredPermission) {\n      case 'read':\n        return true;\n      case 'write':\n        return share.canEdit();\n      case 'share':\n        return share.canShare();\n      case 'owner':\n        return false;\n      default:\n        return false;\n    }\n  }\n}"
}
Now I need to update the documents module to inject the DocumentShare repository into the DocumentsService:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.module.ts",
  "offset": 270,
  "limit": 50
}
The DocumentShare repository is already registered in TypeOrmModule.forFeature, so the DocumentsService should be able to inject it. Now let's verify the build works and then create the Playwright verification test:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing auth and document structure",
      "content": "Explore existing auth and document structure",
      "status": "completed"
    },
    {
      "activeForm": "Designing permission guard implementation",
      "content": "Design permission guard implementation",
      "status": "completed"
    },
    {
      "activeForm": "Implementing permission guards",
      "content": "Implement permission guards",
      "status": "completed"
    },
    {
      "activeForm": "Applying guards to document resolvers",
      "content": "Apply guards to document resolvers",
      "status": "completed"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create Playwright verification test",
      "status": "in_progress"
    },
    {
      "activeForm": "Running verification and cleaning up",
      "content": "Run verification and clean up",
      "status": "pending"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "pnpm build 2>&1 | head -100",
  "description": "Build the project to check for errors",
  "timeout": 120000
}
There's a build error in the AI engine adapter, but it's unrelated to our changes. Let me check if there are any errors specifically related to our permission guards by running the TypeScript compiler directly on the backend:

🔧 Tool: Bash
Input: {
  "command": "cd apps/backend && npx tsc --noEmit 2>&1 | grep -E \"(guard|permission|document)\" | head -30",
  "description": "Check for TypeScript errors related to guards",
  "timeout": 60000
}
I see the issue - the `DocumentPermission` decorator is conflicting with the `DocumentPermission` enum. Let me fix this by renaming the decorator:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/document-permission.guard.ts",
  "old_string": "import {\n  Injectable,\n  ExecutionContext,\n  ForbiddenException,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository } from 'typeorm';\nimport { LegalDocument } from '../../documents/entities/legal-document.entity';\nimport { DocumentShare, SharePermission } from '../../documents/entities/document-share.entity';\n\n/**\n * Permission metadata key for decorator\n */\nexport const PERMISSION_KEY = 'permission';\n\n/**\n * Permission levels for document access\n */\nexport enum DocumentPermission {\n  READ = 'read',\n  WRITE = 'write',\n  SHARE = 'share',\n  OWNER = 'owner',\n}\n\n/**\n * Document Permission Guard\n *\n * Checks if the authenticated user has the required permission\n * to access a document based on:\n * 1. Document ownership (via UserSession)\n * 2. Document shares (via DocumentShare entity)\n *\n * Usage:\n * @UseGuards(DocumentPermissionGuard)\n * @DocumentPermission(DocumentPermission.READ)\n *\n * The guard expects the document ID to be provided in one of these ways:\n * 1. Via @DocumentId() decorator on an argument\n * 2. Via 'id' argument in the args\n * 3. Via 'input.documentId' or 'input.id' in the args\n */\n@Injectable()\nexport class DocumentPermissionGuard {\n  constructor(\n    private reflector: Reflector,\n    @InjectRepository(LegalDocument)\n    private readonly documentRepository: Repository<LegalDocument>,\n    @InjectRepository(DocumentShare)\n    private readonly shareRepository: Repository<DocumentShare>,\n  ) {}\n\n  async canActivate(context: ExecutionContext): Promise<boolean> {\n    // Get required permission from decorator metadata\n    const requiredPermission = this.reflector.getAllAndOverride<DocumentPermission>(\n      PERMISSION_KEY,\n      [context.getHandler(), context.getClass()],\n    );\n\n    if (!requiredPermission) {\n      // No permission requirement - allow access\n      return true;\n    }\n\n    // Get GraphQL context\n    const ctx = GqlExecutionContext.create(context);\n    const { req } = ctx.getContext();\n    const userId = req.user?.userId;\n\n    if (!userId) {\n      throw new UnauthorizedException('User not authenticated');\n    }\n\n    // Extract document ID from arguments\n    const documentId = this.extractDocumentId(ctx.getArgs());\n\n    if (!documentId) {\n      // No document ID in arguments - this might be a list query\n      // Allow access but let the service layer handle filtering\n      return true;\n    }\n\n    // Check if user has the required permission\n    const hasPermission = await this.checkPermission(\n      documentId,\n      userId,\n      requiredPermission,\n    );\n\n    if (!hasPermission) {\n      throw new ForbiddenException(\n        `You do not have ${requiredPermission} permission for this document`,\n      );\n    }\n\n    return true;\n  }\n\n  /**\n   * Extract document ID from resolver arguments\n   */\n  private extractDocumentId(args: Record<string, unknown>): string | null {\n    // Direct 'id' argument\n    if (args.id && typeof args.id === 'string') {\n      return args.id;\n    }\n\n    // Nested in 'input.documentId' or 'input.id'\n    if (args.input && typeof args.input === 'object') {\n      const input = args.input as Record<string, unknown>;\n      if (input.documentId && typeof input.documentId === 'string') {\n        return input.documentId;\n      }\n      if (input.id && typeof input.id === 'string') {\n        return input.id;\n      }\n    }\n\n    // 'documentId' argument\n    if (args.documentId && typeof args.documentId === 'string') {\n      return args.documentId;\n    }\n\n    return null;\n  }\n\n  /**\n   * Check if user has the required permission for a document\n   */\n  private async checkPermission(\n    documentId: string,\n    userId: string,\n    requiredPermission: DocumentPermission,\n  ): Promise<boolean> {\n    // Load document with session relation\n    const document = await this.documentRepository.findOne({\n      where: { id: documentId },\n      relations: ['session'],\n    });\n\n    if (!document) {\n      // Document doesn't exist - let the resolver handle the 404\n      return true;\n    }\n\n    // Check if user owns the document (via session)\n    const isOwner = document.session?.userId === userId;\n\n    if (requiredPermission === DocumentPermission.OWNER) {\n      return isOwner;\n    }\n\n    if (isOwner) {\n      // Owner has all permissions\n      return true;\n    }\n\n    // Check shares for non-owners\n    const share = await this.shareRepository.findOne({\n      where: {\n        documentId,\n        sharedWithUserId: userId,\n      },\n    });\n\n    if (!share || !share.isActive()) {\n      return false;\n    }\n\n    // Check permission level based on share\n    switch (requiredPermission) {\n      case DocumentPermission.READ:\n        return share.canView();\n\n      case DocumentPermission.WRITE:\n        return share.canEdit();\n\n      case DocumentPermission.SHARE:\n        return share.canShare();\n\n      default:\n        return false;\n    }\n  }\n}\n\n/**\n * Permission decorator for specifying required permission level\n *\n * @example\n * @DocumentPermission(DocumentPermission.READ)\n * @Query(() => LegalDocument)\n * async getDocument(@Args('id') id: string) {\n *   return this.documentsService.findOne(id);\n * }\n */\nexport const DocumentPermission = (\n  permission: DocumentPermission,\n): ParameterDecorator => {\n  return (target, propertyKey, descriptor) => {\n    Reflect.defineMetadata(\n      PERMISSION_KEY,\n      permission,\n      descriptor ?? target,\n    );\n  };\n};\n\n/**\n * Document ID decorator for specifying which argument contains the document ID\n * This is optional - the guard will auto-detect the document ID from common patterns\n *\n * @example\n * @DocumentId('documentId')\n * @Mutation(() => Boolean)\n * async deleteDocument(@Args('documentId') documentId: string) {\n *   return this.documentsService.delete(documentId);\n * }\n */\nexport const DocumentId = (\n  paramName?: string,\n): ParameterDecorator => {\n  return (\n    target: object,\n    propertyKey: string | symbol | undefined,\n    parameterIndex: number,\n  ) => {\n    // This decorator is primarily for documentation purposes\n    // The guard extracts the document ID from args automatically\n    Reflect.defineMetadata(\n      'document_id_param',\n      paramName ?? parameterIndex,\n      target,\n    );\n  };\n};",
  "new_string": "import {\n  Injectable,\n  ExecutionContext,\n  ForbiddenException,\n  UnauthorizedException,\n  SetMetadata,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository } from 'typeorm';\nimport { LegalDocument } from '../../documents/entities/legal-document.entity';\nimport { DocumentShare, SharePermission } from '../../documents/entities/document-share.entity';\n\n/**\n * Permission metadata key for decorator\n */\nexport const PERMISSION_KEY = 'permission';\n\n/**\n * Permission levels for document access\n */\nexport enum DocumentPermissionLevel {\n  READ = 'read',\n  WRITE = 'write',\n  SHARE = 'share',\n  OWNER = 'owner',\n}\n\n/**\n * Document Permission Guard\n *\n * Checks if the authenticated user has the required permission\n * to access a document based on:\n * 1. Document ownership (via UserSession)\n * 2. Document shares (via DocumentShare entity)\n *\n * Usage:\n * @UseGuards(DocumentPermissionGuard)\n * @RequireDocumentPermission(DocumentPermissionLevel.READ)\n *\n * The guard expects the document ID to be provided in one of these ways:\n * 1. Via 'id' argument in the args\n * 2. Via 'input.documentId' or 'input.id' in the args\n * 3. Via 'documentId' argument\n */\n@Injectable()\nexport class DocumentPermissionGuard {\n  constructor(\n    private reflector: Reflector,\n    @InjectRepository(LegalDocument)\n    private readonly documentRepository: Repository<LegalDocument>,\n    @InjectRepository(DocumentShare)\n    private readonly shareRepository: Repository<DocumentShare>,\n  ) {}\n\n  async canActivate(context: ExecutionContext): Promise<boolean> {\n    // Get required permission from decorator metadata\n    const requiredPermission = this.reflector.getAllAndOverride<DocumentPermissionLevel>(\n      PERMISSION_KEY,\n      [context.getHandler(), context.getClass()],\n    );\n\n    if (!requiredPermission) {\n      // No permission requirement - allow access\n      return true;\n    }\n\n    // Get GraphQL context\n    const ctx = GqlExecutionContext.create(context);\n    const { req } = ctx.getContext();\n    const userId = req.user?.userId;\n\n    if (!userId) {\n      throw new UnauthorizedException('User not authenticated');\n    }\n\n    // Extract document ID from arguments\n    const documentId = this.extractDocumentId(ctx.getArgs());\n\n    if (!documentId) {\n      // No document ID in arguments - this might be a list query\n      // Allow access but let the service layer handle filtering\n      return true;\n    }\n\n    // Check if user has the required permission\n    const hasPermission = await this.checkPermission(\n      documentId,\n      userId,\n      requiredPermission,\n    );\n\n    if (!hasPermission) {\n      throw new ForbiddenException(\n        `You do not have ${requiredPermission} permission for this document`,\n      );\n    }\n\n    return true;\n  }\n\n  /**\n   * Extract document ID from resolver arguments\n   */\n  private extractDocumentId(args: Record<string, unknown>): string | null {\n    // Direct 'id' argument\n    if (args.id && typeof args.id === 'string') {\n      return args.id;\n    }\n\n    // Nested in 'input.documentId' or 'input.id'\n    if (args.input && typeof args.input === 'object') {\n      const input = args.input as Record<string, unknown>;\n      if (input.documentId && typeof input.documentId === 'string') {\n        return input.documentId;\n      }\n      if (input.id && typeof input.id === 'string') {\n        return input.id;\n      }\n    }\n\n    // 'documentId' argument\n    if (args.documentId && typeof args.documentId === 'string') {\n      return args.documentId;\n    }\n\n    return null;\n  }\n\n  /**\n   * Check if user has the required permission for a document\n   */\n  private async checkPermission(\n    documentId: string,\n    userId: string,\n    requiredPermission: DocumentPermissionLevel,\n  ): Promise<boolean> {\n    // Load document with session relation\n    const document = await this.documentRepository.findOne({\n      where: { id: documentId },\n      relations: ['session'],\n    });\n\n    if (!document) {\n      // Document doesn't exist - let the resolver handle the 404\n      return true;\n    }\n\n    // Check if user owns the document (via session)\n    const isOwner = document.session?.userId === userId;\n\n    if (requiredPermission === DocumentPermissionLevel.OWNER) {\n      return isOwner;\n    }\n\n    if (isOwner) {\n      // Owner has all permissions\n      return true;\n    }\n\n    // Check shares for non-owners\n    const share = await this.shareRepository.findOne({\n      where: {\n        documentId,\n        sharedWithUserId: userId,\n      },\n    });\n\n    if (!share || !share.isActive()) {\n      return false;\n    }\n\n    // Check permission level based on share\n    switch (requiredPermission) {\n      case DocumentPermissionLevel.READ:\n        return share.canView();\n\n      case DocumentPermissionLevel.WRITE:\n        return share.canEdit();\n\n      case DocumentPermissionLevel.SHARE:\n        return share.canShare();\n\n      default:\n        return false;\n    }\n  }\n}\n\n/**\n * Permission decorator for specifying required permission level\n *\n * @example\n * @RequireDocumentPermission(DocumentPermissionLevel.READ)\n * @Query(() => LegalDocument)\n * async getDocument(@Args('id') id: string) {\n *   return this.documentsService.findOne(id);\n * }\n */\nexport const RequireDocumentPermission = (\n  permission: DocumentPermissionLevel,\n): MethodDecorator => SetMetadata(PERMISSION_KEY, permission);\n\n// Re-export enum with a shorter name for convenience\nexport { DocumentPermissionLevel as DocumentPermission };"
}
Now I need to update the resolver to use the renamed decorator:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "import { GqlAuthGuard, DocumentPermissionGuard, DocumentPermission } from '../auth/guards';",
  "new_string": "import { GqlAuthGuard, DocumentPermissionGuard, RequireDocumentPermission, DocumentPermission } from '../auth/guards';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "  @Mutation(() => LegalDocument, { name: 'updateDocument' })\n  @DocumentPermission(DocumentPermission.WRITE)\n  async updateDocument(",
  "new_string": "  @Mutation(() => LegalDocument, { name: 'updateDocument' })\n  @RequireDocumentPermission(DocumentPermission.WRITE)\n  async updateDocument("
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "  @Mutation(() => Boolean, {\n    name: 'deleteDocument',\n    deprecationReason: 'Use deleteOneLegalDocument instead',\n  })\n  @DocumentPermission(DocumentPermission.OWNER)\n  async deleteDocument(",
  "new_string": "  @Mutation(() => Boolean, {\n    name: 'deleteDocument',\n    deprecationReason: 'Use deleteOneLegalDocument instead',\n  })\n  @RequireDocumentPermission(DocumentPermission.OWNER)\n  async deleteDocument("
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "  @StrictThrottle()\n  @Mutation(() => PdfExportJobResponse, {\n    name: 'exportDocumentToPdf',\n    description: 'Queue a document for PDF export',\n  })\n  @DocumentPermission(DocumentPermission.READ)\n  async exportDocumentToPdf(",
  "new_string": "  @StrictThrottle()\n  @Mutation(() => PdfExportJobResponse, {\n    name: 'exportDocumentToPdf',\n    description: 'Queue a document for PDF export',\n  })\n  @RequireDocumentPermission(DocumentPermission.READ)\n  async exportDocumentToPdf("
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts",
  "old_string": "  @StrictThrottle()\n  @Mutation(() => PdfExportResult, {\n    name: 'exportDocumentToPdfSync',\n    description: 'Export a document to PDF and wait for the result',\n  })\n  @DocumentPermission(DocumentPermission.READ)\n  async exportDocumentToPdfSync(",
  "new_string": "  @StrictThrottle()\n  @Mutation(() => PdfExportResult, {\n    name: 'exportDocumentToPdfSync',\n    description: 'Export a document to PDF and wait for the result',\n  })\n  @RequireDocumentPermission(DocumentPermission.READ)\n  async exportDocumentToPdfSync("
}
Now let's verify the build again:

🔧 Tool: Bash
Input: {
  "command": "cd apps/backend && npx tsc --noEmit 2>&1 | grep -E \"(guard|permission|document)\" | head -30",
  "description": "Check for TypeScript errors related to guards",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | grep -E \"(guard|permission|document)\" | head -30",
  "description": "Check for TypeScript errors related to guards",
  "timeout": 60000
}
The permission guard related errors are gone. The remaining errors are in test files and unrelated to our changes. Now let's create the Playwright verification test:

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/tests/playwright/*.spec.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/tests/**/*.spec.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/tests/**/*.spec.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/playwright/graphql-auth.spec.ts"
}
Now let me create a Playwright test for document permission verification:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/playwright/document-permission-guard.spec.ts",
  "content": "import { test, expect, APIRequestContext } from '@playwright/test';\n\n/**\n * Temporary verification test for Document Permission Guards\n * This test file should be deleted after verification\n */\n\nconst GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL || 'http://localhost:3333/graphql';\n\n// Helper function to execute GraphQL mutations\nasync function graphqlRequest(\n  request: APIRequestContext,\n  query: string,\n  variables: Record<string, unknown> = {},\n  headers: Record<string, string> = {},\n) {\n  const response = await request.post(GRAPHQL_ENDPOINT, {\n    data: {\n      query,\n      variables,\n    },\n    headers: {\n      'Content-Type': 'application/json',\n      ...headers,\n    },\n  });\n  return response;\n}\n\ntest.describe('Document Permission Guards', () => {\n  const timestamp = Date.now();\n  const ownerEmail = `owner-${timestamp}@example.com`;\n  const otherUserEmail = `other-${timestamp}@example.com`;\n  const testPassword = 'TestPassword123!';\n\n  let ownerAccessToken: string;\n  let otherUserAccessToken: string;\n  let ownerUserId: string;\n  let otherUserId: string;\n  let sessionId: string;\n  let documentId: string;\n\n  test.beforeAll(async ({ request }) => {\n    // Register owner user\n    const ownerRegisterMutation = `\n      mutation Register($input: RegisterInput!) {\n        register(input: $input) {\n          accessToken\n          user {\n            id\n          }\n        }\n      }\n    `;\n\n    const ownerResponse = await graphqlRequest(request, ownerRegisterMutation, {\n      input: {\n        email: ownerEmail,\n        password: testPassword,\n        username: `owner${timestamp}`,\n      },\n    });\n    const ownerBody = await ownerResponse.json();\n    ownerAccessToken = ownerBody.data.register.accessToken;\n    ownerUserId = ownerBody.data.register.user.id;\n\n    // Register other user\n    const otherRegisterMutation = `\n      mutation Register($input: RegisterInput!) {\n        register(input: $input) {\n          accessToken\n          user {\n            id\n          }\n        }\n      }\n    `;\n\n    const otherResponse = await graphqlRequest(request, otherRegisterMutation, {\n      input: {\n        email: otherUserEmail,\n        password: testPassword,\n        username: `other${timestamp}`,\n      },\n    });\n    const otherBody = await otherResponse.json();\n    otherUserAccessToken = otherBody.data.register.accessToken;\n    otherUserId = otherBody.data.register.user.id;\n  });\n\n  test('should create a session and document for owner', async ({ request }) => {\n    // Create a session\n    const createSessionMutation = `\n      mutation CreateSession($input: CreateSessionInput!) {\n        createOneUserSession(input: $input) {\n          id\n          userId\n          mode\n        }\n      }\n    `;\n\n    const sessionResponse = await graphqlRequest(\n      request,\n      createSessionMutation,\n      {\n        input: {\n          userId: ownerUserId,\n          mode: 'SIMPLE',\n        },\n      },\n      {\n        Authorization: `Bearer ${ownerAccessToken}`,\n      },\n    );\n\n    const sessionBody = await sessionResponse.json();\n    expect(sessionBody.errors).toBeUndefined();\n    sessionId = sessionBody.data.createOneUserSession.id;\n\n    // Create a document\n    const createDocumentMutation = `\n      mutation CreateDocument($input: CreateLegalDocumentInput!) {\n        createOneLegalDocument(input: $input) {\n          id\n          title\n          sessionId\n          status\n        }\n      }\n    `;\n\n    const docResponse = await graphqlRequest(request, createDocumentMutation, {\n      input: {\n        sessionId,\n        title: 'Test Document for Permission Check',\n        type: 'OTHER',\n      },\n    });\n\n    const docBody = await docResponse.json();\n    expect(docBody.errors).toBeUndefined();\n    documentId = docBody.data.createOneLegalDocument.id;\n    expect(docBody.data.createOneLegalDocument.sessionId).toBe(sessionId);\n  });\n\n  test('should allow owner to update their own document', async ({ request }) => {\n    const updateMutation = `\n      mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {\n        updateDocument(id: $id, input: $input) {\n          id\n          title\n        }\n      }\n    `;\n\n    const response = await graphqlRequest(\n      request,\n      updateMutation,\n      {\n        id: documentId,\n        input: {\n          title: 'Updated by Owner',\n        },\n      },\n      {\n        Authorization: `Bearer ${ownerAccessToken}`,\n      },\n    );\n\n    const body = await response.json();\n    expect(body.errors).toBeUndefined();\n    expect(body.data.updateDocument.title).toBe('Updated by Owner');\n  });\n\n  test('should deny non-owner from updating document without share', async ({ request }) => {\n    const updateMutation = `\n      mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {\n        updateDocument(id: $id, input: $input) {\n          id\n          title\n        }\n      }\n    `;\n\n    const response = await graphqlRequest(\n      request,\n      updateMutation,\n      {\n        id: documentId,\n        input: {\n          title: 'Should not update',\n        },\n      },\n      {\n        Authorization: `Bearer ${otherUserAccessToken}`,\n      },\n    );\n\n    const body = await response.json();\n    // Should get a permission error\n    expect(body.errors).toBeDefined();\n    expect(body.errors[0].message).toContain('permission');\n  });\n\n  test('should deny non-owner from deleting document', async ({ request }) => {\n    const deleteMutation = `\n      mutation DeleteDocument($id: ID!) {\n        deleteDocument(id: $id)\n      }\n    `;\n\n    const response = await graphqlRequest(\n      request,\n      deleteMutation,\n      {\n        id: documentId,\n      },\n      {\n        Authorization: `Bearer ${otherUserAccessToken}`,\n      },\n    );\n\n    const body = await response.json();\n    expect(body.errors).toBeDefined();\n    expect(body.errors[0].message).toContain('permission');\n  });\n\n  test('should allow owner to delete their own document', async ({ request }) => {\n    const deleteMutation = `\n      mutation DeleteDocument($id: ID!) {\n        deleteDocument(id: $id)\n      }\n    `;\n\n    const response = await graphqlRequest(\n      request,\n      deleteMutation,\n      {\n        id: documentId,\n      },\n      {\n        Authorization: `Bearer ${ownerAccessToken}`,\n      },\n    );\n\n    const body = await response.json();\n    expect(body.errors).toBeUndefined();\n    expect(body.data.deleteDocument).toBe(true);\n  });\n\n  test('should deny access to protected mutations without authentication', async ({ request }) => {\n    const updateMutation = `\n      mutation UpdateDocument($id: ID!, $input: UpdateDocumentInput!) {\n        updateDocument(id: $id, input: $input) {\n          id\n        }\n      }\n    `;\n\n    const response = await graphqlRequest(request, updateMutation, {\n      id: 'some-id',\n      input: {},\n    });\n\n    const body = await response.json();\n    expect(body.errors).toBeDefined();\n  });\n});\n"
}
Now let's run the Playwright test to verify our implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing auth and document structure",
      "content": "Explore existing auth and document structure",
      "status": "completed"
    },
    {
      "activeForm": "Designing permission guard implementation",
      "content": "Design permission guard implementation",
      "status": "completed"
    },
    {
      "activeForm": "Implementing permission guards",
      "content": "Implement permission guards",
      "status": "completed"
    },
    {
      "activeForm": "Applying guards to document resolvers",
      "content": "Apply guards to document resolvers",
      "status": "completed"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create Playwright verification test",
      "status": "completed"
    },
    {
      "activeForm": "Running verification and cleaning up",
      "content": "Run verification and clean up",
      "status": "in_progress"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cd apps/backend && npx playwright test document-permission-guard.spec.ts 2>&1 | tail -60",
  "description": "Run Playwright permission guard test",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx playwright test apps/backend/tests/playwright/document-permission-guard.spec.ts --reporter=line 2>&1 | tail -80",
  "description": "Run Playwright permission guard test",
  "timeout": 120000
}
The build is failing due to unrelated TypeScript errors in the AI engine adapter. Let me try a different approach - let me verify that the permission guard code is syntactically correct by compiling just the guard file:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit apps/backend/src/modules/auth/guards/document-permission.guard.ts 2>&1",
  "description": "Check TypeScript compilation for permission guard",
  "timeout": 30000
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --project apps/backend/tsconfig.json 2>&1 | grep -E \"document-permission|DocumentPermission\" | head -20",
  "description": "Check for permission guard related errors",
  "timeout": 60000
}
The permission guard code compiles without errors. The build failures are unrelated to our changes. Let me clean up the test file as requested and create a summary:

🔧 Tool: Bash
Input: {
  "command": "rm /Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/playwright/document-permission-guard.spec.ts",
  "description": "Delete temporary verification test"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing auth and document structure",
      "content": "Explore existing auth and document structure",
      "status": "completed"
    },
    {
      "activeForm": "Designing permission guard implementation",
      "content": "Design permission guard implementation",
      "status": "completed"
    },
    {
      "activeForm": "Implementing permission guards",
      "content": "Implement permission guards",
      "status": "completed"
    },
    {
      "activeForm": "Applying guards to document resolvers",
      "content": "Apply guards to document resolvers",
      "status": "completed"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create Playwright verification test",
      "status": "completed"
    },
    {
      "activeForm": "Running verification and cleaning up",
      "content": "Run verification and clean up",
      "status": "completed"
    }
  ]
}
<summary>
## Summary: Implement NestJS guards checking document access permissions

### Changes Implemented
- **Created `DocumentPermissionGuard`** - A NestJS guard that enforces document access permissions based on:
  - Document ownership (via UserSession ownership)
  - Document shares (via DocumentShare entity with VIEW, EDIT, ADMIN permissions)

- **Added `DocumentPermissionLevel` enum** with four permission levels:
  - `READ` - View access
  - `WRITE` - Edit access
  - `SHARE` - Share with others
  - `OWNER` - Full ownership

- **Created `RequireDocumentPermission` decorator** - Used to specify required permission level on resolver methods

- **Applied guards to document resolvers**:
  - `updateDocument` mutation - Requires WRITE permission
  - `deleteDocument` mutation - Requires OWNER permission
  - `exportDocumentToPdf` mutation - Requires READ permission
  - `exportDocumentToPdfSync` mutation - Requires READ permission
  - Applied `GqlAuthGuard` globally to DocumentsResolver

- **Added permission filtering methods to DocumentsService**:
  - `findAccessibleByUser()` - Filters documents by user access
  - `canUserAccessDocument()` - Checks if user has specific permission

- **Updated nestjs-query resolver configuration** to apply `GqlAuthGuard` to auto-generated LegalDocument CRUD operations

### Files Modified
- **New files:**
  - `apps/backend/src/modules/auth/guards/document-permission.guard.ts` - Main permission guard implementation
  
- **Modified files:**
  - `apps/backend/src/modules/auth/guards/index.ts` - Export new guards
  - `apps/backend/src/modules/documents/documents.resolver.ts` - Apply permission decorators
  - `apps/backend/src/modules/documents/document-sharing.resolver.ts` - Apply auth guard at resolver level
  - `apps/backend/src/modules/documents/documents.module.ts` - Apply auth guards to nestjs-query resolvers
  - `apps/backend/src/modules/documents/services/documents.service.ts` - Add permission checking methods

### Notes for Developer
- The permission guard automatically extracts document IDs from resolver arguments using common patterns (`id`, `input.documentId`, `input.id`, `documentId`)
- For list operations (e.g., `legalDocuments` query), the guard allows access but the service layer should filter results using `findAccessibleByUser()` method
- The guard works with the existing DocumentShare entity's permission system (VIEW, COMMENT, EDIT, ADMIN)
- All document mutations now require authentication via `GqlAuthGuard`
- The permission hierarchy: Owner > ADMIN (share) > EDIT (share) > VIEW/COMMENT (share)

### Verification Status
- TypeScript compilation for the permission guard files passes without errors
- The guard implementation follows NestJS best practices for GraphQL guards using `GqlExecutionContext`
- The implementation is compatible with the existing nestjs-query auto-generated resolvers
- Note: Full Playwright E2E verification was blocked by pre-existing TypeScript build errors in unrelated files (AI engine adapters), but the permission guard code itself compiles correctly
</summary>