
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing ChatMessage entity and DTO structure",
      "status": "in_progress",
      "activeForm": "Exploring ChatMessage entity and DTO structure"
    },
    {
      "content": "Add NOT NULL and CHECK constraints to database schema",
      "status": "pending",
      "activeForm": "Adding database constraints"
    },
    {
      "content": "Add @IsNotEmpty() validation to ChatMessage DTO",
      "status": "pending",
      "activeForm": "Adding validation decorators to DTO"
    },
    {
      "content": "Add validation in chat messages service before saving",
      "status": "pending",
      "activeForm": "Adding validation in service"
    },
    {
      "content": "Create database migration script",
      "status": "pending",
      "activeForm": "Creating database migration"
    },
    {
      "content": "Verify with Playwright test",
      "status": "pending",
      "activeForm": "Verifying with Playwright"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/entities/chat-message.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/dto/chat-message.dto.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-messages.service.ts"
}
Now let me check if there are any existing migrations and look at the resolver that handles saving chat messages:

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/migrations/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/chat-messages.resolver.ts"
}
Let me also check if there's a migrations directory and look at the existing database schema:

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/**/*migration*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/**/*migrat*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-migration.service.ts"
}
I can see that there's already validation in the migration service (line 91-97) that checks for empty content. Now I have a good understanding of the codebase. Let me update the todo list and start implementing the changes.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploration complete",
      "content": "Explore existing ChatMessage entity and DTO structure",
      "status": "completed"
    },
    {
      "activeForm": "Adding validation to DTOs",
      "content": "Add @IsNotEmpty() validation to ChatMessage DTO content fields",
      "status": "in_progress"
    },
    {
      "activeForm": "Adding validation in service",
      "content": "Add validation in ChatMessagesService before saving",
      "status": "pending"
    },
    {
      "activeForm": "Adding validation to saveMessage resolver",
      "content": "Add validation to saveMessage mutation resolver",
      "status": "pending"
    },
    {
      "activeForm": "Creating database constraint script",
      "content": "Create SQL script to add database constraints",
      "status": "pending"
    },
    {
      "activeForm": "Verifying with Playwright",
      "content": "Verify with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me add the `@IsNotEmpty()` validation decorators to the DTOs:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/dto/chat-message.dto.ts",
  "old_string": "import { InputType, Field, ID, ObjectType } from '@nestjs/graphql';\nimport { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';",
  "new_string": "import { InputType, Field, ID, ObjectType } from '@nestjs/graphql';\nimport { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/dto/chat-message.dto.ts",
  "old_string": "@InputType('CreateChatMessageInput')\nexport class CreateChatMessageInput {\n  @Field(() => String, {\n    description: 'Message content (user question or AI response)',\n  })\n  @IsString()\n  content: string;\n}",
  "new_string": "@InputType('CreateChatMessageInput')\nexport class CreateChatMessageInput {\n  @Field(() => String, {\n    description: 'Message content (user question or AI response)',\n  })\n  @IsString()\n  @IsNotEmpty()\n  content: string;\n}"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/dto/chat-message.dto.ts",
  "old_string": "@InputType('CreateAssistantMessageInput')\nexport class CreateAssistantMessageInput {\n  @Field(() => String, {\n    description: 'AI response content (markdown formatted)',\n  })\n  @IsString()\n  content: string;",
  "new_string": "@InputType('CreateAssistantMessageInput')\nexport class CreateAssistantMessageInput {\n  @Field(() => String, {\n    description: 'AI response content (markdown formatted)',\n  })\n  @IsString()\n  @IsNotEmpty()\n  content: string;"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/dto/chat-message.dto.ts",
  "old_string": "@InputType('SaveChatMessageInput')\nexport class SaveChatMessageInput {\n  @Field(() => ID, {\n    description: 'The session ID',\n  })\n  @IsString()\n  sessionId: string;\n\n  @Field(() => String, {\n    description: 'Message content',\n  })\n  @IsString()\n  content: string;",
  "new_string": "@InputType('SaveChatMessageInput')\nexport class SaveChatMessageInput {\n  @Field(() => ID, {\n    description: 'The session ID',\n  })\n  @IsString()\n  sessionId: string;\n\n  @Field(() => String, {\n    description: 'Message content',\n  })\n  @IsString()\n  @IsNotEmpty()\n  content: string;"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploration complete",
      "content": "Explore existing ChatMessage entity and DTO structure",
      "status": "completed"
    },
    {
      "activeForm": "Adding validation to DTOs complete",
      "content": "Add @IsNotEmpty() validation to ChatMessage DTO content fields",
      "status": "completed"
    },
    {
      "activeForm": "Adding validation in service",
      "content": "Add validation in ChatMessagesService before saving",
      "status": "in_progress"
    },
    {
      "activeForm": "Adding validation to saveMessage resolver",
      "content": "Add validation to saveMessage mutation resolver",
      "status": "pending"
    },
    {
      "activeForm": "Creating database constraint script",
      "content": "Create SQL script to add database constraints",
      "status": "pending"
    },
    {
      "activeForm": "Verifying with Playwright",
      "content": "Verify with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me add validation in the ChatMessagesService before saving messages:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-messages.service.ts",
  "old_string": "import {\n  Injectable,\n  NotFoundException,\n  ForbiddenException,\n  Logger,\n} from '@nestjs/common';",
  "new_string": "import {\n  Injectable,\n  NotFoundException,\n  ForbiddenException,\n  Logger,\n  BadRequestException,\n} from '@nestjs/common';"
}
Now let me add a helper validation method and call it in both create methods:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-messages.service.ts",
  "old_string": "  constructor(\n    @InjectRepository(ChatMessage)\n    private readonly chatMessageRepository: Repository<ChatMessage>,\n    @InjectRepository(ChatSession)\n    private readonly chatSessionRepository: Repository<ChatSession>,\n    private readonly chatSessionsService: ChatSessionsService,\n  ) {}",
  "new_string": "  constructor(\n    @InjectRepository(ChatMessage)\n    private readonly chatMessageRepository: Repository<ChatMessage>,\n    @InjectRepository(ChatSession)\n    private readonly chatSessionRepository: Repository<ChatSession>,\n    private readonly chatSessionsService: ChatSessionsService,\n  ) {}\n\n  /**\n   * Validate message content is not empty\n   *\n   * @param content - The message content to validate\n   * @throws BadRequestException if content is empty or only whitespace\n   */\n  private validateContent(content: string): void {\n    if (!content || typeof content !== 'string' || content.trim().length === 0) {\n      throw new BadRequestException(\n        'Message content cannot be empty. Please provide a valid message.',\n      );\n    }\n  }"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-messages.service.ts",
  "old_string": "  async createUserMessage(\n    sessionId: string,\n    userId: string,\n    input: CreateChatMessageInput,\n  ): Promise<ChatMessage> {\n    // Verify session ownership\n    await this.chatSessionsService.verifyOwnership(sessionId, userId);",
  "new_string": "  async createUserMessage(\n    sessionId: string,\n    userId: string,\n    input: CreateChatMessageInput,\n  ): Promise<ChatMessage> {\n    // Validate content is not empty\n    this.validateContent(input.content);\n\n    // Verify session ownership\n    await this.chatSessionsService.verifyOwnership(sessionId, userId);"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-messages.service.ts",
  "old_string": "  async createAssistantMessage(\n    sessionId: string,\n    userId: string,\n    input: CreateAssistantMessageInput,\n  ): Promise<ChatMessage> {\n    // Verify session ownership\n    await this.chatSessionsService.verifyOwnership(sessionId, userId);",
  "new_string": "  async createAssistantMessage(\n    sessionId: string,\n    userId: string,\n    input: CreateAssistantMessageInput,\n  ): Promise<ChatMessage> {\n    // Validate content is not empty\n    this.validateContent(input.content);\n\n    // Verify session ownership\n    await this.chatSessionsService.verifyOwnership(sessionId, userId);"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploration complete",
      "content": "Explore existing ChatMessage entity and DTO structure",
      "status": "completed"
    },
    {
      "activeForm": "Adding validation to DTOs complete",
      "content": "Add @IsNotEmpty() validation to ChatMessage DTO content fields",
      "status": "completed"
    },
    {
      "activeForm": "Adding validation in service complete",
      "content": "Add validation in ChatMessagesService before saving",
      "status": "completed"
    },
    {
      "activeForm": "Creating database constraint script",
      "content": "Create SQL script to add database constraints",
      "status": "in_progress"
    },
    {
      "activeForm": "Verifying with Playwright",
      "content": "Verify with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me create a SQL script to add the database constraints. First, let me check if there's a scripts directory or similar:

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/**/*.sql"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/**/scripts/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/database/init-pgvector.sql"
}
Let me create a SQL script for adding constraints to the chat_messages table:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/database/constraints/add-chat-message-content-not-empty.sql",
  "content": "-- Add NOT NULL and CHECK constraints to prevent empty chat messages\n--\n-- This script adds database-level validation to ensure chat messages\n-- always have non-empty content.\n--\n-- Run this script manually to add constraints to existing database:\n-- psql -U your_user -d your_database -f src/database/constraints/add-chat-message-content-not-empty.sql\n\n-- First, clean up any existing empty messages (optional)\n-- Uncomment the lines below to delete messages with empty content\n-- DELETE FROM chat_messages\n-- WHERE content IS NULL OR LENGTH(TRIM(content)) = 0;\n\n-- Add NOT NULL constraint to content column (if not already set)\n-- Note: If the column already has NOT NULL, this will be a no-op\nALTER TABLE chat_messages\nALTER COLUMN content SET NOT NULL;\n\n-- Add CHECK constraint to ensure content is not empty string (only whitespace)\nALTER TABLE chat_messages\nADD CONSTRAINT IF NOT EXISTS check_content_not_empty\nCHECK (LENGTH(TRIM(content)) > 0);\n\n-- Add comment for documentation\nCOMMENT ON CONSTRAINT check_content_not_empty ON chat_messages IS\n'Ensures message content is not empty or whitespace-only';\n\n-- Verification query to check the constraint was added\nSELECT\n    conname AS constraint_name,\n    pg_get_constraintdef(oid) AS constraint_definition\nFROM pg_constraint\nWHERE conrelid = 'chat_messages'::regclass\nAND conname = 'check_content_not_empty';\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploration complete",
      "content": "Explore existing ChatMessage entity and DTO structure",
      "status": "completed"
    },
    {
      "activeForm": "Adding validation to DTOs complete",
      "content": "Add @IsNotEmpty() validation to ChatMessage DTO content fields",
      "status": "completed"
    },
    {
      "activeForm": "Adding validation in service complete",
      "content": "Add validation in ChatMessagesService before saving",
      "status": "completed"
    },
    {
      "activeForm": "Creating database constraint script complete",
      "content": "Create SQL script to add database constraints",
      "status": "completed"
    },
    {
      "activeForm": "Verifying with Playwright",
      "content": "Verify with Playwright test",
      "status": "in_progress"
    }
  ]
}
Now let me create a Playwright test to verify the validation works. First, let me check existing E2E tests to understand the pattern:

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/tests/*.spec.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/tests/chat-ui-verification.spec.ts"
}
Now let me create a verification test for the empty content validation. This will be a unit/integration test for the backend service:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/tests/empty-chat-message-validation.spec.ts",
  "content": "import { test, expect } from '@playwright/test';\nimport { GraphQLClient } from 'graphql-request';\n\n/**\n * Empty Chat Message Validation Verification Test\n *\n * This test verifies that the backend properly validates and rejects\n * chat messages with empty content.\n *\n * Test scenarios:\n * 1. Sending a message with empty string content should fail\n * 2. Sending a message with only whitespace should fail\n * 3. Sending a valid message should succeed\n */\n\nconst GRAPHQL_URL = process.env.GRAPHQL_URL || 'http://localhost:3001/graphql';\n\n// Helper to create a test user and get token\nasync function getAuthToken(): Promise<string> {\n  const loginMutation = `\n    mutation Login($input: LoginInput!) {\n      login(input: $input) {\n        accessToken\n        user {\n          id\n          email\n        }\n      }\n    }\n  `;\n\n  const client = new GraphQLClient(GRAPHQL_URL);\n\n  try {\n    const response = await client.request<any, any>(loginMutation, {\n      input: {\n        email: 'user@example.com',\n        password: 'password123',\n      },\n    });\n\n    return response.login.accessToken;\n  } catch (error) {\n    // If test user doesn't exist, try registering first\n    const registerMutation = `\n      mutation Register($input: RegisterInput!) {\n        register(input: $input) {\n          accessToken\n          user {\n            id\n            email\n          }\n        }\n      }\n    `;\n\n    const registerResponse = await client.request<any, any>(registerMutation, {\n      input: {\n        email: 'user@example.com',\n        password: 'password123',\n        username: 'testuser',\n      },\n    });\n\n    return registerResponse.register.accessToken;\n  }\n}\n\ntest.describe('Empty Chat Message Validation', () => {\n  let authToken: string;\n\n  test.beforeAll(async () => {\n    authToken = await getAuthToken();\n  });\n\n  test('should reject message with empty content', async () => {\n    const client = new GraphQLClient(GRAPHQL_URL, {\n      headers: {\n        Authorization: `Bearer ${authToken}`,\n      },\n    });\n\n    const mutation = `\n      mutation SendChatMessageWithAI($input: SendChatMessageWithAIInput!) {\n        sendChatMessageWithAI(input: $input) {\n          sessionId\n          userMessage {\n            messageId\n            content\n          }\n        }\n      }\n    `;\n\n    await expect(\n      client.request(mutation, {\n        input: {\n          question: '',\n          mode: 'SIMPLE',\n        },\n      })\n    ).rejects.toThrow();\n  });\n\n  test('should reject message with only whitespace', async () => {\n    const client = new GraphQLClient(GRAPHQL_URL, {\n      headers: {\n        Authorization: `Bearer ${authToken}`,\n      },\n    });\n\n    const mutation = `\n      mutation SendChatMessageWithAI($input: SendChatMessageWithAIInput!) {\n        sendChatMessageWithAI(input: $input) {\n          sessionId\n          userMessage {\n            messageId\n            content\n          }\n        }\n      }\n    `;\n\n    await expect(\n      client.request(mutation, {\n        input: {\n          question: '   \\t\\n   ',\n          mode: 'SIMPLE',\n        },\n      })\n    ).rejects.toThrow();\n  });\n\n  test('should accept valid message', async () => {\n    const client = new GraphQLClient(GRAPHQL_URL, {\n      headers: {\n        Authorization: `Bearer ${authToken}`,\n      },\n    });\n\n    const mutation = `\n      mutation SendChatMessageWithAI($input: SendChatMessageWithAIInput!) {\n        sendChatMessageWithAI(input: $input) {\n          sessionId\n          userMessage {\n            messageId\n            content\n            role\n          }\n        }\n      }\n    `;\n\n    const response = await client.request(mutation, {\n      input: {\n        question: 'What are my rights as a tenant?',\n        mode: 'SIMPLE',\n      },\n    });\n\n    expect(response.sendChatMessageWithAI).toBeDefined();\n    expect(response.sendChatMessageWithAI.userMessage).toBeDefined();\n    expect(response.sendChatMessageWithAI.userMessage.content).toBe('What are my rights as a tenant?');\n  });\n\n  test('should reject saveChatMessage with empty content', async () => {\n    const client = new GraphQLClient(GRAPHQL_URL, {\n      headers: {\n        Authorization: `Bearer ${authToken}`,\n      },\n    });\n\n    // First create a session\n    const createSessionMutation = `\n      mutation {\n        sendChatMessageWithAI(input: { question: \"test\", mode: \"SIMPLE\" }) {\n          sessionId\n        }\n      }\n    `;\n\n    const sessionResponse = await client.request(createSessionMutation);\n    const sessionId = sessionResponse.sendChatMessageWithAI.sessionId;\n\n    // Try to save empty message\n    const saveMutation = `\n      mutation SaveChatMessage($input: SaveChatMessageInput!) {\n        saveChatMessage(input: $input) {\n          messageId\n          content\n        }\n      }\n    `;\n\n    await expect(\n      client.request(saveMutation, {\n        input: {\n          sessionId,\n          content: '',\n          role: 'ASSISTANT',\n        },\n      })\n    ).rejects.toThrow();\n  });\n});\n"
}
