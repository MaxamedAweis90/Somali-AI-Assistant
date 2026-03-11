import type { ChatMessage } from "@/types/chat";
import type { AIModelId, AIProvider } from "@/lib/ai/model-catalog";

interface ChatRequestPayload {
  messages: ChatMessage[];
  summary?: string;
  modelId?: AIModelId;
  useWebSearch?: boolean;
}

interface ChatApiResponse {
  message: string;
  provider: AIProvider;
  model: string | null;
  grounded?: boolean;
  responseTemplate?: ChatMessage["responseTemplate"];
  sources?: ChatMessage["sources"];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  } | null;
}

interface ChatStreamCallbacks {
  onMeta?: (meta: Pick<ChatApiResponse, "provider" | "model">) => void;
  onChunk?: (chunk: string) => void;
}

type ChatStreamEvent =
  | { type: "meta"; provider: AIProvider; model: string | null }
  | { type: "delta"; text: string }
  | ({ type: "done" } & ChatApiResponse)
  | { type: "error"; error: string };

export async function sendChatMessage(payload: ChatRequestPayload, callbacks?: ChatStreamCallbacks) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error || "Chat API request failed.");
  }

  if (!response.body) {
    throw new Error("Chat stream lama helin.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResponse: ChatApiResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      const event = JSON.parse(trimmed) as ChatStreamEvent;

      if (event.type === "meta") {
        callbacks?.onMeta?.({ provider: event.provider, model: event.model });
        continue;
      }

      if (event.type === "delta") {
        callbacks?.onChunk?.(event.text);
        continue;
      }

      if (event.type === "error") {
        throw new Error(event.error || "Chat stream failed.");
      }

      if (event.type === "done") {
        finalResponse = {
          message: event.message,
          provider: event.provider,
          model: event.model,
          grounded: event.grounded,
          responseTemplate: event.responseTemplate,
          sources: event.sources,
          usage: event.usage,
        };
      }
    }
  }

  if (!finalResponse) {
    throw new Error("Chat response-ka dhammaadkiisa lama helin.");
  }

  return finalResponse;
}