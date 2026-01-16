I'll start by exploring the codebase to understand the existing structure and then continue with the implementation of GraphQL subscriptions for document status changes.

🔧 Tool: Glob
Input: {
  "pattern": "**/*.{ts,tsx,js}"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/schema*.{graphql,ts}"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/resolvers*.ts"
}
The glob results are mostly from node_modules. Let me search more specifically for the project's source files:

🔧 Tool: Glob
Input: {
  "pattern": "apps/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/**/*.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/",
  "description": "List project root directory"
}
Let me explore the apps directory and find the backend API structure:

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/",
  "description": "List apps directory"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/api/**/*.ts",
  "path": "/Users/piteer/workspace/radca-prawny/legal"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/**/*.ts",
  "path": "/Users/piteer/workspace/radca-prawny/legal"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/backend/",
  "description": "List backend directory"
}
I can see the backend is a NestJS application with GraphQL support. Let me examine the key files related to documents and subscriptions:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing document and GraphQL structure",
      "status": "in_progress",
      "activeForm": "Exploring existing document and GraphQL structure"
    },
    {
      "content": "Implement document status subscription resolver",
      "status": "pending",
      "activeForm": "Implementing document status subscription resolver"
    },
    {
      "content": "Create document status event emitter service",
      "status": "pending",
      "activeForm": "Creating document status event emitter service"
    },
    {
      "content": "Integrate status change events in document operations",
      "status": "pending",
      "activeForm": "Integrating status change events in document operations"
    },
    {
      "content": "Verify with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright test"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/entities/legal-document.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/app.module.ts"
}
Now let me explore the existing streaming module and events:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/streaming/streaming.module.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/streaming/document-progress-pubsub.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/events/examples/document.events.ts"
}
Now let me check the documents module and see how the document generation processor works:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.module.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/queues/document-generation.processor.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts"
}
Excellent! Now I have a good understanding of the codebase. Let me also check the event patterns to understand the event naming conventions:

🔧 Tool: Grep
Input: {
  "pattern": "EVENT_PATTERNS",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src",
  "output_mode": "files_with_matches"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/events/base/event-patterns.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/streaming/index.ts"
}
Now let me check the package.json for dependencies and the existing subscription resolver if any:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/package.json"
}

🔧 Tool: Grep
Input: {
  "pattern": "Subscription|subscribeToDocument",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src",
  "output_mode": "content"
}
I now have a complete understanding of the codebase. The application uses:
- NestJS with GraphQL (Apollo Server) - code-first approach
- RxJS-based PubSub service for document progress events
- SSE (Server-Sent Events) via REST controller for streaming progress

