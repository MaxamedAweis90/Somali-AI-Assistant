"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAIModelOption, type AIProvider } from "@/lib/ai/model-catalog";
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
import { useChatUIStore } from "@/stores/chat-ui-store";
import type { ChatConversation, ChatMessage } from "@/types/chat";

const seedConversations: ChatConversation[] = [];
const seedMessages: ChatMessage[] = [];

const quickPrompts = [
  "Iga caawi CV Somali ah",
  "Ii qor qorshe waxbarasho 30 maalmood",
  "Sharax React si fudud oo Somali ah",
  "Ii diyaari email shaqo oo xirfad leh",
];

export function useChatUI(userId?: string, preferredConversationId?: string) {
  const isAuthenticated = Boolean(userId);
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [conversations, setConversations] = useState<ChatConversation[]>(seedConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>(preferredConversationId ?? "");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isHydratingConversations, setIsHydratingConversations] = useState(false);
  const [isHydratingMessages, setIsHydratingMessages] = useState(false);
  const selectedModelId = useChatUIStore((state) => state.selectedModelId);
  const webSearchEnabled = useChatUIStore((state) => state.webSearchEnabled);
  const [responseSource, setResponseSource] = useState<AIProvider | null>(null);
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

  const sendMessage = useCallback(async (customText?: string | React.MouseEvent | React.KeyboardEvent, truncateHistoryId?: string) => {
    const actualText = typeof customText === 'string' ? customText : input;
    const text = actualText.trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    let baseHistory = messages;
    if (typeof truncateHistoryId === 'string') {
      const idx = messages.findIndex(m => m.id === truncateHistoryId);
      if (idx !== -1) {
         baseHistory = messages.slice(0, Math.max(0, idx));
      }
    }

    const historyForRequest = [...baseHistory, userMessage];
    setMessages(historyForRequest);
    
    if (typeof customText !== 'string') {
      setInput("");
    }
    setIsTyping(true);
    const streamId = activeStreamRef.current + 1;
    activeStreamRef.current = streamId;
    const streamingMessageId = crypto.randomUUID();
    const selectedModel = getAIModelOption(selectedModelId);
      const willSearchWeb = webSearchEnabled;
    setStreamingMessage({
      id: streamingMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      isStreaming: true,
      searchingWeb: willSearchWeb,
    });

    let persistedConversationId = activeConversationId;


    if (persistedConversationId) {
      messageCacheRef.current[persistedConversationId] = historyForRequest;
    }

    const summaryForRequest = buildConversationSummary(historyForRequest);
    const recentMessages = selectRecentMessages(historyForRequest);

    try {
      const responsePromise = sendChatMessage({
        messages: recentMessages,
        summary: summaryForRequest || undefined,
        modelId: selectedModelId,
        useWebSearch: webSearchEnabled,
      }, {
        onMeta: (meta) => {
          if (activeStreamRef.current !== streamId) {
            return;
          }

          setResponseSource(meta.provider);
          setResponseModel(meta.model);
        },
        onChunk: (chunk) => {
          if (activeStreamRef.current !== streamId || !chunk) {
            return;
          }

          setStreamingMessage((current) => {
            if (!current || current.id !== streamingMessageId) {
              return current;
            }

            return {
              ...current,
              content: `${current.content}${chunk}`,
              isStreaming: true,
            };
          });
        },
      });

      let persistenceConversationIdPromise = Promise.resolve<string | undefined>(persistedConversationId || undefined);

      if (isAuthenticated) {
        if (!persistedConversationId) {
          persistenceConversationIdPromise = createStoredConversation(text)
            .then(async (storedConversation) => {
              persistedConversationId = storedConversation.id;
              messageCacheRef.current[storedConversation.id] = historyForRequest;
              upsertConversationLocally(storedConversation);
              setActiveConversationId(storedConversation.id);
              await createStoredMessage(storedConversation.id, "user", userMessage.content);
              return storedConversation.id;
            })
            .catch((error) => {
              console.error("Conversation creation failed:", error);
              return undefined;
            });
        } else {
          persistenceConversationIdPromise = createStoredMessage(persistedConversationId, "user", userMessage.content)
            .then(() => persistedConversationId)
            .catch((error) => {
              console.error("User message persistence failed:", error);
              return persistedConversationId;
            });
        }
      }

      const response = await responsePromise;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.message,
        createdAt: new Date().toISOString(),
        grounded: response.grounded,
        responseTemplate: response.responseTemplate,
        sources: response.sources,
      };

      if (activeStreamRef.current !== streamId) {
        return;
      }

      setResponseSource(response.provider);
      setResponseModel(response.model);
      setProviderError(null);
      setStreamingMessage(null);

      const historyAfterReply = [...historyForRequest, assistantMessage];

      setMessages(historyAfterReply);

      if (persistedConversationId) {
        messageCacheRef.current[persistedConversationId] = historyAfterReply;
      }

      if (isAuthenticated) {
        void persistenceConversationIdPromise.then((savedConversationId) => {
          if (!savedConversationId) {
            return;
          }

          messageCacheRef.current[savedConversationId] = historyAfterReply;

          void createStoredMessage(savedConversationId, "assistant", assistantMessage.content, {
            grounded: assistantMessage.grounded,
            sources: assistantMessage.sources,
          }).catch(() => undefined);
          void touchStoredConversation(savedConversationId, {
            latestUserText: text,
            summary: buildConversationSummary(historyAfterReply),
            messageCount: historyAfterReply.length,
          })
            .then((updatedConversation) => {
              upsertConversationLocally(updatedConversation);
            })
            .catch(() => undefined);

          if (response.model && response.usage) {
            void createAiUsageLog({
              conversationId: savedConversationId,
              provider: response.provider,
              model: response.model,
              inputTokens: response.usage.inputTokens,
              outputTokens: response.usage.outputTokens,
              estimatedCost: estimateUsageCost(response.model, response.usage.inputTokens, response.usage.outputTokens),
            }).catch(() => undefined);
          }
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wax yar ayaa khaldamay. Fadlan isku day mar kale.";
      const assistantErrorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `### Cilad\n\n${errorMessage}`,
        createdAt: new Date().toISOString(),
      };

      const failedHistory = [...historyForRequest, assistantErrorMessage];

      if (persistedConversationId) {
        messageCacheRef.current[persistedConversationId] = failedHistory;
      }

      setMessages(failedHistory);
      setStreamingMessage(null);
      setResponseSource(null);
      setResponseModel(null);
      setProviderError(errorMessage);

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
  }, [activeConversationId, input, isAuthenticated, isTyping, messages, selectedModelId, upsertConversationLocally, webSearchEnabled]);

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
