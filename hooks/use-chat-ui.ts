"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createAiUsageLog,
  createStoredConversation,
  createStoredMessage,
  deleteStoredConversation,
  listStoredConversations,
  listStoredMessages,
  renameStoredConversation,
  touchStoredConversation,
} from "@/services/appwrite-chat-service";
import { buildConversationSummary, estimateUsageCost, selectRecentMessages } from "@/lib/ai/usage-optimization";
import { sendChatMessage } from "@/services/chat-service";
import type { ChatConversation, ChatMessage } from "@/types/chat";

const seedConversations: ChatConversation[] = [];
const seedMessages: ChatMessage[] = [];

const quickPrompts = [
  "Iga caawi CV Somali ah",
  "Ii qor qorshe waxbarasho 30 maalmood",
  "Sharax React si fudud oo Somali ah",
  "Ii diyaari email shaqo oo xirfad leh",
];

const STREAMING_STEP_DELAY_MS = 14;
const STREAMING_TARGET_STEPS = 10;

function buildStreamingChunks(text: string) {
  const pieces = text.match(/\S+\s*/g) ?? [text];
  const chunkSize = Math.max(1, Math.ceil(pieces.length / STREAMING_TARGET_STEPS));
  const chunks: string[] = [];

  for (let index = 0; index < pieces.length; index += chunkSize) {
    chunks.push(pieces.slice(index, index + chunkSize).join(""));
  }

  return chunks;
}

