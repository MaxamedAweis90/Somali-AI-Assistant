"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { AuthRequiredModal } from "@/components/auth/auth-required-modal";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatShellLoading } from "@/components/chat/chat-shell-loading";
import { ChatSidebar } from "@/components/sidebar/chat-sidebar";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { useChatUIStore } from "@/stores/chat-ui-store";
import { cn } from "@/lib/utils";

interface ChatShellProps {
  showLoadingState?: boolean;
  isConversationPending?: boolean;
  conversations: ChatConversation[];
  activeConversationId: string;
  messages: ChatMessage[];
  streamingMessage: ChatMessage | null;
  input: string;
  isTyping: boolean;
  totalMessages: number;
  responseSource: "gemini" | "openai" | "fallback";
  responseModel: string | null;
  providerError: string | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  quickPrompts: string[];
  isAuthenticated: boolean;
  currentUserName?: string;
  currentUserEmail?: string;
  guestMessagesRemaining: number;
  authPromptOpen: boolean;
  authPromptTitle: string;
  authPromptDescription: string;
  onCloseAuthPrompt: () => void;
  onRequireAuth: () => void;
  onLogout?: () => void;
}

export function ChatShell({
  showLoadingState = false,
  isConversationPending = false,
  conversations,
  activeConversationId,
  messages,
  streamingMessage,
  input,
  isTyping,
  totalMessages,
  responseSource,
  responseModel,
  providerError,
  onInputChange,
  onSend,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  quickPrompts,
  isAuthenticated,
  currentUserName,
  currentUserEmail,
  guestMessagesRemaining,
  authPromptOpen,
  authPromptTitle,
  authPromptDescription,
  onCloseAuthPrompt,
  onRequireAuth,
  onLogout,
}: ChatShellProps) {
  const isEmpty = messages.length === 0;
  const isSidebarCollapsed = useChatUIStore((state) => state.isSidebarCollapsed);
  const toggleSidebarCollapsed = useChatUIStore((state) => state.toggleSidebarCollapsed);
  const providerLabel =
    responseSource === "gemini"
      ? responseModel ?? "Gemini"
      : responseSource === "openai"
        ? responseModel ?? "OpenAI"
        : "Fallback";
  const showEmptyState = !showLoadingState && !isConversationPending && isEmpty;

  if (showLoadingState) {
    return <ChatShellLoading />;
  }

  return (
    <main
      className={cn(
        "grid h-screen grid-cols-1 overflow-hidden bg-transparent",
        isSidebarCollapsed ? "md:grid-cols-[88px_1fr]" : "md:grid-cols-[280px_1fr]"
      )}
    >
      <div className="hidden overflow-hidden md:block md:h-screen">
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewChat={onNewChat}
          onSelectConversation={onSelectConversation}
          onRenameConversation={onRenameConversation}
          onDeleteConversation={onDeleteConversation}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
          isAuthenticated={isAuthenticated}
          currentUserName={currentUserName}
          currentUserEmail={currentUserEmail}
          guestMessagesRemaining={guestMessagesRemaining}
          onRequireAuth={onRequireAuth}
          onLogout={onLogout}
        />
      </div>

      <section className="relative min-h-0 min-w-0 overflow-hidden p-2.5 md:h-screen md:p-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(125,211,252,0.12),transparent_24%),linear-gradient(180deg,rgba(5,10,24,0.18),rgba(2,6,23,0.02))]" />

        <div className="relative z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,26,52,0.92),rgba(15,23,42,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-300 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="size-4" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/45 px-3 py-2 backdrop-blur-md">
              <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 ring-1 ring-sky-300/10">
                <Image src="/images/GARAS.png" alt="GARAS Chat logo" fill sizes="32px" className="object-contain p-1" priority />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white">GARAS Chat</h1>
                <p className="text-xs text-slate-400">Somali AI Assistant</p>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/45 px-3 py-2 text-xs text-slate-300 backdrop-blur-md">
            <span>Fariimo: {totalMessages}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5",
                responseSource !== "fallback"
                  ? "bg-emerald-400/12 text-emerald-200"
                  : "bg-amber-400/12 text-amber-100"
              )}
            >
              {`AI: ${providerLabel}`}
            </span>
            {responseSource === "fallback" && providerError && (
              <span className="max-w-[320px] truncate rounded-full bg-rose-400/12 px-2 py-0.5 text-rose-100" title={providerError}>
                {providerError}
              </span>
            )}
            {!isAuthenticated && <span className="text-sky-200">Marti haray: {guestMessagesRemaining}</span>}
          </div>
        </header>

        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {showEmptyState ? (
            <div className="flex min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-6 lg:px-8">
              <ChatEmptyState
                quickPrompts={quickPrompts}
                onSelectPrompt={onInputChange}
                composer={
                  <MessageInput
                    value={input}
                    isTyping={isTyping}
                    onChange={onInputChange}
                    onSubmit={onSend}
                    variant="centered"
                  />
                }
              />
            </div>
          ) : (
            <>
              {isConversationPending ? (
                <div className="flex min-h-0 flex-1 overflow-hidden px-4 pb-6 pt-20 sm:px-6 lg:px-8">
                  <div className="mx-auto flex w-full max-w-160 flex-1 flex-col gap-6 overflow-hidden">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span>Loading conversation</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
                      <div className="flex flex-col gap-6 pb-12">
                        <div className="ml-auto w-full max-w-90 rounded-[20px] bg-white/8 px-4 py-3">
                          <div className="space-y-2 animate-pulse">
                            <div className="h-3 rounded-full bg-white/10" />
                            <div className="h-3 w-5/6 rounded-full bg-white/8" />
                          </div>
                        </div>

                        <div className="flex w-full gap-3">
                          <div className="mt-1 size-9 shrink-0 rounded-full border border-sky-300/15 bg-sky-300/10" />
                          <div className="flex-1 rounded-[22px] border border-white/8 bg-white/4 px-4 py-4">
                            <div className="space-y-3 animate-pulse">
                              <div className="h-3 w-[88%] rounded-full bg-white/10" />
                              <div className="h-3 w-[72%] rounded-full bg-white/8" />
                              <div className="h-3 w-[81%] rounded-full bg-white/10" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <MessageList
                  activeConversationId={activeConversationId}
                  messages={messages}
                  streamingMessage={streamingMessage}
                  isTyping={isTyping}
                />
              )}
              <MessageInput value={input} isTyping={isTyping} onChange={onInputChange} onSubmit={onSend} />
            </>
          )}
        </div>

        <AuthRequiredModal
          open={authPromptOpen}
          title={authPromptTitle}
          description={authPromptDescription}
          onClose={onCloseAuthPrompt}
        />
        </div>
      </section>
    </main>
  );
}