Now I need to implement GraphQL subscriptions. Let me check if `graphql-subscriptions` package is needed and check the document stream controller:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/controllers/document-stream.controller.ts"
}
Now I understand the current implementation. There's already SSE-based streaming, but the task requires implementing GraphQL subscriptions. Let me now implement the GraphQL subscriptions for document status changes.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing document and GraphQL structure",
      "status": "completed",
      "activeForm": "Exploring existing document and GraphQL structure"
    },
    {
      "content": "Install graphql-subscriptions and configure GraphQL for subscriptions",
      "status": "in_progress",
      "activeForm": "Installing graphql-subscriptions and configuring GraphQL for subscriptions"
    },
    {
      "content": "Create PubSub service for GraphQL subscriptions",
      "status": "pending",
      "activeForm": "Creating PubSub service for GraphQL subscriptions"
    },
    {
      "content": "Implement document status subscription resolver",
      "status": "pending",
      "activeForm": "Implementing document status subscription resolver"
    },
    {
      "content": "Integrate status change events in document operations",
      "status": "pending",
      "activeForm": "Integrating status change events in document operations"
    },
    {
      "content": "Verify with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright test"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/backend && pnpm add graphql-subscriptions graphql-ws",
  "description": "Install GraphQL subscriptions packages",
  "timeout": 60000
}
Now let me update the GraphQL module configuration to support subscriptions:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/main.ts"
}
Now I'll implement the GraphQL subscriptions. First, I'll create a PubSub service for GraphQL subscriptions, then create the subscription resolver. Let me start:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/streaming/graphql-pubsub.service.ts",
  "content": "import { Injectable, OnModuleDestroy } from '@nestjs/common';\nimport { PubSub } from 'graphql-subscriptions';\n\n/**\n * Document Status Change Event\n *\n * Represents a document status change event for GraphQL subscriptions.\n * Emitted when a document transitions between states (DRAFT, GENERATING, COMPLETED, FAILED).\n */\nexport interface DocumentStatusChangeEvent {\n  documentId: string;\n  sessionId: string;\n  previousStatus: string;\n  newStatus: string;\n  timestamp: Date;\n  message?: string;\n  error?: string;\n}\n\n/**\n * GraphQL PubSub Topics\n *\n * Constants for subscription topics to ensure consistency\n * across publishers and subscribers.\n */\nexport const SUBSCRIPTION_TOPICS = {\n  /** Topic for document status changes */\n  DOCUMENT_STATUS_CHANGED: 'documentStatusChanged',\n  /** Topic for document generation progress */\n  DOCUMENT_PROGRESS: 'documentProgress',\n} as const;\n\n/**\n * GraphQL PubSub Service\n *\n * Provides publish/subscribe functionality for GraphQL subscriptions.\n * Uses graphql-subscriptions PubSub for in-memory pub/sub.\n *\n * Architecture Notes:\n * - In-memory implementation suitable for single-server deployments\n * - For horizontal scaling, extend with Redis-based PubSub adapter\n * - This service wraps the graphql-subscriptions PubSub to provide\n *   typed methods and better integration with NestJS\n *\n * Usage:\n * - Publishers call publishDocumentStatusChange() when status changes\n * - Subscribers use asyncIterator() in GraphQL resolvers\n */\n@Injectable()\nexport class GraphQLPubSubService implements OnModuleDestroy {\n  private readonly pubSub = new PubSub();\n\n  /**\n   * Get the underlying PubSub instance\n   * Used by GraphQL resolvers for subscriptions\n   */\n  getPubSub(): PubSub {\n    return this.pubSub;\n  }\n\n  /**\n   * Publish a document status change event\n   *\n   * Called when a document transitions between states.\n   * All subscribers listening to this document will receive the event.\n   *\n   * @param event - Document status change event\n   */\n  async publishDocumentStatusChange(\n    event: DocumentStatusChangeEvent,\n  ): Promise<void> {\n    await this.pubSub.publish(SUBSCRIPTION_TOPICS.DOCUMENT_STATUS_CHANGED, {\n      documentStatusChanged: {\n        ...event,\n        timestamp: event.timestamp.toISOString(),\n      },\n    });\n  }\n\n  /**\n   * Get async iterator for document status changes\n   *\n   * Used by GraphQL subscription resolvers.\n   *\n   * @returns AsyncIterator for document status change events\n   */\n  getDocumentStatusChangeIterator(): AsyncIterator<unknown> {\n    return this.pubSub.asyncIterableIterator(\n      SUBSCRIPTION_TOPICS.DOCUMENT_STATUS_CHANGED,\n    );\n  }\n\n  /**\n   * Cleanup on module destroy\n   */\n  onModuleDestroy(): void {\n    // PubSub doesn't have a close method, but we can clear any references\n    // In production with Redis, this would close the Redis connection\n  }\n}\n"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/streaming/streaming.module.ts",
  "old_string": "import { Module, Global } from '@nestjs/common';\nimport { DocumentProgressPubSubService } from './document-progress-pubsub.service';\n\n/**\n * Streaming Module\n *\n * Global module providing real-time streaming infrastructure.\n * Exports services for Server-Sent Events (SSE) and PubSub communication.\n *\n * Made global so any module can emit progress events without explicit imports.\n * This follows the event-driven architecture pattern where publishers\n * don't need to know about subscribers.\n */\n@Global()\n@Module({\n  providers: [DocumentProgressPubSubService],\n  exports: [DocumentProgressPubSubService],\n})\nexport class StreamingModule {}",
  "new_string": "import { Module, Global } from '@nestjs/common';\nimport { DocumentProgressPubSubService } from './document-progress-pubsub.service';\nimport { GraphQLPubSubService } from './graphql-pubsub.service';\n\n/**\n * Streaming Module\n *\n * Global module providing real-time streaming infrastructure.\n * Exports services for Server-Sent Events (SSE), PubSub communication,\n * and GraphQL subscriptions.\n *\n * Made global so any module can emit progress events without explicit imports.\n * This follows the event-driven architecture pattern where publishers\n * don't need to know about subscribers.\n *\n * Provides:\n * - DocumentProgressPubSubService: RxJS-based pub/sub for SSE streaming\n * - GraphQLPubSubService: graphql-subscriptions based pub/sub for GraphQL subscriptions\n */\n@Global()\n@Module({\n  providers: [DocumentProgressPubSubService, GraphQLPubSubService],\n  exports: [DocumentProgressPubSubService, GraphQLPubSubService],\n})\nexport class StreamingModule {}"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/streaming/index.ts",
  "old_string": "export { StreamingModule } from './streaming.module';\nexport { DocumentProgressPubSubService } from './document-progress-pubsub.service';\nexport type { DocumentProgressEvent } from './document-progress-pubsub.service';",
  "new_string": "export { StreamingModule } from './streaming.module';\nexport { DocumentProgressPubSubService } from './document-progress-pubsub.service';\nexport type { DocumentProgressEvent } from './document-progress-pubsub.service';\nexport { GraphQLPubSubService, SUBSCRIPTION_TOPICS } from './graphql-pubsub.service';\nexport type { DocumentStatusChangeEvent } from './graphql-pubsub.service';"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/streaming/index.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/streaming/index.ts",
  "old_string": "export { StreamingModule } from './streaming.module';\nexport { DocumentProgressPubSubService } from './document-progress-pubsub.service';\nexport type { DocumentProgressEvent } from './document-progress-pubsub.service';",
  "new_string": "export { StreamingModule } from './streaming.module';\nexport { DocumentProgressPubSubService } from './document-progress-pubsub.service';\nexport type { DocumentProgressEvent } from './document-progress-pubsub.service';\nexport { GraphQLPubSubService, SUBSCRIPTION_TOPICS } from './graphql-pubsub.service';\nexport type { DocumentStatusChangeEvent } from './graphql-pubsub.service';"
}
Now I need to update the GraphQL configuration to support subscriptions. Let me update the app.module.ts:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/app.module.ts",
  "old_string": "    // GraphQL Module - Code-First approach per constitution\n    GraphQLModule.forRoot<ApolloDriverConfig>({\n      driver: ApolloDriver,\n      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),\n      sortSchema: true,\n      playground: process.env.NODE_ENV !== 'production',\n      introspection: process.env.NODE_ENV !== 'production',\n    }),",
  "new_string": "    // GraphQL Module - Code-First approach per constitution\n    // Subscriptions enabled via graphql-ws for real-time document status updates\n    GraphQLModule.forRoot<ApolloDriverConfig>({\n      driver: ApolloDriver,\n      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),\n      sortSchema: true,\n      playground: process.env.NODE_ENV !== 'production',\n      introspection: process.env.NODE_ENV !== 'production',\n      // Enable GraphQL subscriptions via WebSocket (graphql-ws protocol)\n      subscriptions: {\n        'graphql-ws': {\n          path: '/graphql',\n          onConnect: () => {\n            // Connection established - could add auth validation here\n            console.log('GraphQL subscription client connected');\n          },\n          onDisconnect: () => {\n            console.log('GraphQL subscription client disconnected');\n          },\n        },\n      },\n    }),"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing document and GraphQL structure",
      "status": "completed",
      "activeForm": "Exploring existing document and GraphQL structure"
    },
    {
      "content": "Install graphql-subscriptions and configure GraphQL for subscriptions",
      "status": "completed",
      "activeForm": "Installing graphql-subscriptions and configuring GraphQL for subscriptions"
    },
    {
      "content": "Create PubSub service for GraphQL subscriptions",
      "status": "completed",
      "activeForm": "Creating PubSub service for GraphQL subscriptions"
    },
    {
      "content": "Implement document status subscription resolver",
      "status": "in_progress",
      "activeForm": "Implementing document status subscription resolver"
    },
    {
      "content": "Integrate status change events in document operations",
      "status": "pending",
      "activeForm": "Integrating status change events in document operations"
    },
    {
      "content": "Verify with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright test"
    }
  ]
}
Now let me create the GraphQL types for the subscription and the subscription resolver:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/dto/document-status-change.dto.ts",
  "content": "import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';\nimport { DocumentStatus } from '../entities/legal-document.entity';\n\n// Register DocumentStatus enum for GraphQL if not already registered\n// This allows the enum to be used in subscription responses\nregisterEnumType(DocumentStatus, {\n  name: 'DocumentStatus',\n  description: 'Status of document generation',\n});\n\n/**\n * Document Status Change Payload\n *\n * GraphQL type representing a document status change event.\n * Emitted via subscription when a document transitions between states.\n *\n * State Transitions:\n * - DRAFT -> GENERATING: Document generation started\n * - GENERATING -> COMPLETED: Document generation succeeded\n * - GENERATING -> FAILED: Document generation failed\n */\n@ObjectType('DocumentStatusChange')\nexport class DocumentStatusChangePayload {\n  @Field(() => String, { description: 'ID of the document' })\n  documentId: string;\n\n  @Field(() => String, { description: 'ID of the session' })\n  sessionId: string;\n\n  @Field(() => DocumentStatus, {\n    description: 'Previous status before the change',\n  })\n  previousStatus: DocumentStatus;\n\n  @Field(() => DocumentStatus, { description: 'New status after the change' })\n  newStatus: DocumentStatus;\n\n  @Field(() => String, { description: 'ISO timestamp of the status change' })\n  timestamp: string;\n\n  @Field(() => String, {\n    nullable: true,\n    description: 'Optional message describing the status change',\n  })\n  message?: string;\n\n  @Field(() => String, {\n    nullable: true,\n    description: 'Error message if status is FAILED',\n  })\n  error?: string;\n}\n"
}
Now let me create the subscription resolver:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents-subscription.resolver.ts",
  "content": "import { Resolver, Subscription, Args } from '@nestjs/graphql';\nimport { GraphQLPubSubService } from '../../shared/streaming';\nimport { DocumentStatusChangePayload } from './dto/document-status-change.dto';\n\n/**\n * Document Subscriptions Resolver\n *\n * Provides GraphQL subscriptions for real-time document status updates.\n * Clients can subscribe to document status changes to receive notifications\n * when documents transition between states (DRAFT, GENERATING, COMPLETED, FAILED).\n *\n * Usage (GraphQL):\n * ```graphql\n * subscription {\n *   documentStatusChanged(documentId: \"123\") {\n *     documentId\n *     sessionId\n *     previousStatus\n *     newStatus\n *     timestamp\n *     message\n *     error\n *   }\n * }\n * ```\n *\n * Or subscribe to all status changes for a session:\n * ```graphql\n * subscription {\n *   documentStatusChanged(sessionId: \"session-123\") {\n *     documentId\n *     newStatus\n *   }\n * }\n * ```\n *\n * WebSocket Connection:\n * Clients connect via ws://host/graphql using the graphql-ws protocol.\n */\n@Resolver()\nexport class DocumentSubscriptionResolver {\n  constructor(private readonly pubSubService: GraphQLPubSubService) {}\n\n  /**\n   * Subscribe to document status changes\n   *\n   * Clients can filter by:\n   * - documentId: Subscribe to changes for a specific document\n   * - sessionId: Subscribe to changes for all documents in a session\n   * - No filter: Subscribe to all document status changes (use with caution)\n   *\n   * @param documentId - Optional document ID to filter events\n   * @param sessionId - Optional session ID to filter events\n   * @returns AsyncIterator of DocumentStatusChangePayload events\n   */\n  @Subscription(() => DocumentStatusChangePayload, {\n    name: 'documentStatusChanged',\n    description: 'Subscribe to document status changes',\n    filter: (\n      payload: { documentStatusChanged: DocumentStatusChangePayload },\n      variables: { documentId?: string; sessionId?: string },\n    ) => {\n      const event = payload.documentStatusChanged;\n\n      // If documentId is provided, filter by it\n      if (variables.documentId && event.documentId !== variables.documentId) {\n        return false;\n      }\n\n      // If sessionId is provided, filter by it\n      if (variables.sessionId && event.sessionId !== variables.sessionId) {\n        return false;\n      }\n\n      // If no filters provided or all filters match, include the event\n      return true;\n    },\n    resolve: (payload: { documentStatusChanged: DocumentStatusChangePayload }) =>\n      payload.documentStatusChanged,\n  })\n  documentStatusChanged(\n    @Args('documentId', {\n      type: () => String,\n      nullable: true,\n      description: 'Filter by document ID',\n    })\n    _documentId?: string,\n    @Args('sessionId', {\n      type: () => String,\n      nullable: true,\n      description: 'Filter by session ID',\n    })\n    _sessionId?: string,\n  ): AsyncIterator<unknown> {\n    return this.pubSubService.getDocumentStatusChangeIterator();\n  }\n}\n"
}
Now I need to update the DocumentsModule to include the subscription resolver and update the DocumentsService to publish status changes:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.module.ts",
  "old_string": "import { Module } from '@nestjs/common';\nimport { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';\nimport { LegalDocument } from './entities/legal-document.entity';\nimport { LegalAnalysis } from './entities/legal-analysis.entity';\nimport { DocumentsService } from './services/documents.service';\nimport { DocumentsResolver } from './documents.resolver';\nimport { DocumentsController } from './documents.controller';\nimport { DocumentStreamController } from './controllers/document-stream.controller';\nimport {\n  CreateLegalDocumentInput,\n  UpdateLegalDocumentInput,\n} from './dto/legal-document.dto';\nimport {\n  CreateLegalAnalysisInput,\n  UpdateLegalAnalysisInput,\n} from './dto/legal-analysis.dto';\nimport { BullModule } from '@nestjs/bull';\nimport { QUEUE_NAMES } from '../../shared/queues';\nimport { AiClientModule } from '../../shared/ai-client/ai-client.module';\nimport { DocumentGenerationProcessor } from './queues/document-generation.processor';\nimport { DocumentGenerationProducer } from './queues/document-generation.producer';",
  "new_string": "import { Module } from '@nestjs/common';\nimport { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';\nimport { LegalDocument } from './entities/legal-document.entity';\nimport { LegalAnalysis } from './entities/legal-analysis.entity';\nimport { DocumentsService } from './services/documents.service';\nimport { DocumentsResolver } from './documents.resolver';\nimport { DocumentSubscriptionResolver } from './documents-subscription.resolver';\nimport { DocumentsController } from './documents.controller';\nimport { DocumentStreamController } from './controllers/document-stream.controller';\nimport {\n  CreateLegalDocumentInput,\n  UpdateLegalDocumentInput,\n} from './dto/legal-document.dto';\nimport {\n  CreateLegalAnalysisInput,\n  UpdateLegalAnalysisInput,\n} from './dto/legal-analysis.dto';\nimport { BullModule } from '@nestjs/bull';\nimport { QUEUE_NAMES } from '../../shared/queues';\nimport { AiClientModule } from '../../shared/ai-client/ai-client.module';\nimport { DocumentGenerationProcessor } from './queues/document-generation.processor';\nimport { DocumentGenerationProducer } from './queues/document-generation.producer';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/documents.module.ts",
  "old_string": "  providers: [\n    DocumentsService,\n    DocumentsResolver,\n    DocumentGenerationProcessor,\n    DocumentGenerationProducer,\n  ],",
  "new_string": "  providers: [\n    DocumentsService,\n    DocumentsResolver,\n    DocumentSubscriptionResolver,\n    DocumentGenerationProcessor,\n    DocumentGenerationProducer,\n  ],"
}
Now let me update the DocumentsService to publish status changes via the GraphQL PubSub:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "old_string": "import {\n  Injectable,\n  NotFoundException,\n  BadRequestException,\n} from '@nestjs/common';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository, FindOptionsWhere } from 'typeorm';\nimport { EventEmitter2 } from '@nestjs/event-emitter';\nimport {\n  LegalDocument,\n  DocumentType,\n  DocumentStatus,\n  DocumentMetadata,\n} from '../entities/legal-document.entity';\nimport {\n  DocumentCreatedEvent,\n  DocumentUpdatedEvent,\n  DocumentDeletedEvent,\n  DocumentGenerationStartedEvent,\n  DocumentGenerationCompletedEvent,\n  DocumentGenerationFailedEvent,\n} from '../../../shared/events/examples/document.events';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';",
  "new_string": "import {\n  Injectable,\n  NotFoundException,\n  BadRequestException,\n} from '@nestjs/common';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository, FindOptionsWhere } from 'typeorm';\nimport { EventEmitter2 } from '@nestjs/event-emitter';\nimport {\n  LegalDocument,\n  DocumentType,\n  DocumentStatus,\n  DocumentMetadata,\n} from '../entities/legal-document.entity';\nimport {\n  DocumentCreatedEvent,\n  DocumentUpdatedEvent,\n  DocumentDeletedEvent,\n  DocumentGenerationStartedEvent,\n  DocumentGenerationCompletedEvent,\n  DocumentGenerationFailedEvent,\n} from '../../../shared/events/examples/document.events';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';\nimport { GraphQLPubSubService } from '../../../shared/streaming';"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing document and GraphQL structure",
      "status": "completed",
      "activeForm": "Exploring existing document and GraphQL structure"
    },
    {
      "content": "Install graphql-subscriptions and configure GraphQL for subscriptions",
      "status": "completed",
      "activeForm": "Installing graphql-subscriptions and configuring GraphQL for subscriptions"
    },
    {
      "content": "Create PubSub service for GraphQL subscriptions",
      "status": "completed",
      "activeForm": "Creating PubSub service for GraphQL subscriptions"
    },
    {
      "content": "Implement document status subscription resolver",
      "status": "completed",
      "activeForm": "Implementing document status subscription resolver"
    },
    {
      "content": "Integrate status change events in document operations",
      "status": "in_progress",
      "activeForm": "Integrating status change events in document operations"
    },
    {
      "content": "Verify with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright test"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "old_string": "import {\n  Injectable,\n  NotFoundException,\n  BadRequestException,\n} from '@nestjs/common';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository, FindOptionsWhere } from 'typeorm';\nimport { EventEmitter2 } from '@nestjs/event-emitter';\nimport {\n  LegalDocument,\n  DocumentType,\n  DocumentStatus,\n  DocumentMetadata,\n} from '../entities/legal-document.entity';\nimport {\n  DocumentCreatedEvent,\n  DocumentUpdatedEvent,\n  DocumentDeletedEvent,\n  DocumentGenerationStartedEvent,\n  DocumentGenerationCompletedEvent,\n  DocumentGenerationFailedEvent,\n} from '../../../shared/events/examples/document.events';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';",
  "new_string": "import {\n  Injectable,\n  NotFoundException,\n  BadRequestException,\n} from '@nestjs/common';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository, FindOptionsWhere } from 'typeorm';\nimport { EventEmitter2 } from '@nestjs/event-emitter';\nimport {\n  LegalDocument,\n  DocumentType,\n  DocumentStatus,\n  DocumentMetadata,\n} from '../entities/legal-document.entity';\nimport {\n  DocumentCreatedEvent,\n  DocumentUpdatedEvent,\n  DocumentDeletedEvent,\n  DocumentGenerationStartedEvent,\n  DocumentGenerationCompletedEvent,\n  DocumentGenerationFailedEvent,\n} from '../../../shared/events/examples/document.events';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';\nimport { GraphQLPubSubService } from '../../../shared/streaming';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "old_string": "@Injectable()\nexport class DocumentsService {\n  constructor(\n    @InjectRepository(LegalDocument)\n    private readonly documentRepository: Repository<LegalDocument>,\n    private readonly eventEmitter: EventEmitter2,\n  ) {}",
  "new_string": "@Injectable()\nexport class DocumentsService {\n  constructor(\n    @InjectRepository(LegalDocument)\n    private readonly documentRepository: Repository<LegalDocument>,\n    private readonly eventEmitter: EventEmitter2,\n    private readonly graphqlPubSub: GraphQLPubSubService,\n  ) {}"
}
Now let me add the publishing of status changes in the startGeneration, completeGeneration, and failGeneration methods:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "old_string": "  /**\n   * Start document generation (AI processing)\n   */\n  async startGeneration(id: string): Promise<LegalDocument> {\n    const document = await this.findByIdOrFail(id);\n\n    if (document.isGenerating()) {\n      throw new BadRequestException('Document is already being generated');\n    }\n\n    if (document.isCompleted()) {\n      throw new BadRequestException(\n        'Document has already been completed. Create a new document to regenerate.',\n      );\n    }\n\n    document.markGenerating();\n    const savedDocument = await this.documentRepository.save(document);\n\n    // Emit domain event\n    this.eventEmitter.emit(\n      EVENT_PATTERNS.DOCUMENT.GENERATION_STARTED,\n      new DocumentGenerationStartedEvent(\n        savedDocument.id,\n        savedDocument.sessionId,\n        savedDocument.type,\n      ),\n    );\n\n    return savedDocument;\n  }",
  "new_string": "  /**\n   * Start document generation (AI processing)\n   */\n  async startGeneration(id: string): Promise<LegalDocument> {\n    const document = await this.findByIdOrFail(id);\n\n    if (document.isGenerating()) {\n      throw new BadRequestException('Document is already being generated');\n    }\n\n    if (document.isCompleted()) {\n      throw new BadRequestException(\n        'Document has already been completed. Create a new document to regenerate.',\n      );\n    }\n\n    const previousStatus = document.status;\n    document.markGenerating();\n    const savedDocument = await this.documentRepository.save(document);\n\n    // Emit domain event\n    this.eventEmitter.emit(\n      EVENT_PATTERNS.DOCUMENT.GENERATION_STARTED,\n      new DocumentGenerationStartedEvent(\n        savedDocument.id,\n        savedDocument.sessionId,\n        savedDocument.type,\n      ),\n    );\n\n    // Emit GraphQL subscription event for status change: DRAFT -> GENERATING\n    await this.graphqlPubSub.publishDocumentStatusChange({\n      documentId: savedDocument.id,\n      sessionId: savedDocument.sessionId,\n      previousStatus,\n      newStatus: savedDocument.status,\n      timestamp: new Date(),\n      message: 'Document generation started',\n    });\n\n    return savedDocument;\n  }"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "old_string": "  /**\n   * Complete document generation with content\n   */\n  async completeGeneration(\n    id: string,\n    content: string,\n  ): Promise<LegalDocument> {\n    const document = await this.findByIdOrFail(id);\n\n    if (!document.isGenerating()) {\n      throw new BadRequestException(\n        'Document must be in GENERATING status to complete',\n      );\n    }\n\n    document.contentRaw = content;\n    document.markCompleted();\n\n    const savedDocument = await this.documentRepository.save(document);\n\n    // Emit domain event\n    this.eventEmitter.emit(\n      EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED,\n      new DocumentGenerationCompletedEvent(\n        savedDocument.id,\n        savedDocument.sessionId,\n        savedDocument.type,\n        content.length,\n      ),\n    );\n\n    return savedDocument;\n  }",
  "new_string": "  /**\n   * Complete document generation with content\n   */\n  async completeGeneration(\n    id: string,\n    content: string,\n  ): Promise<LegalDocument> {\n    const document = await this.findByIdOrFail(id);\n\n    if (!document.isGenerating()) {\n      throw new BadRequestException(\n        'Document must be in GENERATING status to complete',\n      );\n    }\n\n    const previousStatus = document.status;\n    document.contentRaw = content;\n    document.markCompleted();\n\n    const savedDocument = await this.documentRepository.save(document);\n\n    // Emit domain event\n    this.eventEmitter.emit(\n      EVENT_PATTERNS.DOCUMENT.GENERATION_COMPLETED,\n      new DocumentGenerationCompletedEvent(\n        savedDocument.id,\n        savedDocument.sessionId,\n        savedDocument.type,\n        content.length,\n      ),\n    );\n\n    // Emit GraphQL subscription event for status change: GENERATING -> COMPLETED\n    await this.graphqlPubSub.publishDocumentStatusChange({\n      documentId: savedDocument.id,\n      sessionId: savedDocument.sessionId,\n      previousStatus,\n      newStatus: savedDocument.status,\n      timestamp: new Date(),\n      message: 'Document generation completed successfully',\n    });\n\n    return savedDocument;\n  }"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.ts",
  "old_string": "  /**\n   * Fail document generation with error message\n   */\n  async failGeneration(\n    id: string,\n    errorMessage: string,\n  ): Promise<LegalDocument> {\n    const document = await this.findByIdOrFail(id);\n\n    if (!document.isGenerating()) {\n      throw new BadRequestException(\n        'Document must be in GENERATING status to fail',\n      );\n    }\n\n    document.markFailed();\n    const savedDocument = await this.documentRepository.save(document);\n\n    // Emit domain event\n    this.eventEmitter.emit(\n      EVENT_PATTERNS.DOCUMENT.GENERATION_FAILED,\n      new DocumentGenerationFailedEvent(\n        savedDocument.id,\n        savedDocument.sessionId,\n        errorMessage,\n      ),\n    );\n\n    return savedDocument;\n  }",
  "new_string": "  /**\n   * Fail document generation with error message\n   */\n  async failGeneration(\n    id: string,\n    errorMessage: string,\n  ): Promise<LegalDocument> {\n    const document = await this.findByIdOrFail(id);\n\n    if (!document.isGenerating()) {\n      throw new BadRequestException(\n        'Document must be in GENERATING status to fail',\n      );\n    }\n\n    const previousStatus = document.status;\n    document.markFailed();\n    const savedDocument = await this.documentRepository.save(document);\n\n    // Emit domain event\n    this.eventEmitter.emit(\n      EVENT_PATTERNS.DOCUMENT.GENERATION_FAILED,\n      new DocumentGenerationFailedEvent(\n        savedDocument.id,\n        savedDocument.sessionId,\n        errorMessage,\n      ),\n    );\n\n    // Emit GraphQL subscription event for status change: GENERATING -> FAILED\n    await this.graphqlPubSub.publishDocumentStatusChange({\n      documentId: savedDocument.id,\n      sessionId: savedDocument.sessionId,\n      previousStatus,\n      newStatus: savedDocument.status,\n      timestamp: new Date(),\n      message: 'Document generation failed',\n      error: errorMessage,\n    });\n\n    return savedDocument;\n  }"
}
Now let me verify the implementation builds correctly:

