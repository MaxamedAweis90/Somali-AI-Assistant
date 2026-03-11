import type { ChatMessage } from "@/types/chat";

interface ChatRequestPayload {
  messages: ChatMessage[];
  summary?: string;
}

interface ChatApiResponse {
  message: string;
  mode: "provider" | "fallback";
  provider: "gemini" | "openai" | "fallback";
  model: string | null;
  providerError?: string | null;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  } | null;
}

export async function sendChatMessage(payload: ChatRequestPayload) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Chat API request failed.");
  }

  return (await response.json()) as ChatApiResponse;
}