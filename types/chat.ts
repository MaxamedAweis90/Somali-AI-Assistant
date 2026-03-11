export type ChatRole = "user" | "assistant";

export interface ChatSource {
  title: string;
  url: string;
  domain: string;
}

export interface ChatImageQuota {
  dateKey: string;
  used: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  tokenEstimate?: number;
  isStreaming?: boolean;
  grounded?: boolean;
  searchingWeb?: boolean;
  responseTemplate?: "history" | "comparison" | "how-to" | "biography" | "analysis" | "general";
  sources?: ChatSource[];
}

export interface ChatConversation {
  id: string;
  title: string;
  updatedAt: string;
  summary?: string;
  messageCount?: number;
}