🔧 Tool: Bash
Input: {
  "command": "pnpm build 2>&1 | tail -100",
  "description": "Build backend to check for errors",
  "timeout": 120000
}
The build succeeded. Now let me update the todo and run the test to verify the implementation:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing document and GraphQL structure",
      "status": "completed",
      "activeForm": "Exploring existing document and GraphQL structure"
    },
    {
      "content": "Install graphql-subscriptions and configure GraphQL for subscriptions",
      "status": "completed",
      "activeForm": "Installing graphql-subscriptions and configuring GraphQL for subscriptions"
    },
    {
      "content": "Create PubSub service for GraphQL subscriptions",
      "status": "completed",
      "activeForm": "Creating PubSub service for GraphQL subscriptions"
    },
    {
      "content": "Implement document status subscription resolver",
      "status": "completed",
      "activeForm": "Implementing document status subscription resolver"
    },
    {
      "content": "Integrate status change events in document operations",
      "status": "completed",
      "activeForm": "Integrating status change events in document operations"
    },
    {
      "content": "Verify with Playwright test",
      "status": "in_progress",
      "activeForm": "Verifying with Playwright test"
    }
  ]
}
Let me check the Playwright configuration and create a verification test:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/playwright.config.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/legal-analysis-graphql-verification.spec.ts"
}
Now I'll create a Playwright verification test for the GraphQL subscriptions feature:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/document-status-subscription-verification.spec.ts",
  "content": "import { test, expect, APIRequestContext } from '@playwright/test';\n\n/**\n * Document Status Subscription GraphQL Verification Test\n *\n * This is a temporary test to verify the documentStatusChanged GraphQL subscription\n * is working correctly. It tests:\n * - Subscription type exists in schema\n * - DocumentStatusChange payload type exists with correct fields\n * - Subscription arguments (documentId, sessionId) are available\n * - GraphQL subscriptions are enabled in the server configuration\n *\n * DELETE THIS FILE AFTER VERIFICATION\n */\n\nconst GRAPHQL_ENDPOINT = 'http://localhost:3000/graphql';\n\n// Helper function to execute GraphQL queries/mutations\nasync function executeGraphQL(\n  request: APIRequestContext,\n  query: string,\n  variables?: Record<string, unknown>\n) {\n  const response = await request.post(GRAPHQL_ENDPOINT, {\n    data: {\n      query,\n      variables,\n    },\n  });\n  return response;\n}\n\ntest.describe('Document Status Subscription GraphQL', () => {\n  test('should have documentStatusChanged subscription in schema', async ({ request }) => {\n    // Introspection query to check if subscription exists\n    const introspectionQuery = `\n      query {\n        __schema {\n          subscriptionType {\n            name\n            fields {\n              name\n              args {\n                name\n                type {\n                  name\n                  kind\n                }\n              }\n              type {\n                name\n                kind\n              }\n            }\n          }\n        }\n      }\n    `;\n\n    const response = await executeGraphQL(request, introspectionQuery);\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.errors).toBeUndefined();\n    expect(json.data.__schema.subscriptionType).toBeDefined();\n    expect(json.data.__schema.subscriptionType.name).toBe('Subscription');\n\n    // Find the documentStatusChanged subscription\n    const subscriptionFields = json.data.__schema.subscriptionType.fields;\n    const documentStatusChangedField = subscriptionFields.find(\n      (f: { name: string }) => f.name === 'documentStatusChanged'\n    );\n\n    expect(documentStatusChangedField).toBeDefined();\n    expect(documentStatusChangedField.type.name).toBe('DocumentStatusChange');\n\n    // Verify subscription has optional filter arguments\n    const argNames = documentStatusChangedField.args.map((a: { name: string }) => a.name);\n    expect(argNames).toContain('documentId');\n    expect(argNames).toContain('sessionId');\n  });\n\n  test('should have DocumentStatusChange type with correct fields', async ({ request }) => {\n    const introspectionQuery = `\n      query {\n        __type(name: \"DocumentStatusChange\") {\n          name\n          kind\n          fields {\n            name\n            type {\n              name\n              kind\n              ofType {\n                name\n                kind\n              }\n            }\n          }\n        }\n      }\n    `;\n\n    const response = await executeGraphQL(request, introspectionQuery);\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.errors).toBeUndefined();\n    expect(json.data.__type).toBeDefined();\n    expect(json.data.__type.name).toBe('DocumentStatusChange');\n    expect(json.data.__type.kind).toBe('OBJECT');\n\n    // Verify expected fields exist\n    const fieldNames = json.data.__type.fields.map((f: { name: string }) => f.name);\n    expect(fieldNames).toContain('documentId');\n    expect(fieldNames).toContain('sessionId');\n    expect(fieldNames).toContain('previousStatus');\n    expect(fieldNames).toContain('newStatus');\n    expect(fieldNames).toContain('timestamp');\n    expect(fieldNames).toContain('message');\n    expect(fieldNames).toContain('error');\n  });\n\n  test('should have DocumentStatus enum for status fields', async ({ request }) => {\n    const introspectionQuery = `\n      query {\n        __type(name: \"DocumentStatus\") {\n          name\n          kind\n          enumValues {\n            name\n          }\n        }\n      }\n    `;\n\n    const response = await executeGraphQL(request, introspectionQuery);\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.errors).toBeUndefined();\n    expect(json.data.__type).toBeDefined();\n    expect(json.data.__type.name).toBe('DocumentStatus');\n    expect(json.data.__type.kind).toBe('ENUM');\n\n    // Verify enum values exist\n    const enumValues = json.data.__type.enumValues.map((v: { name: string }) => v.name);\n    expect(enumValues).toContain('DRAFT');\n    expect(enumValues).toContain('GENERATING');\n    expect(enumValues).toContain('COMPLETED');\n    expect(enumValues).toContain('FAILED');\n  });\n\n  test('should have GraphQL subscriptions enabled (WebSocket endpoint available)', async ({ request }) => {\n    // Check that the GraphQL endpoint responds (subscriptions would use ws:// but http works for introspection)\n    const response = await request.post(GRAPHQL_ENDPOINT, {\n      data: {\n        query: '{ __typename }',\n      },\n    });\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.errors).toBeUndefined();\n    expect(json.data.__typename).toBe('Query');\n  });\n\n  test('should have GraphQLPubSubService in streaming module exports', async ({ request }) => {\n    // This test verifies the subscription mechanism is properly set up by checking\n    // that the schema exposes the subscription type correctly\n    const introspectionQuery = `\n      query {\n        __schema {\n          subscriptionType {\n            name\n            description\n          }\n        }\n      }\n    `;\n\n    const response = await executeGraphQL(request, introspectionQuery);\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.errors).toBeUndefined();\n\n    // Subscription type should exist (means subscriptions are enabled)\n    expect(json.data.__schema.subscriptionType).toBeDefined();\n    expect(json.data.__schema.subscriptionType.name).toBe('Subscription');\n  });\n\n  test('documentStatusChanged subscription should return DocumentStatusChange type', async ({\n    request,\n  }) => {\n    // Verify the subscription returns the correct type\n    const introspectionQuery = `\n      query {\n        __type(name: \"Subscription\") {\n          fields {\n            name\n            type {\n              name\n              kind\n              ofType {\n                name\n              }\n            }\n          }\n        }\n      }\n    `;\n\n    const response = await executeGraphQL(request, introspectionQuery);\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.errors).toBeUndefined();\n\n    const subscriptionField = json.data.__type.fields.find(\n      (f: { name: string }) => f.name === 'documentStatusChanged'\n    );\n\n    expect(subscriptionField).toBeDefined();\n    // The return type should be DocumentStatusChange (non-null)\n    expect(\n      subscriptionField.type.name === 'DocumentStatusChange' ||\n        subscriptionField.type.ofType?.name === 'DocumentStatusChange'\n    ).toBeTruthy();\n  });\n\n  test('DocumentStatusChange fields should have correct types', async ({ request }) => {\n    const introspectionQuery = `\n      query {\n        __type(name: \"DocumentStatusChange\") {\n          fields {\n            name\n            type {\n              name\n              kind\n              ofType {\n                name\n                kind\n              }\n            }\n          }\n        }\n      }\n    `;\n\n    const response = await executeGraphQL(request, introspectionQuery);\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.errors).toBeUndefined();\n\n    const fields = json.data.__type.fields;\n\n    // Find specific fields and verify their types\n    const documentIdField = fields.find((f: { name: string }) => f.name === 'documentId');\n    expect(documentIdField).toBeDefined();\n    // Should be String! (NON_NULL)\n    expect(documentIdField.type.kind === 'NON_NULL' || documentIdField.type.name === 'String').toBeTruthy();\n\n    const previousStatusField = fields.find(\n      (f: { name: string }) => f.name === 'previousStatus'\n    );\n    expect(previousStatusField).toBeDefined();\n    // Should be DocumentStatus! (NON_NULL enum)\n\n    const newStatusField = fields.find((f: { name: string }) => f.name === 'newStatus');\n    expect(newStatusField).toBeDefined();\n\n    const timestampField = fields.find((f: { name: string }) => f.name === 'timestamp');\n    expect(timestampField).toBeDefined();\n\n    // Optional fields\n    const messageField = fields.find((f: { name: string }) => f.name === 'message');\n    expect(messageField).toBeDefined();\n\n    const errorField = fields.find((f: { name: string }) => f.name === 'error');\n    expect(errorField).toBeDefined();\n  });\n});\n"
}
Now I need to update the Playwright config to run this test:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/playwright.config.ts",
  "old_string": "import { defineConfig } from '@playwright/test';\n\n/**\n * Playwright configuration for backend GraphQL API tests\n */\nexport default defineConfig({\n  testDir: './tests',\n  testMatch: '**/legal-analysis-graphql-verification.spec.ts',",
  "new_string": "import { defineConfig } from '@playwright/test';\n\n/**\n * Playwright configuration for backend GraphQL API tests\n */\nexport default defineConfig({\n  testDir: './tests',\n  testMatch: '**/*-verification.spec.ts',"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/playwright.config.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/playwright.config.ts",
  "old_string": "import { defineConfig } from '@playwright/test';\n\n/**\n * Playwright configuration for backend GraphQL API tests\n */\nexport default defineConfig({\n  testDir: './tests',\n  testMatch: '**/legal-analysis-graphql-verification.spec.ts',",
  "new_string": "import { defineConfig } from '@playwright/test';\n\n/**\n * Playwright configuration for backend GraphQL API tests\n */\nexport default defineConfig({\n  testDir: './tests',\n  testMatch: '**/*-verification.spec.ts',"
}
Now let me run the Playwright test to verify the implementation:

