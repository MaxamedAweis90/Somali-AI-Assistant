"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Braces, ChevronDown, Globe, Menu } from "lucide-react";
import { AuthRequiredModal } from "@/components/auth/auth-required-modal";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatShellLoading } from "@/components/chat/chat-shell-loading";
import { ChatSidebar } from "@/components/sidebar/chat-sidebar";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { useChatUIStore } from "@/stores/chat-ui-store";
import { findAIModelByApiModel, getAIModelOption, getAIModelOptions, getModelLabel, type AIProvider } from "@/lib/ai/model-catalog";
import { cn } from "@/lib/utils";

const TEMPLATE_EXPLANATIONS: Record<NonNullable<ChatMessage["responseTemplate"]>, { label: string; reason: string; structure: string }> = {
  history: {
    label: "History",
    reason: "Used when the question asks about timelines, eras, leaders, or what happened first.",
    structure: "Organizes the answer by period, sequence, and key events.",
  },
  comparison: {
    label: "Comparison",
    reason: "Used when the question asks for differences, pros and cons, or side-by-side evaluation.",
    structure: "Breaks the reply into criteria so options are easy to compare.",
  },
  "how-to": {
    label: "How-To",
    reason: "Used for task-based questions that need steps, instructions, or a process.",
    structure: "Presents the answer as ordered actions with practical guidance.",
  },
  biography: {
    label: "Biography",
    reason: "Used when the question is about a person, their background, or major achievements.",
    structure: "Groups the answer into identity, background, milestones, and impact.",
  },
  analysis: {
    label: "Analysis",
    reason: "Used for deeper reasoning, tradeoffs, causes, and consequences.",
    structure: "Separates the answer into themes, evidence, and takeaways.",
  },
  general: {
    label: "General",
    reason: "Used when there is no stronger pattern like history, comparison, or step-by-step guidance.",
    structure: "Keeps the answer clean with short sections and direct explanations.",
  },
};

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
  responseSource: AIProvider | null;
  responseModel: string | null;
  providerError: string | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onEditSubmit?: (messageId: string, text: string) => void;
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
  onUpdateProfile?: (data: { name: string; username: string }) => Promise<void>;
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
  onEditSubmit,
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
  onUpdateProfile,
}: ChatShellProps) {
  const templatePopoverRef = useRef<HTMLDivElement>(null);
  const modelPopoverRef = useRef<HTMLDivElement>(null);
  const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = useState(false);
  const [isModelPopoverOpen, setIsModelPopoverOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isEmpty = messages.length === 0;
  const isSidebarCollapsed = useChatUIStore((state) => state.isSidebarCollapsed);
  const selectedModelId = useChatUIStore((state) => state.selectedModelId);
  const webSearchEnabled = useChatUIStore((state) => state.webSearchEnabled);
  const toggleSidebarCollapsed = useChatUIStore((state) => state.toggleSidebarCollapsed);
  const setSelectedModelId = useChatUIStore((state) => state.setSelectedModelId);
  const activeModel = findAIModelByApiModel(responseModel);
  const selectedModel = getAIModelOption(selectedModelId);
  const switchableModels = useMemo(
    () => getAIModelOptions("chat").filter((option) => option.status === "ready"),
    []
  );
  const providerLabel = activeModel?.label ?? getModelLabel(selectedModelId, responseModel);
  const showEmptyState = !showLoadingState && !isConversationPending && isEmpty;
  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant") ?? streamingMessage;
  const showWebStatus = webSearchEnabled && (responseSource === "gemini" || latestAssistantMessage?.grounded || latestAssistantMessage?.searchingWeb);
  const templateLabel = latestAssistantMessage?.responseTemplate ? latestAssistantMessage.responseTemplate.replace("-", " ") : null;
  const templateDetails = latestAssistantMessage?.responseTemplate
    ? TEMPLATE_EXPLANATIONS[latestAssistantMessage.responseTemplate]
    : null;

  const [enableLayoutTransitions, setEnableLayoutTransitions] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;

    if (!viewport) {
      return;
    }

    const syncVisualViewportHeight = () => {
      document.documentElement.style.setProperty("--vvh", `${viewport.height}px`);
    };

    syncVisualViewportHeight();
    viewport.addEventListener("resize", syncVisualViewportHeight);
    viewport.addEventListener("scroll", syncVisualViewportHeight);

    return () => {
      viewport.removeEventListener("resize", syncVisualViewportHeight);
      viewport.removeEventListener("scroll", syncVisualViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (useChatUIStore.persist.hasHydrated()) {
      const id = requestAnimationFrame(() => setEnableLayoutTransitions(true));
      return () => cancelAnimationFrame(id);
    }

    const unsubscribe = useChatUIStore.persist.onFinishHydration(() => {
      const id = requestAnimationFrame(() => setEnableLayoutTransitions(true));
      return () => cancelAnimationFrame(id);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!templatePopoverRef.current?.contains(event.target as Node)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTemplatePopoverOpen(false);
      }

      if (!modelPopoverRef.current?.contains(event.target as Node)) {
        setIsModelPopoverOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTemplatePopoverOpen(false);
        setIsModelPopoverOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!templateDetails) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTemplatePopoverOpen(false);
    }
  }, [templateDetails]);

  if (showLoadingState) {
    return <ChatShellLoading />;
  }

  return (
    <main
      style={
        {
          "--sidebar-columns": `${isSidebarCollapsed ? 88 : 280}px 1fr`,
        } as React.CSSProperties
      }
      className={cn(
        "grid h-[var(--vvh,100dvh)] grid-cols-1 overflow-hidden bg-transparent md:h-screen md:[grid-template-columns:var(--sidebar-columns)]",
        enableLayoutTransitions && "md:transition-[grid-template-columns] md:duration-200 md:ease-out"
      )}
    >
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-60 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 w-[min(340px,86vw)]">
            <ChatSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onNewChat={() => {
                setIsMobileSidebarOpen(false);
                onNewChat();
              }}
              onSelectConversation={(id) => {
                setIsMobileSidebarOpen(false);
                onSelectConversation(id);
              }}
              onRenameConversation={onRenameConversation}
              onDeleteConversation={onDeleteConversation}
              isCollapsed={false}
              onToggleCollapsed={() => setIsMobileSidebarOpen(false)}
              isAuthenticated={isAuthenticated}
              currentUserName={currentUserName}
              currentUserEmail={currentUserEmail}
              guestMessagesRemaining={guestMessagesRemaining}
              onRequireAuth={() => {
                setIsMobileSidebarOpen(false);
                onRequireAuth();
              }}
              onUpdateProfile={onUpdateProfile}
              onLogout={onLogout}
            />
          </div>
        </div>
      )}

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
          onUpdateProfile={onUpdateProfile}
          onLogout={onLogout}
        />
      </div>

      <section className="relative min-h-0 min-w-0 overflow-hidden p-0 md:h-screen lg:p-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(125,211,252,0.12),transparent_24%),linear-gradient(180deg,rgba(5,10,24,0.18),rgba(2,6,23,0.02))]" />

        <div className="relative z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-none border-0 bg-[linear-gradient(180deg,rgba(15,26,52,0.92),rgba(15,23,42,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] lg:rounded-[20px] lg:border lg:border-white/10">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-6 sm:pt-4 md:py-4">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/50 transition md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="size-5" />
            </button>

            <div ref={modelPopoverRef} className="relative">
              <button
                type="button"
                onClick={() => setIsModelPopoverOpen((current) => !current)}
                className="group flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 transition-colors hover:bg-slate-800/50"
                aria-label="Switch model"
                aria-expanded={isModelPopoverOpen}
              >
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-white tracking-tight">GARAS</h1>
                  <span className="text-lg font-medium text-slate-400">{selectedModel?.shortLabel ?? providerLabel}</span>
                </div>
                <ChevronDown className={cn("size-4 text-slate-500 transition-transform duration-200 group-hover:text-slate-300", isModelPopoverOpen && "rotate-180")} />
              </button>

              {isModelPopoverOpen && (
                <div className="absolute left-2 top-full z-30 mt-1 w-80 rounded-2xl border border-white/10 bg-[#171717] p-1.5 shadow-2xl origin-top-left animate-in fade-in zoom-in-95">
                  <div className="px-3 pb-2 pt-2 mb-1 border-b border-white/5">
                    <p className="text-xs font-medium text-slate-400">Model Configuration</p>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {switchableModels.map((option) => {
                      const isActive = selectedModelId === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSelectedModelId(option.id);
                            setIsModelPopoverOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            isActive
                              ? "bg-slate-800/80 text-white"
                              : "text-slate-300 hover:bg-slate-800/50"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{option.label}</span>
                            <span className="text-xs text-slate-400 mt-0.5">{option.apiModel}</span>
                          </div>
                          {isActive && (
                            <div className="flex size-5 items-center justify-center rounded-full bg-white text-black">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pointer-events-auto flex min-w-0 flex-nowrap items-center justify-end gap-2 overflow-hidden">
            {showWebStatus && (
              <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 shadow-sm backdrop-blur-md border", latestAssistantMessage?.grounded ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-sky-500/10 text-sky-300 border-sky-500/20")}>
                <Globe className="size-3.5" />
                <span className="hidden text-xs font-medium sm:inline">
                  {latestAssistantMessage?.grounded ? "Web verified" : "Web search active"}
                </span>
              </span>
            )}
            
            {templateLabel && templateDetails && (
              <div ref={templatePopoverRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setIsTemplatePopoverOpen((current) => !current)}
                  className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-slate-200 transition hover:bg-white/12"
                  aria-expanded={isTemplatePopoverOpen}
                  aria-label={`Explain ${templateDetails.label} format`}
                >
                  <Braces className="size-3" />
                  {`Format: ${templateLabel}`}
                </button>

                {isTemplatePopoverOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,26,52,0.98),rgba(15,23,42,0.99))] p-3 text-left shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-slate-100">
                      <Braces className="size-3.5 text-sky-200" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{templateDetails.label}</p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-300">{templateDetails.reason}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{templateDetails.structure}</p>
                  </div>
                )}
              </div>
            )}
            {providerError && (
              <span className="max-w-[320px] truncate rounded-full bg-rose-400/12 px-2 py-0.5 text-rose-100" title={providerError}>
                {providerError}
              </span>
            )}
            {!isAuthenticated && <span className="text-sky-200">Marti haray: {guestMessagesRemaining}</span>}
          </div>
        </header>

        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {showEmptyState ? (
            <>
              <div className="flex min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-[calc(env(safe-area-inset-top)+3.75rem)] sm:px-6 sm:pb-6 sm:pt-6 lg:px-8">
                <ChatEmptyState
                  quickPrompts={quickPrompts}
                  onSelectPrompt={onInputChange}
                  composer={
                    <div className="hidden md:block">
                      <MessageInput
                        value={input}
                        isTyping={isTyping}
                        onChange={onInputChange}
                        onSubmit={onSend}
                        variant="centered"
                      />
                    </div>
                  }
                />
              </div>

              <div className="md:hidden">
                <MessageInput value={input} isTyping={isTyping} onChange={onInputChange} onSubmit={onSend} variant="docked" />
              </div>
            </>
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
                  onEditSubmit={onEditSubmit}
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
