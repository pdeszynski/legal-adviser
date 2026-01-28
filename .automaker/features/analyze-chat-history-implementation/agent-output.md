I'll conduct a comprehensive audit of the existing chat history implementation. Let me start by exploring the codebase to understand the current structure.

🔧 Tool: Task
Input: {
  "description": "Explore chat history implementation",
  "prompt": "Explore the chat history implementation in this codebase. I need to understand:\n\n1. ChatSession entity structure and relationships - find in apps/backend/src/domain/chat/\n2. ChatMessage entity and database schema\n3. GraphQL resolvers for chat operations - find in apps/backend/src/modules/chat/\n4. Frontend chat components and state management - apps/web/src/app/(authenticated)/chat/ and apps/web/src/components/chat/\n5. LocalStorage usage patterns - search for localStorage in web/src\n6. Session ID generation logic - search for session_id, sessionId, crypto.randomUUID\n7. JWT/session validation flow - how frontend communicates with AI Engine\n8. Message persistence flow from frontend to backend\n\nPlease provide a comprehensive summary of:\n- All files involved in chat history\n- Current architecture and data flow\n- Any obvious issues or patterns that seem incorrect\n- Dependencies between components\n\nThis is a research task - do NOT make any code changes.",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/domain/chat/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/chat/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/app/(authenticated)/chat/**/*.ts*"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/web/src/components/chat/**/*.ts*"
}

🔧 Tool: Grep
Input: {
  "glob": "apps/web/src/**/*.ts*",
  "output_mode": "files_with_matches",
  "pattern": "localStorage"
}

🔧 Tool: Grep
Input: {
  "glob": "apps/web/src/**/*.ts*",
  "output_mode": "files_with_matches",
  "pattern": "session_id|sessionId|crypto\\.randomUUID"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/entities/chat-session.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/entities/chat-message.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/chat-sessions.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/useStreamingChat.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/chat/chat-interface.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-sessions.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-migration.service.ts"
}

🔧 Tool: Grep
Input: {
  "-n": true,
  "glob": "apps/ai-engine/src/**/*.py",
  "output_mode": "content",
  "pattern": "session_id|set_user_session_id|UUID_V4"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/auth/jwt.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/use-chat-history.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/chat/chat-migration-prompt.tsx"
}

🔧 Tool: Grep
Input: {
  "glob": "apps/backend/src/**/*.graphql",
  "output_mode": "files_with_matches",
  "pattern": "chat"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/schema.gql"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/schema.gql",
  "limit": 100,
  "offset": 1
}

🔧 Tool: Grep
Input: {
  "glob": "apps/backend/src/schema.gql",
  "output_mode": "content",
  "pattern": "type ChatSession|type ChatMessage"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/schema.gql",
  "limit": 100,
  "offset": 890
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/migrations/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/migrations/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/seeds/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/use-chat.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/use-chat-migration.ts"
}
Now let me examine the specific files in more detail to understand the exact issues:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/components/chat/chat-interface.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/useStreamingChat.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/domain/chat/entities/chat-session.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/domain/chat/entities/chat-message.entity.ts"
}
Let me find the correct entity files:

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/domain/chat/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/chat/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/entities/chat-session.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/entities/chat-message.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/chat-sessions.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/use-chat-history.ts"
}
Now let me look at how messages are persisted to the backend and search for any remaining localStorage usage:

🔧 Tool: Grep
Input: {
  "-n": true,
  "glob": "**/*.{ts,tsx}",
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src",
  "pattern": "localStorage"
}

🔧 Tool: Grep
Input: {
  "-n": true,
  "glob": "**/*.{ts,tsx}",
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src",
  "pattern": "crypto\\.randomUUID|sessionId"
}
Now let me look at the backend chat service to understand message persistence and check for any issues:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-sessions.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/web/src/hooks/use-streaming-chat.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Analyze chat architecture issues",
      "status": "in_progress",
      "activeForm": "Analyzing chat architecture issues"
    },
    {
      "content": "Document findings and technical specification",
      "status": "pending",
      "activeForm": "Documenting findings and technical specification"
    },
    {
      "content": "Create comprehensive audit report",
      "status": "pending",
      "activeForm": "Creating comprehensive audit report"
    }
  ]
}
Now let me check how messages are actually persisted - whether the backend creates messages:

🔧 Tool: Grep
Input: {
  "-n": true,
  "glob": "**/*.ts",
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat",
  "pattern": "createMessage|saveMessage|createOneChatMessage|ChatMessage"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/chat/**/*.resolver.ts"
}
Let me check if there's a mutation for creating chat messages and how AI Engine integration works for persistence:

🔧 Tool: Grep
Input: {
  "-n": true,
  "glob": "**/*.ts",
  "output_mode": "content",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src",
  "pattern": "askLegalQuestion|createOneChatMessage|Mutation.*ChatMessage"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/qa/qa.resolver.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/queries/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/qa/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/queries.resolver.ts"
}
Now I have a comprehensive understanding. Let me update the todo and create the audit report document:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Analyzing chat architecture issues",
      "content": "Analyze chat architecture issues",
      "status": "completed"
    },
    {
      "activeForm": "Documenting findings and technical specification",
      "content": "Document findings and technical specification",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating comprehensive audit report",
      "content": "Create comprehensive audit report",
      "status": "pending"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.automaker/features/analyze-chat-history-implementation/AUDIT_REPORT.md",
  "content": "# Chat History Implementation Audit Report\n\n**Feature ID:** analyze-chat-history-implementation\n**Date:** 2025-01-28\n**Auditor:** Claude Code\n\n---\n\n## Executive Summary\n\nThe chat history implementation is in a **transition state** from localStorage-only to database-only storage. While the backend infrastructure for chat sessions and messages is well-designed, there are **critical architectural issues** in the current implementation:\n\n1. **No Message Persistence Flow**: Messages from AI Engine streaming are NOT automatically saved to the database\n2. **Dual Storage Confusion**: Two different chat systems exist side-by-side (LegalQuery vs ChatSession/ChatMessage)\n3. **Frontend-Generated Session IDs**: Session IDs are generated on the frontend, violating the \"backend-managed\" principle stated in code comments\n4. **Missing Backend Integration**: AI Engine has no webhook/callback mechanism to persist completed responses\n\n---\n\n## 1. Entity Structure Analysis\n\n### 1.1 ChatSession Entity (`apps/backend/src/modules/chat/entities/chat-session.entity.ts`)\n\n**Status:** ✅ Well-designed\n\n```typescript\n@Entity('chat_sessions')\nexport class ChatSession {\n  id: string;                          // UUID primary key\n  userId: string;                       // Foreign key to User\n  title: string | null;                 // Auto-generated from first message\n  mode: ChatMode;                       // LAWYER | SIMPLE\n  messageCount: number;                 // Tracked automatically\n  isPinned: boolean;                    // User favorites\n  lastMessageAt: Date | null;           // For sorting\n  createdAt: Date;\n  updatedAt: Date;\n  deletedAt: Date | null;               // Soft delete\n}\n```\n\n**Strengths:**\n- Proper soft delete implementation\n- Auto-generated title fallback\n- Good indexing (userId, lastMessageAt, mode, deletedAt)\n- Cascade delete relationship to messages\n\n**Issues:** None identified\n\n---\n\n### 1.2 ChatMessage Entity (`apps/backend/src/modules/chat/entities/chat-message.entity.ts`)\n\n**Status:** ✅ Well-designed\n\n```typescript\n@Entity('chat_messages')\nexport class ChatMessage {\n  messageId: string;                    // UUID primary key\n  sessionId: string;                    // Foreign key to ChatSession\n  role: MessageRole;                    // USER | ASSISTANT | SYSTEM\n  content: string;                      // Markdown for assistant\n  rawContent: string | null;            // Original content\n  citations: ChatCitation[] | null;     // JSONB\n  metadata: ChatMessageMetadata | null; // JSONB (confidence, model, etc.)\n  sequenceOrder: number;                // For ordering\n  createdAt: Date;\n}\n```\n\n**Strengths:**\n- Proper sequence ordering support\n- JSONB for flexible metadata/citations\n- Good indexing (sessionId, sequenceOrder)\n\n**Issues:** None identified\n\n---\n\n## 2. GraphQL Resolvers Analysis\n\n### 2.1 ChatSessionsResolver (`apps/backend/src/modules/chat/chat-sessions.resolver.ts`)\n\n**Status:** ⚠️ Missing Critical Mutation\n\n**Available Operations:**\n| Query/Mutation | Purpose | Status |\n|----------------|---------|--------|\n| `chatSessions` | List user's sessions | ✅ Working |\n| `chatSessionDetail` | Get session with messages | ✅ Working |\n| `chatMessages` | Get messages for session | ✅ Working |\n| `createChatSession` | Create new session | ✅ Working |\n| `updateChatSessionTitle` | Rename session | ✅ Working |\n| `deleteChatSession` | Soft delete | ✅ Working |\n| `pinChatSession` | Toggle pin | ✅ Working |\n| `exportChatSession` | Export to PDF/MD/JSON | ✅ Working |\n| `searchChatContent` | Full-text search | ✅ Working |\n\n**CRITICAL MISSING OPERATION:**\n```typescript\n// This mutation DOES NOT EXIST but is needed:\n@Mutation(() => ChatMessage)\nasync createChatMessage(\n  @Args('input') input: CreateChatMessageInput\n): Promise<ChatMessage>\n```\n\n**Impact:** Frontend has no way to persist streaming chat responses to the database.\n\n---\n\n### 2.2 Dual System Problem: LegalQuery vs ChatSession\n\n**Current State:** Two separate chat systems exist:\n\n| Aspect | LegalQuery System | ChatSession System |\n|--------|-------------------|-------------------|\n| Entity | `LegalQuery` | `ChatSession` + `ChatMessage` |\n| Resolver | `QueriesResolver` | `ChatSessionsResolver` |\n| Mutation | `askLegalQuestion` | ❌ No equivalent |\n| Purpose | Document-based queries | Conversational chat |\n| Storage | ✅ Working | ⚠️ No persistence flow |\n| Streaming | ❌ No | ✅ Yes (direct to AI Engine) |\n\n**Issue:** The `askLegalQuestion` mutation in `queries.resolver.ts` saves to the `LegalQuery` entity, NOT the new `ChatSession/ChatMessage` entities. The streaming chat bypasses GraphQL entirely.\n\n---\n\n## 3. Frontend Chat Implementation Analysis\n\n### 3.1 Chat Interface (`apps/web/src/components/chat/chat-interface.tsx`)\n\n**Status:** ⚠️ Issues with Session Management\n\n**Key Findings:**\n\n1. **Session ID Generation (Line 277, 408):**\n```typescript\n// WARNING comment says \"Do NOT use localStorage\" but...\nconst newSessionId = crypto.randomUUID();  // Frontend-generated!\n```\n\n**Problem:** Session IDs are generated on the frontend via `crypto.randomUUID()`, contradicting the warning comment that says \"Session IDs are managed by the backend only.\"\n\n2. **Message Storage:**\n```typescript\n// Messages are stored in React state only\nconst [messages, setMessages] = useState<ChatMessage[]>([]);\n```\n\n**Problem:** Messages are NEVER persisted to the database during active chat. They only exist in component state.\n\n3. **No Persistence Call:**\nThe `handleSendMessage` function (line 398) calls `sendStreamingMessage` which fetches from AI Engine, but there is **no follow-up GraphQL mutation** to save the response to the database.\n\n---\n\n### 3.2 useStreamingChat Hook (`apps/web/src/hooks/useStreamingChat.ts`)\n\n**Status:** ⚠️ Critical Gap in Message Persistence\n\n**Analysis:**\n\n1. **Fetches Conversation History (Line 285-339):**\n```typescript\nconst fetchConversationHistory = useCallback(async (sessionId: string) => {\n  // Fetches from backend via GraphQL\n  const response = await fetch(GRAPHQL_URL, {\n    body: JSON.stringify({\n      query: `query GetChatMessages($sessionId: ID!) { ... }`\n    })\n  });\n}, []);\n```\n\n✅ This correctly reads from the database.\n\n2. **Streams from AI Engine (Line 440-671):**\n```typescript\nconst executeStreamRequest = useCallback(async (...) => {\n  // Direct streaming from AI Engine\n  const response = await fetch(`${AI_ENGINE_URL}/api/v1/qa/ask-stream`, {\n    method: 'POST',\n    body: JSON.stringify({ question, mode, session_id: sessionId })\n  });\n  // ... processes SSE stream ...\n  return finalResponse;\n}, []);\n```\n\n✅ Streaming works correctly.\n\n3. **MISSING: Database Persistence:**\n\nAfter the stream completes, there is **NO call** to a GraphQL mutation like:\n```typescript\n// This DOES NOT EXIST:\nmutation SaveChatMessage($input: SaveChatMessageInput!) {\n  createChatMessage(input: $input) {\n    messageId\n    sequenceOrder\n  }\n}\n```\n\n---\n\n### 3.3 use-chat-history Hook (`apps/web/src/hooks/use-chat-history.ts`)\n\n**Status:** ✅ Correctly implemented\n\n**Analysis:**\n- `useChatHistory`: Fetches session list from backend ✅\n- `useChatSession`: Fetches session with messages from backend ✅\n- Proper pagination support ✅\n- Proper error handling ✅\n\n**Note:** These hooks work correctly for reading, but since messages are never saved, they will always return empty sessions.\n\n---\n\n## 4. LocalStorage Usage Analysis\n\n### 4.1 Current Usage Patterns\n\n| File | Usage | Purpose | Status |\n|------|-------|---------|--------|\n| `chat-interface.tsx:290` | `localStorage.getItem('access_token')` | Auth token | ✅ Legitimate |\n| `use-chat-migration.ts` | Multiple reads | Migration from old system | ✅ Temporary |\n| `use-streaming-chat.ts:98` | Warning comment | No actual storage | ✅ Correct |\n| `chat-interface.tsx:279` | Warning comment | No actual storage | ✅ Correct |\n\n### 4.2 Migration System (`use-chat-migration.ts`)\n\n**Status:** ✅ Well-designed for one-time migration\n\n**Purpose:** Migrates old localStorage chat sessions to the new database system.\n\n**Flow:**\n1. Scans localStorage for `chat_history_*` keys\n2. Validates session data\n3. Calls `migrateChatSessionsBulk` GraphQL mutation\n4. Clears localStorage after successful migration\n\n**Issue:** The new streaming chat doesn't create database entries, so this is a one-way migration with no new data being created.\n\n---\n\n## 5. AI Engine Integration Analysis\n\n### 5.1 AI Engine Endpoints\n\n**Streaming Endpoint:** `POST /api/v1/qa/ask-stream`\n\n**Request Format:**\n```json\n{\n  \"question\": \"What are my rights?\",\n  \"mode\": \"LAWYER\",\n  \"session_id\": \"uuid-v4\",\n  \"conversation_history\": [...]  // Optional\n}\n```\n\n**Response (SSE):**\n```\ndata: {\"type\":\"token\",\"content\":\"Based on...\",\"metadata\":{}}\ndata: {\"type\":\"citation\",\"content\":\"\",\"metadata\":{\"source\":\"Labour Code\",...}}\ndata: {\"type\":\"done\",\"content\":\"\",\"metadata\":{\"citations\":[...], \"confidence\":0.87}}\n```\n\n**Status:** ✅ Working correctly\n\n### 5.2 Backend-to-AI Engine Communication\n\n**Current Flow:**\n```\nFrontend → AI Engine (direct SSE stream)\n```\n\n**Missing Flow:**\n```\nAI Engine → Backend (callback/webhook to persist messages)\nFrontend → Backend (GraphQL mutation to persist after stream)\n```\n\n**Problem:** AI Engine has no mechanism to notify the backend when a conversation completes. The frontend receives the stream but doesn't persist it.\n\n---\n\n## 6. Security Issues\n\n### 6.1 Session ID Validation\n\n**Frontend (useStreamingChat.ts:713-716):**\n```typescript\nconst id = sessionId && uuidV4Regex.test(sessionId)\n  ? sessionId\n  : crypto.randomUUID(); // Temporary ID for this request only\n```\n\n**AI Engine (apps/ai-engine/src/auth/jwt.py):**\n```python\nUUID_V4_PATTERN = re.compile(\n    r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',\n    re.IGNORECASE\n)\n```\n\n✅ UUID v4 validation is consistent across frontend and backend.\n\n### 6.2 JWT Authentication\n\n**Status:** ✅ Properly implemented\n\n- Frontend sends JWT in `Authorization: Bearer <token>` header\n- AI Engine validates JWT using shared secret\n- Token type validation (rejects refresh tokens)\n- User context properly extracted\n\n---\n\n## 7. Critical Issues Summary\n\n| Issue | Severity | Impact | Component |\n|-------|----------|--------|-----------|\n| No message persistence | 🔴 CRITICAL | Chat history not saved | Backend mutation |\n| Frontend-generated session IDs | 🟠 HIGH | Architectural inconsistency | Frontend |\n| Dual chat systems | 🟠 HIGH | Confusion, data split | Backend design |\n| No AI Engine callback | 🟡 MEDIUM | Async persistence not possible | AI Engine |\n| Empty database reads | 🟡 MEDIUM | Migration appears broken | Frontend |\n\n---\n\n## 8. Technical Specification for Fixes\n\n### 8.1 Create Chat Message Mutation\n\n**Location:** `apps/backend/src/modules/chat/chat-messages.resolver.ts` (NEW FILE)\n\n```typescript\n@Resolver(() => ChatMessage)\n@UseGuards(GqlAuthGuard)\nexport class ChatMessagesResolver {\n  @Mutation(() => ChatMessage, {\n    name: 'createChatMessage',\n    description: 'Create a new chat message and update session',\n  })\n  async createChatMessage(\n    @Args('input') input: CreateChatMessageInput,\n    @Context() context: { req: { user?: { id?: string } } },\n  ): Promise<ChatMessage> {\n    const userId = context.req?.user?.id;\n    // Validate session ownership\n    // Create or get session\n    // Create message with sequenceOrder\n    // Update session messageCount and lastMessageAt\n    // Trigger title generation if first message\n  }\n}\n```\n\n### 8.2 Backend Session Creation\n\n**Location:** `apps/backend/src/modules/chat/chat-sessions.resolver.ts`\n\n```typescript\n@Mutation(() => ChatSession)\nasync getOrCreateSession(\n  @Args('input') input: GetOrCreateSessionInput,\n): Promise<ChatSession> {\n  // Return existing session if sessionId provided\n  // OR create new session with backend-generated UUID\n}\n```\n\n### 8.3 Frontend Persistence Flow\n\n**Location:** `apps/web/src/hooks/useStreamingChat.ts`\n\n```typescript\nonStreamEnd: async (response) => {\n  // NEW: Persist user message\n  await createChatMessage({\n    sessionId: effectiveSessionId,\n    role: 'USER',\n    content: question,\n  });\n\n  // NEW: Persist assistant message\n  await createChatMessage({\n    sessionId: effectiveSessionId,\n    role: 'ASSISTANT',\n    content: response.content,\n    citations: response.citations,\n    metadata: {\n      confidence: response.confidence,\n      queryType: response.queryType,\n      keyTerms: response.keyTerms,\n    },\n  });\n\n  onStreamEnd?.(response);\n}\n```\n\n### 8.4 Session ID Flow\n\n**Current (Broken):**\n```\nFrontend generates UUID → AI Engine → Lost\n```\n\n**Proposed (Fixed):**\n```\nFrontend calls getOrCreateSession() → Backend generates UUID → Frontend uses backend UUID → AI Engine\n```\n\n---\n\n## 9. Data Flow Diagrams\n\n### 9.1 Current Flow (Broken)\n\n```\n┌─────────────┐         JWT          ┌─────────────┐         SSE          ┌─────────────┐\n│   Frontend  │ ────────────────────▶│  AI Engine  │ ────────────────────▶│   Frontend  │\n│  (Next.js)  │   Authorization:     │  (FastAPI)  │   text/event-stream  │   (SSE)     │\n│             │      Bearer <token>   │             │                     │             │\n└─────────────┘                      └─────────────┘                     └─────────────┘\n       │                                                                         │\n       │  crypto.randomUUID()                                                    │\n       │  (session ID)                                                          │\n       │                                                                         │\n       ▼                                                                         ▼\n┌─────────────┐                                                         ┌─────────────┐\n│   Backend   │◀──────────────── NO PERSISTENCE ─────────────────────────│   Messages  │\n│  (NestJS)   │                                                        │  in State   │\n└─────────────┘                                                        └─────────────┘\n```\n\n### 9.2 Proposed Flow (Fixed)\n\n```\n┌─────────────┐\n│   Frontend  │\n│             │◀─────────────┐\n└─────────────┘              │\n       │                     │\n       │ 1. getOrCreateSession()\n       ▼                     │\n┌─────────────┐              │\n│   Backend   │───────────────┘\n│  Generates  │── returns sessionId\n└─────────────┘\n       │\n       │ 2. Streaming request with backend sessionId\n       ▼\n┌─────────────┐         SSE          ┌─────────────┐\n│  AI Engine  │ ────────────────────▶│   Frontend  │\n│  (FastAPI)  │   text/event-stream  │  (display)  │\n└─────────────┘                     └─────────────┘\n                                             │\n                                             │ 3. onStreamEnd: createChatMessage()\n                                             ▼\n                                      ┌─────────────┐\n                                      │   Backend   │\n                                      │ (persists)  │\n                                      └─────────────┘\n```\n\n---\n\n## 10. Recommended Action Plan\n\n### Phase 1: Backend Message Persistence (CRITICAL)\n1. Create `CreateChatMessageInput` DTO\n2. Create `ChatMessagesResolver` with `createChatMessage` mutation\n3. Implement session ownership validation\n4. Add auto-title generation trigger\n\n### Phase 2: Backend Session Management\n1. Create `getOrCreateChatSession` mutation\n2. Backend generates all session IDs (not frontend)\n3. Return session with first message creation\n\n### Phase 3: Frontend Integration\n1. Call `getOrCreateChatSession` on chat start\n2. Persist messages on `onStreamEnd` callback\n3. Remove frontend `crypto.randomUUID()` calls\n4. Update session restoration flow\n\n### Phase 4: Testing & Cleanup\n1. E2E tests for full message persistence flow\n2. Verify migration still works\n3. Clean up warning comments once fixed\n4. Update documentation\n\n---\n\n## 11. Files Requiring Changes\n\n| File | Changes | Priority |\n|------|---------|----------|\n| `apps/backend/src/modules/chat/dto/chat-session.dto.ts` | Add `CreateChatMessageInput` | 🔴 CRITICAL |\n| `apps/backend/src/modules/chat/chat-messages.resolver.ts` | CREATE NEW FILE | 🔴 CRITICAL |\n| `apps/backend/src/modules/chat/chat-sessions.resolver.ts` | Add `getOrCreateSession` | 🟠 HIGH |\n| `apps/web/src/hooks/useStreamingChat.ts` | Add persistence on stream end | 🔴 CRITICAL |\n| `apps/web/src/components/chat/chat-interface.tsx` | Use backend session creation | 🟠 HIGH |\n| `apps/backend/src/modules/chat/chat.module.ts` | Register new resolver | 🔴 CRITICAL |\n\n---\n\n## 12. Conclusion\n\nThe chat history infrastructure has a **solid foundation** with well-designed entities and GraphQL resolvers. However, the **message persistence flow is completely missing**. The current implementation streams responses from AI Engine directly to the frontend state without ever saving to the database.\n\n**Key Takeaway:** This is not a bug in existing code, but rather **missing functionality** that needs to be implemented. The architecture was designed for database persistence, but the actual persistence mechanism was never built.\n\n**Estimated Effort:** 2-3 days of development + 1 day of testing\n\n---\n\n**End of Audit Report**\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Analyzing chat architecture issues",
      "content": "Analyze chat architecture issues",
      "status": "completed"
    },
    {
      "activeForm": "Documenting findings and technical specification",
      "content": "Document findings and technical specification",
      "status": "completed"
    },
    {
      "activeForm": "Creating comprehensive audit report",
      "content": "Create comprehensive audit report",
      "status": "completed"
    }
  ]
}