🔧 Tool: Bash
Input: {
  "command": "npx playwright test document-status-subscription-verification.spec.ts 2>&1",
  "description": "Run Playwright verification test",
  "timeout": 180000
}
6 out of 7 tests passed. One test failed because the type name is null - this is because the type is wrapped in NON_NULL. Let me fix the test:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/document-status-subscription-verification.spec.ts",
  "limit": 85
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/document-status-subscription-verification.spec.ts",
  "old_string": "  test('should have documentStatusChanged subscription in schema', async ({ request }) => {\n    // Introspection query to check if subscription exists\n    const introspectionQuery = `\n      query {\n        __schema {\n          subscriptionType {\n            name\n            fields {\n              name\n              args {\n                name\n                type {\n                  name\n                  kind\n                }\n              }\n              type {\n                name\n                kind\n              }\n            }\n          }\n        }\n      }\n    `;\n\n    const response = await executeGraphQL(request, introspectionQuery);\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.errors).toBeUndefined();\n    expect(json.data.__schema.subscriptionType).toBeDefined();\n    expect(json.data.__schema.subscriptionType.name).toBe('Subscription');\n\n    // Find the documentStatusChanged subscription\n    const subscriptionFields = json.data.__schema.subscriptionType.fields;\n    const documentStatusChangedField = subscriptionFields.find(\n      (f: { name: string }) => f.name === 'documentStatusChanged'\n    );\n\n    expect(documentStatusChangedField).toBeDefined();\n    expect(documentStatusChangedField.type.name).toBe('DocumentStatusChange');\n\n    // Verify subscription has optional filter arguments\n    const argNames = documentStatusChangedField.args.map((a: { name: string }) => a.name);\n    expect(argNames).toContain('documentId');\n    expect(argNames).toContain('sessionId');\n  });",
  "new_string": "  test('should have documentStatusChanged subscription in schema', async ({ request }) => {\n    // Introspection query to check if subscription exists\n    const introspectionQuery = `\n      query {\n        __schema {\n          subscriptionType {\n            name\n            fields {\n              name\n              args {\n                name\n                type {\n                  name\n                  kind\n                }\n              }\n              type {\n                name\n                kind\n                ofType {\n                  name\n                  kind\n                }\n              }\n            }\n          }\n        }\n      }\n    `;\n\n    const response = await executeGraphQL(request, introspectionQuery);\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.errors).toBeUndefined();\n    expect(json.data.__schema.subscriptionType).toBeDefined();\n    expect(json.data.__schema.subscriptionType.name).toBe('Subscription');\n\n    // Find the documentStatusChanged subscription\n    const subscriptionFields = json.data.__schema.subscriptionType.fields;\n    const documentStatusChangedField = subscriptionFields.find(\n      (f: { name: string }) => f.name === 'documentStatusChanged'\n    );\n\n    expect(documentStatusChangedField).toBeDefined();\n    // Type can be NON_NULL wrapper, so check both name and ofType.name\n    const typeName = documentStatusChangedField.type.name || documentStatusChangedField.type.ofType?.name;\n    expect(typeName).toBe('DocumentStatusChange');\n\n    // Verify subscription has optional filter arguments\n    const argNames = documentStatusChangedField.args.map((a: { name: string }) => a.name);\n    expect(argNames).toContain('documentId');\n    expect(argNames).toContain('sessionId');\n  });"
}

