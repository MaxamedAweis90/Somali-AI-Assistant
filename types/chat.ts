export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  tokenEstimate?: number;
  isStreaming?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  updatedAt: string;
  summary?: string;
  messageCount?: number;
}