export function useChatUI(userId?: string, preferredConversationId?: string) {
  const isAuthenticated = Boolean(userId);
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [conversations, setConversations] = useState<ChatConversation[]>(seedConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>(preferredConversationId ?? "");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isHydratingConversations, setIsHydratingConversations] = useState(false);
  const [isHydratingMessages, setIsHydratingMessages] = useState(false);
  const [responseSource, setResponseSource] = useState<"gemini" | "openai" | "fallback">("fallback");
  const [responseModel, setResponseModel] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const activeStreamRef = useRef(0);
  const previousPreferredConversationIdRef = useRef<string | undefined>(preferredConversationId);
  const messageCacheRef = useRef<Record<string, ChatMessage[]>>({});
  const isHydrating = isHydratingConversations || isHydratingMessages;

  useEffect(() => {
    return () => {
      activeStreamRef.current += 1;
    };
  }, []);

  useEffect(() => {
    messageCacheRef.current = {};
    previousPreferredConversationIdRef.current = preferredConversationId;
  }, [userId]);

  const resetConversationState = useCallback(() => {
    activeStreamRef.current += 1;
    setStreamingMessage(null);
    setIsHydratingMessages(false);
    setActiveConversationId("");
    setMessages(seedMessages);
    setInput("");
    setIsTyping(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      setIsHydratingConversations(false);
      setIsHydratingMessages(false);
      return () => {
        isMounted = false;
      };
    }

    setIsHydratingConversations(true);

    void listStoredConversations()
      .then((storedConversations) => {
        if (!isMounted) {
          return;
        }

        setConversations(storedConversations);
        setActiveConversationId((current) => {
          if (current && storedConversations.some((conversation) => conversation.id === current)) {
            return current;
          }

          return "";
        });

        if (storedConversations.length === 0) {
          setIsHydratingMessages(false);
          setMessages(seedMessages);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsHydratingConversations(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const previousPreferredConversationId = previousPreferredConversationIdRef.current;
    previousPreferredConversationIdRef.current = preferredConversationId;

    if (!preferredConversationId) {
      if (previousPreferredConversationId) {
        resetConversationState();
      }

      return;
    }

    setActiveConversationId((current) => (current === preferredConversationId ? current : preferredConversationId));

    const cachedMessages = messageCacheRef.current[preferredConversationId];

    if (cachedMessages && cachedMessages.length > 0) {
      setMessages(cachedMessages);
      setIsHydratingMessages(false);
    }
  }, [isAuthenticated, preferredConversationId, resetConversationState]);

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      setIsHydratingMessages(false);
      return () => {
        isMounted = false;
      };
    }

    if (!activeConversationId) {
      setIsHydratingMessages(false);
      return () => {
        isMounted = false;
      };
    }

    const cachedMessages = messageCacheRef.current[activeConversationId];

    if (cachedMessages && cachedMessages.length > 0) {
      setMessages(cachedMessages);
      setIsHydratingMessages(false);
      return () => {
        isMounted = false;
      };
    }

    setIsHydratingMessages(true);

    void listStoredMessages(activeConversationId)
      .then((storedMessages) => {
        if (isMounted) {
          messageCacheRef.current[activeConversationId] = storedMessages;
          setMessages(storedMessages);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsHydratingMessages(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, isAuthenticated]);

  const upsertConversationLocally = useCallback((conversation: ChatConversation) => {
    setConversations((current) => {
      const rest = current.filter((item) => item.id !== conversation.id);
      return [conversation, ...rest];
    });
  }, []);

  const streamAssistantMessage = useCallback(async (message: ChatMessage) => {
    const streamId = activeStreamRef.current + 1;
    activeStreamRef.current = streamId;
    const chunks = buildStreamingChunks(message.content);

    setStreamingMessage({
      ...message,
      content: "",
      isStreaming: true,
    });

    let partialContent = "";

    for (const chunk of chunks) {
      if (activeStreamRef.current !== streamId) {
        return false;
      }

      partialContent += chunk;
      setStreamingMessage({
        ...message,
        content: partialContent,
        isStreaming: true,
      });

      await new Promise((resolve) => window.setTimeout(resolve, STREAMING_STEP_DELAY_MS));
    }

    if (activeStreamRef.current !== streamId) {
      return false;
    }

    setStreamingMessage(null);
    return true;
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    let persistedConversationId = activeConversationId;
    const historyForRequest = [...messages, userMessage];

    if (persistedConversationId) {
      messageCacheRef.current[persistedConversationId] = historyForRequest;
    }

    const summaryForRequest = buildConversationSummary(historyForRequest);
    const recentMessages = selectRecentMessages(historyForRequest);

    try {
      if (isAuthenticated) {
        if (!persistedConversationId) {
          const storedConversation = await createStoredConversation(text);
          persistedConversationId = storedConversation.id;
          await createStoredMessage(persistedConversationId, "user", userMessage.content);
          messageCacheRef.current[persistedConversationId] = historyForRequest;
          upsertConversationLocally(storedConversation);
          setActiveConversationId(storedConversation.id);
        } else {
          await createStoredMessage(persistedConversationId, "user", userMessage.content);
        }
      }

      const response = await sendChatMessage({
        messages: recentMessages,
        summary: summaryForRequest || undefined,
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message,
        createdAt: new Date().toISOString(),
      };
      setResponseSource(response.provider);
      setResponseModel(response.model);
      setProviderError(response.providerError ?? null);

      const streamCompleted = await streamAssistantMessage(assistantMessage);

      if (!streamCompleted) {
        return;
      }

      const historyAfterReply = [...historyForRequest, assistantMessage];

      if (persistedConversationId) {
        messageCacheRef.current[persistedConversationId] = historyAfterReply;
      }

      setMessages(historyAfterReply);

      if (isAuthenticated && persistedConversationId) {
        await createStoredMessage(persistedConversationId, "assistant", assistantMessage.content);
        const updatedConversation = await touchStoredConversation(persistedConversationId, {
          latestUserText: text,
          summary: buildConversationSummary(historyAfterReply),
          messageCount: historyAfterReply.length,
        });
        upsertConversationLocally(updatedConversation);

        if (response.provider !== "fallback" && response.model && response.usage) {
          await createAiUsageLog({
            conversationId: persistedConversationId,
            provider: response.provider,
            model: response.model,
            inputTokens: response.usage.inputTokens,
            outputTokens: response.usage.outputTokens,
            estimatedCost: estimateUsageCost(response.model, response.usage.inputTokens, response.usage.outputTokens),
          }).catch(() => undefined);
        }
      }
    } catch {
      const assistantErrorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "### Cilad\n\nWaan ku fahmay, laakiin hadda waxaa jira cilad farsamo oo ku timid adeegga jawaabta. Fadlan mar kale isku day.",
        createdAt: new Date().toISOString(),
      };

      const failedHistory = [...historyForRequest, assistantErrorMessage];

      if (persistedConversationId) {
        messageCacheRef.current[persistedConversationId] = failedHistory;
      }

      setMessages(failedHistory);
      setStreamingMessage(null);
      setResponseSource("fallback");
      setResponseModel(null);
      setProviderError("Wax yar ayaa khaldamay. Fadlan isku day mar kale.");

      if (isAuthenticated && persistedConversationId) {
        await createStoredMessage(persistedConversationId, "assistant", assistantErrorMessage.content).catch(() => undefined);
        const updatedConversation = await touchStoredConversation(persistedConversationId, {
          latestUserText: text,
          summary: buildConversationSummary(failedHistory),
          messageCount: failedHistory.length,
        }).catch(() => null);

        if (updatedConversation) {
          upsertConversationLocally(updatedConversation);
        }
      }
    } finally {
      setIsTyping(false);
    }
  }, [activeConversationId, input, isAuthenticated, isTyping, messages, upsertConversationLocally]);

  const startNewChat = useCallback(() => {
    resetConversationState();
  }, [resetConversationState]);

  const renameConversation = useCallback(
    async (conversationId: string, title: string) => {
      if (!isAuthenticated) {
        return;
      }

      const normalizedTitle = title.trim();

      if (!normalizedTitle) {
        return;
      }

      const previousConversation = conversations.find((conversation) => conversation.id === conversationId);

      if (!previousConversation || previousConversation.title === normalizedTitle) {
        return;
      }

      upsertConversationLocally({
        ...previousConversation,
        title: normalizedTitle,
      });

      try {
        const updatedConversation = await renameStoredConversation(conversationId, normalizedTitle);
        upsertConversationLocally(updatedConversation);
      } catch (error) {
        upsertConversationLocally(previousConversation);
        throw error;
      }
    },
    [conversations, isAuthenticated, upsertConversationLocally]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated) {
        return;
      }

      const previousConversations = conversations;
      const previousMessages = messages;
      const previousInput = input;
      const wasActiveConversation = activeConversationId === conversationId;
      const previousCachedMessages = messageCacheRef.current[conversationId];

      setConversations((current) => current.filter((conversation) => conversation.id !== conversationId));
      delete messageCacheRef.current[conversationId];

      if (wasActiveConversation) {
        setActiveConversationId("");
        setMessages(seedMessages);
        setInput("");
      }

      try {
        await deleteStoredConversation(conversationId);
      } catch (error) {
        setConversations(previousConversations);

        if (previousCachedMessages) {
          messageCacheRef.current[conversationId] = previousCachedMessages;
        }

        if (wasActiveConversation) {
          setActiveConversationId(conversationId);
          setMessages(previousMessages);
          setInput(previousInput);
        }

        throw error;
      }
    },
    [activeConversationId, conversations, input, isAuthenticated, messages]
  );

  const stats = useMemo(
    () => ({
      totalMessages: messages.length,
      totalConversations: conversations.length,
      activeConversationId,
    }),
    [messages.length, conversations.length, activeConversationId]
  );

  return {
    messages,
    input,
    isTyping,
    isHydrating,
    isHydratingConversations,
    isHydratingMessages,
    responseSource,
    responseModel,
    providerError,
    streamingMessage,
    quickPrompts,
    conversations,
    stats,
    setInput,
    sendMessage,
    startNewChat,
    renameConversation,
    deleteConversation,
    setActiveConversationId,
  };
}