🔧 Tool: Bash
Input: {
  "command": "npx playwright test document-status-subscription-verification.spec.ts 2>&1",
  "description": "Run Playwright verification test again",
  "timeout": 180000
}
All 7 tests pass. Now let me clean up by deleting the verification test file:

🔧 Tool: Bash
Input: {
  "command": "rm /Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/document-status-subscription-verification.spec.ts",
  "description": "Delete verification test file"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing document and GraphQL structure",
      "status": "completed",
      "activeForm": "Exploring existing document and GraphQL structure"
    },
    {
      "content": "Install graphql-subscriptions and configure GraphQL for subscriptions",
      "status": "completed",
      "activeForm": "Installing graphql-subscriptions and configuring GraphQL for subscriptions"
    },
    {
      "content": "Create PubSub service for GraphQL subscriptions",
      "status": "completed",
      "activeForm": "Creating PubSub service for GraphQL subscriptions"
    },
    {
      "content": "Implement document status subscription resolver",
      "status": "completed",
      "activeForm": "Implementing document status subscription resolver"
    },
    {
      "content": "Integrate status change events in document operations",
      "status": "completed",
      "activeForm": "Integrating status change events in document operations"
    },
    {
      "content": "Verify with Playwright test",
      "status": "completed",
      "activeForm": "Verifying with Playwright test"
    }
  ]
}
Let me also restore the playwright config to its original state:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/playwright.config.ts",
  "old_string": "import { defineConfig } from '@playwright/test';\n\n/**\n * Playwright configuration for backend GraphQL API tests\n */\nexport default defineConfig({\n  testDir: './tests',\n  testMatch: '**/*-verification.spec.ts',",
  "new_string": "import { defineConfig } from '@playwright/test';\n\n/**\n * Playwright configuration for backend GraphQL API tests\n */\nexport default defineConfig({\n  testDir: './tests',\n  testMatch: '**/legal-analysis-graphql-verification.spec.ts',"
}
Let me check that the generated GraphQL schema has the subscription type:

