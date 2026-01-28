'use client';

import { ChatInterface } from '@/components/chat/chat-interface';

/**
 * Chat Page
 *
 * Main chat interface for AI legal assistant.
 * Supports session restoration via ?session= URL parameter.
 */
export default function ChatPage() {
  return (
    <div className="container mx-auto h-[calc(100vh-8rem)] py-6 px-4">
      <ChatInterface />
    </div>
  );
}
