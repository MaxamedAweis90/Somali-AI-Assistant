"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getAIModelOption, type AIProvider } from "@/lib/ai/model-catalog";
import {
  buildConversationSummary,
  estimateUsageCost,
  selectRecentMessages,
} from "@/lib/ai/usage-optimization";
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

function setConversationMessagesCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  conversationId: string,
  messages: ChatMessage[]
) {
  queryClient.setQueryData<ChatMessage[]>(
    ["chat", "messages", userId, conversationId],
    messages
  );
}

function upsertConversationCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  conversation: ChatConversation
) {
  queryClient.setQueryData<ChatConversation[]>(
    ["chat", "conversations", userId],
    (current = seedConversations) => {
      const rest = current.filter((item) => item.id !== conversation.id);
      return [conversation, ...rest];
    }
  );
}

export function useChatUI(userId?: string, preferredConversationId?: string) {
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(userId);

  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [activeConversationId, setActiveConversationId] = useState<string>(
    preferredConversationId ?? ""
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const selectedModelId = useChatUIStore((state) => state.selectedModelId);
  const webSearchEnabled = useChatUIStore((state) => state.webSearchEnabled);

  const [responseSource, setResponseSource] = useState<AIProvider | null>(null);
  const [responseModel, setResponseModel] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(
    null
  );

  const activeStreamRef = useRef(0);
  const previousPreferredConversationIdRef = useRef<string | undefined>(
    preferredConversationId
  );

  useEffect(() => {
    return () => {
      activeStreamRef.current += 1;
    };
  }, []);

  useEffect(() => {
    previousPreferredConversationIdRef.current = preferredConversationId;
  }, [userId, preferredConversationId]);

  const resetConversationState = useCallback(() => {
    activeStreamRef.current += 1;
    setStreamingMessage(null);
    setActiveConversationId("");
    setMessages(seedMessages);
    setInput("");
    setIsTyping(false);
    setProviderError(null);
    setResponseSource(null);
    setResponseModel(null);
  }, []);

  const conversationsQuery = useQuery<ChatConversation[]>({
    queryKey: ["chat", "conversations", userId],
    queryFn: listStoredConversations,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const isHydratingConversations = isAuthenticated
    ? conversationsQuery.isFetching
    : false;

  const conversations = isAuthenticated
    ? (conversationsQuery.data ?? seedConversations)
    : seedConversations;

  // Keep active conversation valid when conversations list changes.
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    setActiveConversationId((current) => {
      if (current && conversations.some((conversation) => conversation.id === current)) {
        return current;
      }

      return "";
    });

    if (conversations.length === 0) {
      setMessages(seedMessages);
    }
  }, [conversations, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const previousPreferredConversationId =
      previousPreferredConversationIdRef.current;
    previousPreferredConversationIdRef.current = preferredConversationId;

    if (!preferredConversationId) {
      if (previousPreferredConversationId) {
        resetConversationState();
      }
      return;
    }

    setActiveConversationId((current) =>
      current === preferredConversationId ? current : preferredConversationId
    );

    const cachedMessages = queryClient.getQueryData<ChatMessage[]>([
      "chat",
      "messages",
      userId,
      preferredConversationId,
    ]);

    if (cachedMessages && cachedMessages.length > 0) {
      setMessages(cachedMessages);
    }
  }, [
    isAuthenticated,
    preferredConversationId,
    queryClient,
    resetConversationState,
    userId,
  ]);

  const messagesQuery = useQuery<ChatMessage[]>({
    queryKey: ["chat", "messages", userId, activeConversationId],
    queryFn: () => listStoredMessages(activeConversationId),
    enabled: isAuthenticated && Boolean(activeConversationId),
    staleTime: 2 * 60_000,
  });

  const isHydratingMessages =
    isAuthenticated && Boolean(activeConversationId)
      ? messagesQuery.isFetching
      : false;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!activeConversationId) {
      return;
    }

    if (isTyping || streamingMessage) {
      return;
    }

    const storedMessages = messagesQuery.data;
    if (storedMessages) {
      setConversationMessagesCache(
        queryClient,
        userId,
        activeConversationId,
        storedMessages
      );
      setMessages(storedMessages);
    }
  }, [
    activeConversationId,
    isAuthenticated,
    isTyping,
    messagesQuery.data,
    queryClient,
    streamingMessage,
    userId,
  ]);

  const isHydrating = isHydratingConversations || isHydratingMessages;

  const upsertConversationLocally = useCallback(
    (conversation: ChatConversation) => {
      upsertConversationCache(queryClient, userId, conversation);
    },
    [queryClient, userId]
  );

  const sendMessage = useCallback(
    async (
      customText?: string | React.MouseEvent | React.KeyboardEvent,
      truncateHistoryId?: string
    ) => {
      const actualText = typeof customText === "string" ? customText : input;
      const text = actualText.trim();
      if (!text || isTyping) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };

      let baseHistory = messages;
      if (typeof truncateHistoryId === "string") {
        const idx = messages.findIndex((m) => m.id === truncateHistoryId);
        if (idx !== -1) {
          baseHistory = messages.slice(0, Math.max(0, idx));
        }
      }

      const historyForRequest = [...baseHistory, userMessage];
      setMessages(historyForRequest);

      if (typeof customText !== "string") {
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
        setConversationMessagesCache(
          queryClient,
          userId,
          persistedConversationId,
          historyForRequest
        );
      }

      const summaryForRequest = buildConversationSummary(historyForRequest);
      const recentMessages = selectRecentMessages(historyForRequest);

      try {
        const responsePromise = sendChatMessage(
          {
            messages: recentMessages,
            summary: summaryForRequest || undefined,
            modelId: selectedModel?.id ?? selectedModelId,
            useWebSearch: webSearchEnabled,
          },
          {
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
          }
        );

        let persistenceConversationIdPromise = Promise.resolve<
          string | undefined
        >(persistedConversationId || undefined);

        if (isAuthenticated) {
          if (!persistedConversationId) {
            persistenceConversationIdPromise = createStoredConversation(text)
              .then(async (storedConversation) => {
                persistedConversationId = storedConversation.id;

                setConversationMessagesCache(
                  queryClient,
                  userId,
                  storedConversation.id,
                  historyForRequest
                );
                upsertConversationLocally(storedConversation);
                setActiveConversationId(storedConversation.id);
                await createStoredMessage(
                  storedConversation.id,
                  "user",
                  userMessage.content
                );
                return storedConversation.id;
              })
              .catch((error) => {
                console.error("Conversation creation failed:", error);
                return undefined;
              });
          } else {
            persistenceConversationIdPromise = createStoredMessage(
              persistedConversationId,
              "user",
              userMessage.content
            )
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
          setConversationMessagesCache(
            queryClient,
            userId,
            persistedConversationId,
            historyAfterReply
          );
        }

        if (isAuthenticated) {
          void persistenceConversationIdPromise.then((savedConversationId) => {
            if (!savedConversationId) {
              return;
            }

            setConversationMessagesCache(
              queryClient,
              userId,
              savedConversationId,
              historyAfterReply
            );

            void createStoredMessage(
              savedConversationId,
              "assistant",
              assistantMessage.content,
              {
                grounded: assistantMessage.grounded,
                sources: assistantMessage.sources,
              }
            ).catch(() => undefined);

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
                estimatedCost: estimateUsageCost(
                  response.model,
                  response.usage.inputTokens,
                  response.usage.outputTokens
                ),
              }).catch(() => undefined);
            }
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Wax yar ayaa khaldamay. Fadlan isku day mar kale.";

        const assistantErrorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `### Cilad\n\n${errorMessage}`,
          createdAt: new Date().toISOString(),
        };

        const failedHistory = [...historyForRequest, assistantErrorMessage];

        if (persistedConversationId) {
          setConversationMessagesCache(
            queryClient,
            userId,
            persistedConversationId,
            failedHistory
          );
        }

        setMessages(failedHistory);
        setStreamingMessage(null);
        setResponseSource(null);
        setResponseModel(null);
        setProviderError(errorMessage);

        if (isAuthenticated && persistedConversationId) {
          await createStoredMessage(
            persistedConversationId,
            "assistant",
            assistantErrorMessage.content
          ).catch(() => undefined);

          const updatedConversation = await touchStoredConversation(
            persistedConversationId,
            {
              latestUserText: text,
              summary: buildConversationSummary(failedHistory),
              messageCount: failedHistory.length,
            }
          ).catch(() => null);

          if (updatedConversation) {
            upsertConversationLocally(updatedConversation);
          }
        }
      } finally {
        setIsTyping(false);
      }
    },
    [
      activeConversationId,
      input,
      isAuthenticated,
      isTyping,
      messages,
      queryClient,
      selectedModelId,
      upsertConversationLocally,
      userId,
      webSearchEnabled,
    ]
  );

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

      const previousConversation = conversations.find(
        (conversation) => conversation.id === conversationId
      );

      if (!previousConversation || previousConversation.title === normalizedTitle) {
        return;
      }

      upsertConversationLocally({
        ...previousConversation,
        title: normalizedTitle,
      });

      try {
        const updatedConversation = await renameStoredConversation(
          conversationId,
          normalizedTitle
        );
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
      const previousCachedMessages = queryClient.getQueryData<ChatMessage[]>([
        "chat",
        "messages",
        userId,
        conversationId,
      ]);

      queryClient.setQueryData<ChatConversation[]>(
        ["chat", "conversations", userId],
        (current = seedConversations) =>
          current.filter((conversation) => conversation.id !== conversationId)
      );

      queryClient.removeQueries({
        queryKey: ["chat", "messages", userId, conversationId],
      });

      if (wasActiveConversation) {
        setActiveConversationId("");
        setMessages(seedMessages);
        setInput("");
      }

      try {
        await deleteStoredConversation(conversationId);
      } catch (error) {
        queryClient.setQueryData(
          ["chat", "conversations", userId],
          previousConversations
        );

        if (previousCachedMessages) {
          setConversationMessagesCache(
            queryClient,
            userId,
            conversationId,
            previousCachedMessages
          );
        }

        if (wasActiveConversation) {
          setActiveConversationId(conversationId);
          setMessages(previousMessages);
          setInput(previousInput);
        }

        throw error;
      }
    },
    [
      activeConversationId,
      conversations,
      input,
      isAuthenticated,
      messages,
      queryClient,
      userId,
    ]
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