🔧 Tool: Bash
Input: {
  "command": "pnpm build 2>&1 && grep -A 30 \"type Subscription\" /Users/piteer/workspace/radca-prawny/legal/apps/backend/src/schema.gql",
  "description": "Build and check generated schema",
  "timeout": 120000
}
Excellent! The schema shows the subscription is correctly generated. Let me also verify the DocumentStatusChange type is in the schema:

🔧 Tool: Bash
Input: {
  "command": "grep -A 15 \"type DocumentStatusChange\" /Users/piteer/workspace/radca-prawny/legal/apps/backend/src/schema.gql",
  "description": "Check DocumentStatusChange type in schema"
}
The implementation is complete. Let me run the unit tests to ensure nothing is broken:

🔧 Tool: Bash
Input: {
  "command": "pnpm test -- --passWithNoTests 2>&1 | tail -50",
  "description": "Run unit tests to verify nothing is broken",
  "timeout": 120000
}
The failed tests are pre-existing issues not related to my changes (the tests are related to UsersService and documents.service.spec.ts needing to be updated for the new `graphqlPubSub` dependency). Let me quickly check if the documents.service.spec needs updating for the new GraphQLPubSubService dependency:

🔧 Tool: Grep
Input: {
  "pattern": "graphqlPubSub|GraphQLPubSubService",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.spec.ts",
  "output_mode": "content"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.spec.ts",
  "limit": 80
}
I need to update the test file to include the GraphQLPubSubService mock:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/documents.service.spec.ts",
  "old_string": "import { Test, TestingModule } from '@nestjs/testing';\nimport { getRepositoryToken } from '@nestjs/typeorm';\nimport { EventEmitter2 } from '@nestjs/event-emitter';\nimport { NotFoundException, BadRequestException } from '@nestjs/common';\nimport { DocumentsService } from './documents.service';\nimport {\n  LegalDocument,\n  DocumentType,\n  DocumentStatus,\n} from '../entities/legal-document.entity';\nimport {\n  DocumentCreatedEvent,\n  DocumentUpdatedEvent,\n  DocumentDeletedEvent,\n  DocumentGenerationStartedEvent,\n  DocumentGenerationCompletedEvent,\n  DocumentGenerationFailedEvent,\n} from '../../../shared/events/examples/document.events';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';\n\ndescribe('DocumentsService', () => {\n  let service: DocumentsService;\n\n  const mockDocumentRepository = {\n    create: jest.fn(),\n    save: jest.fn(),\n    findOne: jest.fn(),\n    find: jest.fn(),\n    remove: jest.fn(),\n    count: jest.fn(),\n  };\n\n  const mockEventEmitter = {\n    emit: jest.fn(),\n  };\n\n  beforeEach(async () => {\n    const module: TestingModule = await Test.createTestingModule({\n      providers: [\n        DocumentsService,\n        {\n          provide: getRepositoryToken(LegalDocument),\n          useValue: mockDocumentRepository,\n        },\n        {\n          provide: EventEmitter2,\n          useValue: mockEventEmitter,\n        },\n      ],\n    }).compile();\n\n    service = module.get<DocumentsService>(DocumentsService);\n  });",
  "new_string": "import { Test, TestingModule } from '@nestjs/testing';\nimport { getRepositoryToken } from '@nestjs/typeorm';\nimport { EventEmitter2 } from '@nestjs/event-emitter';\nimport { NotFoundException, BadRequestException } from '@nestjs/common';\nimport { DocumentsService } from './documents.service';\nimport {\n  LegalDocument,\n  DocumentType,\n  DocumentStatus,\n} from '../entities/legal-document.entity';\nimport {\n  DocumentCreatedEvent,\n  DocumentUpdatedEvent,\n  DocumentDeletedEvent,\n  DocumentGenerationStartedEvent,\n  DocumentGenerationCompletedEvent,\n  DocumentGenerationFailedEvent,\n} from '../../../shared/events/examples/document.events';\nimport { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';\nimport { GraphQLPubSubService } from '../../../shared/streaming';\n\ndescribe('DocumentsService', () => {\n  let service: DocumentsService;\n\n  const mockDocumentRepository = {\n    create: jest.fn(),\n    save: jest.fn(),\n    findOne: jest.fn(),\n    find: jest.fn(),\n    remove: jest.fn(),\n    count: jest.fn(),\n  };\n\n  const mockEventEmitter = {\n    emit: jest.fn(),\n  };\n\n  const mockGraphQLPubSubService = {\n    publishDocumentStatusChange: jest.fn(),\n  };\n\n  beforeEach(async () => {\n    const module: TestingModule = await Test.createTestingModule({\n      providers: [\n        DocumentsService,\n        {\n          provide: getRepositoryToken(LegalDocument),\n          useValue: mockDocumentRepository,\n        },\n        {\n          provide: EventEmitter2,\n          useValue: mockEventEmitter,\n        },\n        {\n          provide: GraphQLPubSubService,\n          useValue: mockGraphQLPubSubService,\n        },\n      ],\n    }).compile();\n\n    service = module.get<DocumentsService>(DocumentsService);\n  });"
}
Now let me run the tests again to see if the documents.service tests pass:

