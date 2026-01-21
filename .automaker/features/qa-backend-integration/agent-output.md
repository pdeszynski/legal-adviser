I'll help you implement this feature to extend the AI Client Service with an `askQuestion` method and implement a GraphQL mutation in the backend. Let me start by exploring the codebase to understand the existing structure.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase structure for AI Client Service and backend modules",
      "status": "in_progress",
      "activeForm": "Exploring codebase structure"
    },
    {
      "content": "Understand existing AI service patterns and GraphQL mutations",
      "status": "pending",
      "activeForm": "Understanding existing patterns"
    },
    {
      "content": "Implement askQuestion method in AI Client Service",
      "status": "pending",
      "activeForm": "Implementing askQuestion method"
    },
    {
      "content": "Implement GraphQL mutation in backend",
      "status": "pending",
      "activeForm": "Implementing GraphQL mutation"
    },
    {
      "content": "Verify implementation with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright test"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "**/ai-engine/**/*.py"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/backend/src/modules/**/"
}

🔧 Tool: Grep
Input: {
  "pattern": "class.*Service",
  "glob": "**/backend/src/**/*.ts",
  "output_mode": "files_with_matches"
}
Now let me look at the specific files related to the AI client service and queries module:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/ai-client/ai-client.service.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/ai-engine/src/**/*.py"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/backend/src/modules/queries/**/*.ts"
}
Good! I can see the `askQuestion` method already exists in the AI Client Service. Now let me examine the AI engine and queries module to understand the complete picture:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/queries.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/entities/legal-query.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/shared/ai-client/ai-client.types.ts"
}
Let me read the queries service to understand how it works:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/services/queries.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/requests.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/responses.py"
}
Now let me check the existing GraphQL module structure to see how mutations are implemented:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure for AI Client Service and backend modules",
      "content": "Explore codebase structure for AI Client Service and backend modules",
      "status": "completed"
    },
    {
      "activeForm": "Understanding existing AI service patterns and GraphQL mutations",
      "content": "Understand existing AI service patterns and GraphQL mutations",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing askQuestion method in AI Client Service",
      "content": "Implement askQuestion method in AI Client Service",
      "status": "pending"
    },
    {
      "activeForm": "Implementing GraphQL mutation in backend",
      "content": "Implement GraphQL mutation in backend",
      "status": "pending"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify implementation with Playwright test",
      "status": "pending"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/queries.module.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "@Mutation",
  "glob": "**/backend/src/**/*.resolver.ts",
  "output_mode": "content",
  "-n": true,
  "-B": 2,
  "-A": 5
}
Excellent! Now I have a good understanding of the codebase. Let me update the todo list and analyze what I found:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure for AI Client Service and backend modules",
      "content": "Explore codebase structure for AI Client Service and backend modules",
      "status": "completed"
    },
    {
      "activeForm": "Understanding existing AI service patterns and GraphQL mutations",
      "content": "Understand existing AI service patterns and GraphQL mutations",
      "status": "completed"
    },
    {
      "activeForm": "Analyzing feature requirements and planning implementation",
      "content": "Analyze feature requirements and plan implementation",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing askQuestion method in AI Client Service",
      "content": "Implement askQuestion method in AI Client Service",
      "status": "pending"
    },
    {
      "activeForm": "Implementing GraphQL mutation in backend",
      "content": "Implement GraphQL mutation in backend",
      "status": "pending"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify implementation with Playwright test",
      "status": "pending"
    }
  ]
}
Based on my exploration, I've discovered that:

1. **The `askQuestion` method already exists** in `apps/backend/src/shared/ai-client/ai-client.service.ts:80-93`
2. **The AI Engine endpoint `/api/v1/qa/ask` is already implemented** in `apps/ai-engine/src/main.py:237-309`
3. **The GraphQL mutations for queries exist** in `apps/backend/src/modules/queries/queries.resolver.ts`

