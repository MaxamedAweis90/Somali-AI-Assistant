import type { ChatMessage } from "@/types/chat";

export const AI_RECENT_MESSAGE_LIMIT = 5;
export const AI_SUMMARY_TRIGGER_COUNT = 12;
export const AI_DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
export const AI_DEFAULT_OPENAI_MODEL = "gpt-4o";
export const AI_DEFAULT_TEMPERATURE = 0.4;
export const AI_DEFAULT_MAX_TOKENS = 900;

export function cleanMessageContent(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function estimateTokenCount(text: string) {
  const normalized = cleanMessageContent(text);
  return Math.max(1, Math.ceil(normalized.length / 4));
}

export function cleanMessages(messages: ChatMessage[]) {
  return messages
    .map((message) => ({
      ...message,
      content: cleanMessageContent(message.content),
    }))
    .filter((message) => message.content.length > 0);
}

function summarizeMessage(message: ChatMessage) {
  const label = message.role === "user" ? "User" : "Assistant";
  const content = cleanMessageContent(message.content);
  const shortened = content.length <= 160 ? content : `${content.slice(0, 160).trim()}...`;
  return `- ${label}: ${shortened}`;
}

export function buildConversationSummary(messages: ChatMessage[]) {
  const cleaned = cleanMessages(messages);

  if (cleaned.length <= AI_SUMMARY_TRIGGER_COUNT) {
    return "";
  }

  const olderMessages = cleaned.slice(0, Math.max(0, cleaned.length - AI_RECENT_MESSAGE_LIMIT));

  if (olderMessages.length === 0) {
    return "";
  }

  return [
    "Soo koobid wada sheekaysiga hore:",
    ...olderMessages.slice(-8).map(summarizeMessage),
    "- Ka jawaab Somali cad oo toos ah, adigoo sii wata macnaha wada sheekaysiga.",
  ].join("\n");
}

export function selectRecentMessages(messages: ChatMessage[]) {
  return cleanMessages(messages).slice(-AI_RECENT_MESSAGE_LIMIT);
}

export function estimateUsageCost(model: string, inputTokens: number, outputTokens: number) {
  const normalizedModel = model.toLowerCase();

  if (normalizedModel.includes("gemini")) {
    return Number((((inputTokens / 1_000_000) * 0.075) + ((outputTokens / 1_000_000) * 0.3)).toFixed(6));
  }

  if (normalizedModel.includes("gpt-4o-mini")) {
    return Number((((inputTokens / 1_000_000) * 0.15) + ((outputTokens / 1_000_000) * 0.6)).toFixed(6));
  }

  if (normalizedModel.includes("gpt-4o")) {
    return Number((((inputTokens / 1_000_000) * 5) + ((outputTokens / 1_000_000) * 15)).toFixed(6));
  }

  return Number((((inputTokens + outputTokens) / 1_000_000) * 1).toFixed(6));
}