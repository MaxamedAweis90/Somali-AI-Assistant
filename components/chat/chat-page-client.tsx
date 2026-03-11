"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { ChatShell } from "@/components/chat/chat-shell";
import { useChatUI } from "@/hooks/use-chat-ui";
import { isAppwriteConfigured } from "@/lib/appwrite/client";
import { getAuthErrorMessage, getCurrentUser, logoutCurrentUser, type AuthUser } from "@/services/auth-service";

const GUEST_MESSAGE_LIMIT = 30;

const authPrompts = {
  history: {
    title: "U gal si chats-ka loo kaydiyo",
    description:
      "Guest mode waxaad ku isticmaali kartaa GARAS Chat si ku meel gaar ah, laakiin recent chats iyo history lama kaydinayo. Soo gal ama samee akoon si aad u hesho kaydinta chats-ka.",
  },
  newChat: {
    title: "Samee akoon si aad u furto chat cusub",
    description:
      "Martidu waxay ku shaqeeyaan hal chat oo ku meel gaar ah. Haddii aad rabto new chat, recent chats, iyo keydinta wada sheekaysiga, soo gal ama samee akoon.",
  },
  limit: {
    title: "Waxaad gaartay xadka guest-ka",
    description:
      "Waxaad isticmaashay 30-ka prompt ee guest-ka ah. Soo gal ama samee akoon si aad u sii wadato chat-ka oo chats-kaaga loo kaydiyo.",
  },
} as const;

interface ChatPageClientProps {
  initialConversationId?: string;
}

export function ChatPageClient({ initialConversationId }: ChatPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const previousConversationIdRef = useRef(initialConversationId ?? "");
  const [authPromptKey, setAuthPromptKey] = useState<keyof typeof authPrompts | null>(null);
  const authQuery = useQuery<AuthUser | null>({
    queryKey: ["auth-user"],
    queryFn: getCurrentUser,
    enabled: isAppwriteConfigured(),
  });
  const currentUser = isAppwriteConfigured() ? authQuery.data : null;
  const {
    messages,
    streamingMessage,
    input,
    isTyping,
    isHydrating,
    isHydratingConversations,
    isHydratingMessages,
    responseSource,
    responseModel,
    providerError,
    quickPrompts,
    conversations,
    stats,
    setInput,
    sendMessage,
    startNewChat,
    renameConversation,
    deleteConversation,
    setActiveConversationId,
  } = useChatUI(currentUser?.$id, initialConversationId);
  const authError = authQuery.error ? getAuthErrorMessage(authQuery.error) : null;

  const isAuthenticated = Boolean(currentUser);
  const isConversationRoute = Boolean(initialConversationId);
  const isResolvingConversationRoute =
    isAuthenticated &&
    isConversationRoute &&
    messages.length === 0 &&
    !streamingMessage &&
    (isHydratingConversations || isHydratingMessages || stats.activeConversationId !== initialConversationId);
  const showLoadingState =
    isAppwriteConfigured() &&
    (authQuery.isPending ||
      (isAuthenticated && !isConversationRoute && isHydratingConversations && conversations.length === 0 && messages.length === 0 && !streamingMessage) ||
      (isAuthenticated && isConversationRoute && isHydratingConversations && conversations.length === 0 && messages.length === 0 && !streamingMessage));
  const isConversationPending =
    isResolvingConversationRoute ||
    (isAuthenticated &&
      Boolean(stats.activeConversationId) &&
      isHydratingMessages &&
      messages.length === 0 &&
      !streamingMessage);
  const guestMessagesUsed = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages]
  );
  const guestMessagesRemaining = Math.max(0, GUEST_MESSAGE_LIMIT - guestMessagesUsed);

  useEffect(() => {
    if (authQuery.isPending) {
      return;
    }

    if (!isAuthenticated) {
      if (pathname.startsWith("/c/")) {
        router.replace("/");
      }
      return;
    }
  }, [authQuery.isPending, isAuthenticated, pathname, router]);

  useEffect(() => {
    if (!isAuthenticated || !initialConversationId || isHydratingConversations) {
      return;
    }

    if (conversations.length > 0 && !conversations.some((conversation) => conversation.id === initialConversationId)) {
      startNewChat();
      router.replace("/");
    }
  }, [conversations, initialConversationId, isAuthenticated, isHydratingConversations, router, startNewChat]);

  useEffect(() => {
    if (!isAuthenticated || pathname !== "/") {
      previousConversationIdRef.current = stats.activeConversationId;
      return;
    }

    const activeConversationId = stats.activeConversationId;
    const previousConversationId = previousConversationIdRef.current;
    previousConversationIdRef.current = activeConversationId;

    if (
      activeConversationId &&
      activeConversationId !== previousConversationId &&
      messages.some((message) => message.role === "user")
    ) {
      router.replace(`/c/${activeConversationId}`);
    }
  }, [isAuthenticated, messages, pathname, router, stats.activeConversationId]);

  const openAuthPrompt = (key: keyof typeof authPrompts) => {
    setAuthPromptKey(key);
  };

  const handleSend = async () => {
    if (!isAuthenticated && guestMessagesRemaining <= 0) {
      openAuthPrompt("limit");
      return;
    }

    await sendMessage();
  };

  const handleNewChat = () => {
    if (!isAuthenticated) {
      openAuthPrompt("newChat");
      return;
    }

    if (pathname !== "/") {
      router.push("/");
    }

    startNewChat();
  };

  const handleSelectConversation = (id: string) => {
    if (!isAuthenticated) {
      openAuthPrompt("history");
      return;
    }

    if (pathname !== `/c/${id}`) {
      router.push(`/c/${id}`);
    }

    setActiveConversationId(id);
  };

  const handleLogout = async () => {
    try {
      await logoutCurrentUser();
      queryClient.setQueryData(["auth-user"], null);
      setAuthPromptKey(null);
      startNewChat();
      if (pathname !== "/") {
        router.replace("/");
      }
    } catch (error) {
      console.error(getAuthErrorMessage(error));
    }
  };

  if (authError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12 text-center">
        <div className="max-w-md rounded-[28px] border border-rose-400/20 bg-rose-400/10 px-6 py-5 text-sm leading-6 text-rose-100">
          {authError}
        </div>
      </main>
    );
  }

  const activePrompt = authPromptKey ? authPrompts[authPromptKey] : null;

  return (
    <ChatShell
      showLoadingState={showLoadingState}
      isConversationPending={isConversationPending}
      conversations={isAuthenticated ? conversations : []}
      activeConversationId={stats.activeConversationId}
      messages={messages}
      streamingMessage={streamingMessage}
      input={input}
      isTyping={isTyping}
      totalMessages={stats.totalMessages}
      responseSource={responseSource}
      responseModel={responseModel}
      providerError={providerError}
      onInputChange={setInput}
      onSend={handleSend}
      onNewChat={handleNewChat}
      onSelectConversation={handleSelectConversation}
      onRenameConversation={renameConversation}
      onDeleteConversation={deleteConversation}
      quickPrompts={quickPrompts}
      isAuthenticated={isAuthenticated}
      currentUserName={currentUser?.name}
      currentUserEmail={currentUser?.email}
      guestMessagesRemaining={guestMessagesRemaining}
      authPromptOpen={Boolean(activePrompt)}
      authPromptTitle={activePrompt?.title ?? ""}
      authPromptDescription={activePrompt?.description ?? ""}
      onCloseAuthPrompt={() => setAuthPromptKey(null)}
      onRequireAuth={() => openAuthPrompt("history")}
      onLogout={handleLogout}
    />
  );
}