However, looking at the feature description more carefully, it seems the task is to create a new GraphQL mutation that:
- Accepts a question and optional mode
- Calls the AI engine's `/api/v1/qa/ask` endpoint via the `askQuestion` method
- Stores the result in the database (creates a LegalQuery entity with the answer)

Let me check if there's already a mutation that does this or if we need to create a new one:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/dto/legal-query.dto.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "askQuestion|ask.*question",
  "-i": true,
  "glob": "**/backend/src/**/*.ts",
  "output_mode": "files_with_matches"
}
Now let me check if there's already a mutation that integrates the AI client with the queries service:

🔧 Tool: Grep
Input: {
  "pattern": "submitQuery|submitLegalQuery",
  "output_mode": "content",
  "-A": 10,
  "-B": 5,
  "glob": "**/backend/src/**/*.ts"
}
Now I understand the architecture better. Looking at the feature description again and the existing code:

**Current State:**
- `submitLegalQuery` mutation exists and creates a query in pending state (null answer)
- It emits an event for async processing
- The `answerLegalQuery` mutation exists to add the answer later
- The `askQuestion` method in AI Client Service already exists

**What's Missing:**
Based on the feature description "Extend AI Client Service with askQuestion method. Implement GraphQL mutation in backend to trigger Q&A workflow and store results", it seems we need a **synchronous** mutation that:
1. Accepts a question and optional mode
2. Calls the AI engine via `askQuestion` method  
3. Immediately stores the result (answer + citations) in the database

This is different from the current `submitLegalQuery` which creates a pending query and relies on async event processing.