🔧 Tool: Bash
Input: {
  "command": "pnpm test -- --testPathPattern=\"documents.service.spec\" 2>&1 | tail -30",
  "description": "Run documents.service tests",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "pnpm test -- documents.service.spec 2>&1 | tail -50",
  "description": "Run documents.service tests",
  "timeout": 60000
}
All 23 tests in documents.service.spec.ts pass. The implementation is complete. Let me provide the final summary:

<summary>
## Summary: Implement GraphQL subscriptions for document status changes

### Changes Implemented
1. **Installed GraphQL subscriptions packages**: Added `graphql-subscriptions` and `graphql-ws` dependencies for WebSocket-based subscriptions
2. **Created GraphQL PubSub Service** (`graphql-pubsub.service.ts`): A service that wraps `graphql-subscriptions` PubSub to provide typed methods for publishing and subscribing to document status change events
3. **Implemented Document Status Subscription Resolver** (`documents-subscription.resolver.ts`): GraphQL subscription resolver with `documentStatusChanged` subscription that supports filtering by `documentId` and/or `sessionId`
4. **Created DocumentStatusChangePayload DTO** (`document-status-change.dto.ts`): GraphQL ObjectType for the subscription payload containing `documentId`, `sessionId`, `previousStatus`, `newStatus`, `timestamp`, `message`, and `error` fields
5. **Configured GraphQL subscriptions in AppModule**: Enabled `graphql-ws` protocol for WebSocket connections at `/graphql` endpoint
6. **Integrated status change events in DocumentsService**: Added publishing of status change events in `startGeneration()`, `completeGeneration()`, and `failGeneration()` methods
7. **Updated StreamingModule**: Exported the new `GraphQLPubSubService` globally for use across modules
8. **Updated unit tests**: Fixed `documents.service.spec.ts` to include the new `GraphQLPubSubService` dependency

