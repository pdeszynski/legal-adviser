I'll start by exploring the codebase to understand the current chat history handling and how the AI Engine receives messages.

🔧 Tool: Task
Input: {
  "subagent_type": "Explore",
  "prompt": "Explore the chat history handling in this codebase. I need to understand:\n\n1. How chat messages are stored in the database (backend)\n2. How chat history is sent to the AI Engine when continuing a conversation\n3. The frontend hooks that manage chat sessions (use-chat.ts, use-streaming-chat.ts, etc.)\n4. The AI Engine endpoints that receive chat history\n\nFocus on finding:\n- Where chat history is fetched from the database\n- How it's passed to the AI Engine API\n- The request/response models for AI Engine chat endpoints\n- Any existing session management code\n\nSearch in apps/backend, apps/web, and apps/ai-engine directories.",
  "description": "Explore chat history handling"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/chat/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/hooks/use-chat*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/use-streaming-chat.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/ai-engine/src/main.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/entities/chat-message.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/entities/chat-session.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/chat/services/chat-messages.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/requests.py"
}