Let me create a new mutation called `askLegalQuestion` that does this:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure for AI Client Service and backend modules",
      "content": "Explore codebase structure for AI Client Service and backend modules",
      "status": "completed"
    },
    {
      "activeForm": "Understanding existing AI service patterns and GraphQL mutations",
      "content": "Understand existing AI service patterns and GraphQL mutations",
      "status": "completed"
    },
    {
      "activeForm": "Analyzing feature requirements and planning implementation",
      "content": "Analyze feature requirements and plan implementation",
      "status": "completed"
    },
    {
      "activeForm": "Creating new GraphQL mutation for Q&A integration",
      "content": "Create new GraphQL mutation for Q&A integration",
      "status": "in_progress"
    },
    {
      "activeForm": "Verifying with Playwright test",
      "content": "Verify implementation with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me implement the solution. First, I'll add the new DTO and mutation:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/dto/legal-query.dto.ts",
  "old_string": "/**\n * DTO for answering a legal query\n *\n * Used by the answerLegalQuery mutation to add AI-generated\n * responses and citations to an existing query.\n */\n@InputType('AnswerLegalQueryInput')\nexport class AnswerLegalQueryInput {\n  @Field(() => String, {\n    description: 'The AI-generated answer in Markdown format',\n  })\n  @IsString()\n  @IsNotEmpty({ message: 'Answer is required' })\n  answerMarkdown: string;\n\n  @Field(() => [CreateCitationInput], {\n    nullable: true,\n    description: 'Citations and references for the answer',\n  })\n  @IsOptional()\n  @IsArray()\n  @ValidateNested({ each: true })\n  @Type(() => CreateCitationInput)\n  citations?: CreateCitationInput[];\n}",
  "new_string": "/**\n * DTO for answering a legal query\n *\n * Used by the answerLegalQuery mutation to add AI-generated\n * responses and citations to an existing query.\n */\n@InputType('AnswerLegalQueryInput')\nexport class AnswerLegalQueryInput {\n  @Field(() => String, {\n    description: 'The AI-generated answer in Markdown format',\n  })\n  @IsString()\n  @IsNotEmpty({ message: 'Answer is required' })\n  answerMarkdown: string;\n\n  @Field(() => [CreateCitationInput], {\n    nullable: true,\n    description: 'Citations and references for the answer',\n  })\n  @IsOptional()\n  @IsArray()\n  @ValidateNested({ each: true })\n  @Type(() => CreateCitationInput)\n  citations?: CreateCitationInput[];\n}\n\n/**\n * DTO for asking a legal question with AI\n *\n * Used by the askLegalQuestion mutation to synchronously query the AI\n * and store the result. This is a blocking operation that calls the AI engine\n * and returns the complete answer.\n *\n * Use cases:\n * - Direct Q&A interaction where immediate response is needed\n * - Simple question-answer flow without background processing\n *\n * For async processing with event-driven architecture, use submitLegalQuery instead.\n */\n@InputType('AskLegalQuestionInput')\nexport class AskLegalQuestionInput {\n  @Field(() => String, {\n    description: 'Session ID for the user asking the question',\n  })\n  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })\n  @IsNotEmpty({ message: 'Session ID is required' })\n  sessionId: string;\n\n  @Field(() => String, {\n    description: 'The legal question to ask the AI',\n  })\n  @IsString()\n  @IsNotEmpty({ message: 'Question is required' })\n  @MinLength(3, { message: 'Question must be at least 3 characters long' })\n  @MaxLength(10000, {\n    message: 'Question must be at most 10000 characters long',\n  })\n  @Transform(({ value }) => sanitizeString(value))\n  question: string;\n\n  @Field(() => String, {\n    nullable: true,\n    description: 'Response mode: LAWYER (detailed legal analysis) or SIMPLE (layperson-friendly)',\n  })\n  @IsOptional()\n  @IsString()\n  @IsIn(['LAWYER', 'SIMPLE'], {\n    message: 'Mode must be either LAWYER or SIMPLE',\n  })\n  mode?: string;\n}"
}
Now let me add the new method to the queries service:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/services/queries.service.ts",
  "old_string": "  /**\n   * Get pending queries (queries without answers)\n   * Useful for AI processing queues\n   */\n  async getPendingQueries(limit?: number): Promise<LegalQuery[]> {\n    return this.findAll({ hasAnswer: false, limit });\n  }\n}",
  "new_string": "  /**\n   * Get pending queries (queries without answers)\n   * Useful for AI processing queues\n   */\n  async getPendingQueries(limit?: number): Promise<LegalQuery[]> {\n    return this.findAll({ hasAnswer: false, limit });\n  }\n\n  /**\n   * Ask a legal question and get AI response\n   *\n   * Synchronously calls the AI engine to answer the question and stores the result.\n   * Unlike submitQuery, this method waits for the AI response before returning.\n   *\n   * @param dto - Question data with optional mode\n   * @param askQuestionFn - Function to call the AI engine (injected for testability)\n   * @returns The query with the AI-generated answer and citations\n   */\n  async askQuestion(\n    dto: SubmitQueryDto & { mode?: string },\n    askQuestionFn: (question: string, sessionId: string, mode?: string) => Promise<{\n      answer: string;\n      citations: Array<{ source: string; article: string; url?: string }>;\n      confidence: number;\n    }>,\n  ): Promise<LegalQuery> {\n    // Create query in pending state\n    const query = this.queryRepository.create({\n      sessionId: dto.sessionId,\n      question: dto.question,\n      answerMarkdown: null,\n      citations: null,\n    });\n\n    const savedQuery = await this.queryRepository.save(query);\n\n    try {\n      // Call AI engine synchronously\n      const aiResponse = await askQuestionFn(\n        dto.question,\n        dto.sessionId,\n        dto.mode || 'SIMPLE',\n      );\n\n      // Convert AI citations to entity format\n      const entityCitations: Citation[] = aiResponse.citations.map(\n        (c) => ({\n          source: c.source,\n          article: c.article,\n          url: c.url,\n          excerpt: undefined,\n        }),\n      );\n\n      // Update query with AI response\n      savedQuery.setAnswer(aiResponse.answer, entityCitations);\n      const updatedQuery = await this.queryRepository.save(savedQuery);\n\n      // Emit domain event\n      this.eventEmitter.emit(\n        EVENT_PATTERNS.QUERY.ANSWERED,\n        new QueryAnsweredEvent(\n          updatedQuery.id,\n          updatedQuery.sessionId,\n          updatedQuery.getCitationCount(),\n          new Date(),\n        ),\n      );\n\n      return updatedQuery;\n    } catch (error) {\n      // If AI call fails, still keep the query but with null answer\n      // The caller can retry or handle the error\n      this.eventEmitter.emit(\n        EVENT_PATTERNS.QUERY.ASKED,\n        new QuerySubmittedEvent(\n          savedQuery.id,\n          savedQuery.sessionId,\n          savedQuery.question,\n          savedQuery.createdAt,\n        ),\n      );\n      throw error;\n    }\n  }\n}"
}
Now let me add the new mutation to the resolver:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/queries.resolver.ts",
  "old_string": "import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';\nimport { QueriesService } from './services/queries.service';\nimport {\n  SubmitLegalQueryInput,\n  AnswerLegalQueryInput,\n  CreateCitationInput,\n} from './dto/legal-query.dto';\nimport { LegalQuery, Citation } from './entities/legal-query.entity';\nimport { StrictThrottle, SkipThrottle } from '../../shared/throttler';",
  "new_string": "import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';\nimport { QueriesService } from './services/queries.service';\nimport {\n  SubmitLegalQueryInput,\n  AnswerLegalQueryInput,\n  CreateCitationInput,\n  AskLegalQuestionInput,\n} from './dto/legal-query.dto';\nimport { LegalQuery, Citation } from './entities/legal-query.entity';\nimport { StrictThrottle, SkipThrottle } from '../../shared/throttler';\nimport { AiClientService } from '../../shared/ai-client/ai-client.service';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/queries.resolver.ts",
  "old_string": "@Resolver(() => LegalQuery)\nexport class QueriesResolver {\n  constructor(private readonly queriesService: QueriesService) {}",
  "new_string": "@Resolver(() => LegalQuery)\nexport class QueriesResolver {\n  constructor(\n    private readonly queriesService: QueriesService,\n    private readonly aiClientService: AiClientService,\n  ) {}"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/queries.resolver.ts",
  "old_string": "  /**\n   * Mutation: Submit a new legal query\n   *\n   * Creates a new query and queues it for AI processing.\n   * Returns the query with null answerMarkdown (pending state).\n   *\n   * This is the primary entry point for the Q&A flow:\n   * 1. User submits question via this mutation\n   * 2. Event is emitted for async AI processing\n   * 3. Frontend can poll or subscribe for updates\n   * 4. Use answerLegalQuery to add the AI response\n   *\n   * @example\n   * ```graphql\n   * mutation {\n   *   submitLegalQuery(input: {\n   *     sessionId: \"uuid-here\"\n   *     question: \"What are my rights as a tenant?\"\n   *   }) {\n   *     id\n   *     question\n   *     answerMarkdown  # Will be null initially\n   *     createdAt\n   *   }\n   * }\n   * ```\n   */\n  @StrictThrottle()\n  @Mutation(() => LegalQuery, {\n    name: 'submitLegalQuery',\n    description: 'Submit a new legal query for AI processing',\n  })\n  async submitQuery(\n    @Args('input') input: SubmitLegalQueryInput,\n  ): Promise<LegalQuery> {\n    return this.queriesService.submitQuery({\n      sessionId: input.sessionId,\n      question: input.question,\n    });\n  }",
  "new_string": "  /**\n   * Mutation: Submit a new legal query\n   *\n   * Creates a new query and queues it for AI processing.\n   * Returns the query with null answerMarkdown (pending state).\n   *\n   * This is the primary entry point for the Q&A flow:\n   * 1. User submits question via this mutation\n   * 2. Event is emitted for async AI processing\n   * 3. Frontend can poll or subscribe for updates\n   * 4. Use answerLegalQuery to add the AI response\n   *\n   * @example\n   * ```graphql\n   * mutation {\n   *   submitLegalQuery(input: {\n   *     sessionId: \"uuid-here\"\n   *     question: \"What are my rights as a tenant?\"\n   *   }) {\n   *     id\n   *     question\n   *     answerMarkdown  # Will be null initially\n   *     createdAt\n   *   }\n   * }\n   * ```\n   */\n  @StrictThrottle()\n  @Mutation(() => LegalQuery, {\n    name: 'submitLegalQuery',\n    description: 'Submit a new legal query for AI processing',\n  })\n  async submitQuery(\n    @Args('input') input: SubmitLegalQueryInput,\n  ): Promise<LegalQuery> {\n    return this.queriesService.submitQuery({\n      sessionId: input.sessionId,\n      question: input.question,\n    });\n  }\n\n  /**\n   * Mutation: Ask a legal question with AI (synchronous)\n   *\n   * Calls the AI engine to answer the question and stores the result.\n   * This mutation blocks until the AI response is received.\n   *\n   * Unlike submitLegalQuery (which is async and event-driven),\n   * this mutation returns the complete answer immediately.\n   *\n   * Use cases:\n   * - Direct Q&A where immediate response is needed\n   * - Simple synchronous question-answer flow\n   * - Testing AI integration\n   *\n   * @example\n   * ```graphql\n   * mutation {\n   *   askLegalQuestion(input: {\n   *     sessionId: \"uuid-here\"\n   *     question: \"What are my rights as a tenant?\"\n   *     mode: \"SIMPLE\"\n   *   }) {\n   *     id\n   *     question\n   *     answerMarkdown\n   *     citations { source article url }\n   *     createdAt\n   *   }\n   * }\n   * ```\n   */\n  @StrictThrottle()\n  @Mutation(() => LegalQuery, {\n    name: 'askLegalQuestion',\n    description: 'Ask a legal question and get AI answer synchronously',\n  })\n  async askQuestion(\n    @Args('input') input: AskLegalQuestionInput,\n  ): Promise<LegalQuery> {\n    return this.queriesService.askQuestion(\n      {\n        sessionId: input.sessionId,\n        question: input.question,\n        mode: input.mode,\n      },\n      async (question, sessionId, mode) => {\n        return this.aiClientService.askQuestion({\n          question,\n          session_id: sessionId,\n          mode,\n        });\n      },\n    );\n  }"
}
Now I need to ensure the queries module imports the AiClientService. Let me check the module configuration:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/queries.module.ts",
  "old_string": "import { Module } from '@nestjs/common';\nimport { TypeOrmModule } from '@nestjs/typeorm';\nimport { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';\nimport { LegalQuery } from './entities/legal-query.entity';\nimport {\n  CreateLegalQueryInput,\n  UpdateLegalQueryInput,\n} from './dto/legal-query.dto';\nimport { QueriesService } from './services/queries.service';\nimport { QueriesResolver } from './queries.resolver';",
  "new_string": "import { Module } from '@nestjs/common';\nimport { TypeOrmModule } from '@nestjs/typeorm';\nimport { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';\nimport { LegalQuery } from './entities/legal-query.entity';\nimport {\n  CreateLegalQueryInput,\n  UpdateLegalQueryInput,\n} from './dto/legal-query.dto';\nimport { QueriesService } from './services/queries.service';\nimport { QueriesResolver } from './queries.resolver';\nimport { AiClientModule } from '../../shared/ai-client/ai-client.module';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/queries.module.ts",
  "old_string": "@Module({\n  imports: [\n    // TypeORM repository for custom service\n    TypeOrmModule.forFeature([LegalQuery]),\n    // nestjs-query auto-generated CRUD resolvers\n    NestjsQueryGraphQLModule.forFeature({",
  "new_string": "@Module({\n  imports: [\n    // TypeORM repository for custom service\n    TypeOrmModule.forFeature([LegalQuery]),\n    // AI Client Service for synchronous Q&A\n    AiClientModule,\n    // nestjs-query auto-generated CRUD resolvers\n    NestjsQueryGraphQLModule.forFeature({"
}