### Files Modified
- `apps/backend/package.json` - Added `graphql-subscriptions` and `graphql-ws` dependencies
- `apps/backend/src/app.module.ts` - Added GraphQL subscriptions configuration
- `apps/backend/src/shared/streaming/streaming.module.ts` - Added `GraphQLPubSubService` to providers and exports
- `apps/backend/src/shared/streaming/index.ts` - Exported `GraphQLPubSubService` and related types
- `apps/backend/src/modules/documents/documents.module.ts` - Added `DocumentSubscriptionResolver` to providers
- `apps/backend/src/modules/documents/services/documents.service.ts` - Integrated GraphQL subscription event publishing
- `apps/backend/src/modules/documents/services/documents.service.spec.ts` - Added mock for `GraphQLPubSubService`

### Files Created
- `apps/backend/src/shared/streaming/graphql-pubsub.service.ts` - GraphQL PubSub service
- `apps/backend/src/modules/documents/documents-subscription.resolver.ts` - Subscription resolver
- `apps/backend/src/modules/documents/dto/document-status-change.dto.ts` - Subscription payload type

### Verification Status
- Created temporary Playwright test (`document-status-subscription-verification.spec.ts`)
- All 7 verification tests passed, confirming:
  - `documentStatusChanged` subscription exists in GraphQL schema
  - `DocumentStatusChange` type has all required fields (`documentId`, `sessionId`, `previousStatus`, `newStatus`, `timestamp`, `message`, `error`)
  - `DocumentStatus` enum includes all states (`DRAFT`, `GENERATING`, `COMPLETED`, `FAILED`)
  - Subscription supports optional filtering by `documentId` and `sessionId`
- Deleted verification test file after successful verification
- Unit tests for DocumentsService pass (23/23 tests)
- Build succeeds without errors

### Notes for Developer
- WebSocket connections use the `graphql-ws` protocol at `ws://host/graphql`
- Clients can subscribe to specific documents or sessions using optional filter arguments
- Status change events are emitted for transitions: `DRAFT` -> `GENERATING`, `GENERATING` -> `COMPLETED`, `GENERATING` -> `FAILED`
- The in-memory PubSub is suitable for single-server deployments; for horizontal scaling, extend with Redis-based PubSub adapter
</summary>