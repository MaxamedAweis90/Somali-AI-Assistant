"use client";

import Image from "next/image";
import { ArrowLeftRight, Check, ChevronLeft, ChevronRight, MessageSquarePlus, Pencil, Search, Trash2, UserCircle2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "./user-profile";
import type { ChatConversation } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeConversationId: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  isAuthenticated: boolean;
  currentUserName?: string;
  currentUserEmail?: string;
  currentUserAvatar?: string;
  guestMessagesRemaining: number;
  onRequireAuth: () => void;
  onLogout?: () => void;
  onUpdateProfile?: (data: { name: string; username: string }) => Promise<void>;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapsed,
  isAuthenticated,
  currentUserName,
  currentUserEmail,
  currentUserAvatar,
  guestMessagesRemaining,
  onRequireAuth,
  onLogout,
  onUpdateProfile
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const shouldFocusSearchRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      conversation.title.toLowerCase().includes(normalizedQuery)
    );
  }, [conversations, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!isCollapsed && shouldFocusSearchRef.current) {
      searchInputRef.current?.focus();
      shouldFocusSearchRef.current = false;
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (editingConversationId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingConversationId]);

  const startEditingConversation = (conversation: ChatConversation) => {
    setConfirmDeleteId(null);
    setEditingConversationId(conversation.id);
    setDraftTitle(conversation.title);
  };

  const cancelEditingConversation = () => {
    setEditingConversationId(null);
    setDraftTitle("");
  };

  const submitRenameConversation = async (conversation: ChatConversation) => {
    const normalizedTitle = draftTitle.trim();

    if (!normalizedTitle || normalizedTitle === conversation.title) {
      cancelEditingConversation();
      return;
    }

    try {
      setPendingRenameId(conversation.id);
      await onRenameConversation(conversation.id, normalizedTitle);
      cancelEditingConversation();
    } finally {
      setPendingRenameId(null);
    }
  };

  const submitDeleteConversation = async (conversationId: string) => {
    try {
      setPendingDeleteId(conversationId);
      await onDeleteConversation(conversationId);
      setConfirmDeleteId((current) => (current === conversationId ? null : current));
      setEditingConversationId((current) => (current === conversationId ? null : current));
      setDraftTitle("");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const conversationToDelete = confirmDeleteId
    ? conversations.find((conversation) => conversation.id === confirmDeleteId) ?? null
    : null;

  return (
    <aside
      className={cn(
        "group/sidebar flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(8,15,33,0.98),rgba(10,20,44,0.92))] px-3 py-4 text-slate-100",
        isCollapsed && "cursor-ew-resize"
      )}
      onClick={() => {
        if (isCollapsed) {
          onToggleCollapsed();
        }
      }}
    >
      <div className="pb-4">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 ring-1 ring-sky-300/10">
              <Image src="/images/GARAS.png" alt="GARAS Chat logo" fill sizes="36px" className="object-contain p-1" priority />
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-semibold">GARAS Chat</p>
                <p className="text-xs text-slate-400">Somali AI Assistant</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleCollapsed();
            }}
            className="hidden size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/6 hover:text-slate-100 md:inline-flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ArrowLeftRight className="hidden size-4 group-hover/sidebar:block" />
            {isCollapsed ? (
              <ChevronRight className="size-4 group-hover/sidebar:hidden" />
            ) : (
              <ChevronLeft className="size-4 group-hover/sidebar:hidden" />
            )}
          </button>
        </div>

        <Button
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onNewChat();
          }}
          className={cn(
            "mt-4 h-10 rounded-xl bg-white/6 text-slate-100 hover:bg-white/10",
            isCollapsed ? "w-full justify-center px-0" : "w-full justify-start"
          )}
        >
          <MessageSquarePlus className="size-4" />
          {!isCollapsed && "Chat cusub"}
        </Button>

        {isAuthenticated ? (
          <label
            onClick={(event) => {
              event.stopPropagation();

              if (isCollapsed) {
                shouldFocusSearchRef.current = true;
                onToggleCollapsed();
              }
            }}
            className={cn(
              "mt-2 flex h-10 rounded-xl border border-white/10 bg-white/4 text-sm text-slate-400 transition hover:bg-white/7",
              isCollapsed ? "w-full items-center justify-center px-0" : "w-full items-center gap-2 px-3"
            )}
          >
            <Search className="size-4" />
            {!isCollapsed && (
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder="Raadi chats"
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
              />
            )}
          </label>
        ) : (
          !isCollapsed && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequireAuth();
              }}
              className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-sky-300/20 bg-sky-300/8 px-3 py-3 text-left text-sm text-slate-300 transition hover:border-sky-300/30 hover:bg-sky-300/12"
            >
              <Search className="size-4 shrink-0 text-sky-300" />
              <span>Gal si aad u hesho recent chats iyo search.</span>
            </button>
          )
        )}
      </div>

      {!isCollapsed && isAuthenticated && (
        <div className="pb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
          {isSearching ? "Searching results" : "Recent chats"}
        </div>
      )}

      <div className="chat-scrollbar-soft min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {!isCollapsed && isAuthenticated && (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border transition-all duration-200",
                  activeConversationId === conversation.id
                    ? "border-sky-300/30 bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(14,165,233,0.08))] text-white shadow-[0_12px_40px_-24px_rgba(56,189,248,0.85)]"
                    : "border-transparent text-slate-300 hover:border-white/12 hover:bg-white/5"
                )}
              >
                {activeConversationId === conversation.id && (
                  <div className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full bg-sky-300 shadow-[0_0_20px_rgba(125,211,252,0.9)]" />
                )}
                <div className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    {editingConversationId === conversation.id ? (
                      <div className="min-w-0 flex-1">
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void submitRenameConversation(conversation);
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              cancelEditingConversation();
                            }
                          }}
                          disabled={pendingRenameId === conversation.id}
                          className="w-full rounded-xl border border-sky-300/25 bg-slate-950/55 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/15"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        title={conversation.title}
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectConversation(conversation.id);
                        }}
                        className="min-w-0 flex-1 rounded-xl text-left outline-none"
                      >
                        <p
                          className={cn(
                            "truncate text-sm font-medium transition-colors",
                            activeConversationId === conversation.id ? "text-white" : "text-slate-200 group-hover:text-white"
                          )}
                        >
                          {conversation.title}
                        </p>
                      </button>
                    )}

                    <div
                      className={cn(
                        "flex shrink-0 items-center gap-1 transition-opacity",
                        activeConversationId === conversation.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                      )}
                    >
                      {editingConversationId === conversation.id ? (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void submitRenameConversation(conversation);
                            }}
                            disabled={pendingRenameId === conversation.id}
                            className="inline-flex size-7 items-center justify-center rounded-lg text-emerald-200 transition hover:bg-emerald-400/12 disabled:opacity-50"
                            aria-label="Save chat name"
                          >
                            <Check className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              cancelEditingConversation();
                            }}
                            disabled={pendingRenameId === conversation.id}
                            className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white disabled:opacity-50"
                            aria-label="Cancel rename"
                          >
                            <X className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditingConversation(conversation);
                            }}
                            className="inline-flex size-7 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/8 hover:text-white"
                            aria-label="Rename chat"
                          >
                            <Pencil className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              cancelEditingConversation();
                              setConfirmDeleteId((current) => (current === conversation.id ? null : conversation.id));
                            }}
                            disabled={pendingDeleteId === conversation.id}
                            className="inline-flex size-7 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-400/12 hover:text-rose-200 disabled:opacity-50"
                            aria-label="Delete chat"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))}

            {filteredConversations.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
                Wax natiijo ah lama helin.
              </div>
            )}
          </div>
        )}

        {!isCollapsed && !isAuthenticated && (
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-4">
            <p className="text-sm font-medium text-white">Guest mode</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Waxaad isticmaali kartaa chat-ka adigoon galin, laakiin recent chats lama kaydinayo, mana heli kartid history.
            </p>
            <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-sm text-sky-100">
              Fariimaha guest-ka kuu haray: {guestMessagesRemaining}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2">
        {isAuthenticated ? (
          <UserProfile 
            user={{
              name: currentUserName,
              email: currentUserEmail,
              avatar: currentUserAvatar,
              username: currentUserName?.toLowerCase().replace(/\s+/g, '') // Fallback username generation
            }}
            isCollapsed={isCollapsed}
            onLogout={onLogout}
            onUpdateProfile={onUpdateProfile}
          />
        ) : (
          <div className={cn("rounded-2xl border border-white/10 bg-white/4", isCollapsed ? "p-2" : "p-3")}>
             {isCollapsed ? (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRequireAuth();
                  }}
                  title="Soo gal"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-slate-300 transition hover:bg-white/8 hover:text-white"
                  aria-label="Soo gal"
                >
                  <UserCircle2 className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <UserCircle2 className="size-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-100">Marti</p>
                  <p className="text-xs text-slate-400">Ku gal si chats-ka loo kaydiyo</p>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRequireAuth();
                  }}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-white/10 px-3 text-xs text-slate-200 transition hover:bg-white/6"
                >
                  Soo gal
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {conversationToDelete && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close delete confirmation"
            onClick={(event) => {
              event.stopPropagation();
              if (pendingDeleteId !== conversationToDelete.id) {
                setConfirmDeleteId(null);
              }
            }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0.9))] backdrop-blur-md"
          />

          <div className="relative z-10 w-full max-w-md rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,26,52,0.97),rgba(8,15,33,0.99))] p-6 shadow-[0_30px_120px_-35px_rgba(0,0,0,0.8)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-rose-200/80">Delete chat</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Delete this conversation?</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This will permanently remove
                  {" "}
                  <span className="font-medium text-white">{conversationToDelete.title}</span>
                  {" "}
                  from your recent chats.
                </p>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (pendingDeleteId !== conversationToDelete.id) {
                    setConfirmDeleteId(null);
                  }
                }}
                disabled={pendingDeleteId === conversationToDelete.id}
                className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-slate-300 transition hover:bg-white/8 hover:text-white disabled:opacity-50"
                aria-label="Close delete modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirmDeleteId(null);
                }}
                disabled={pendingDeleteId === conversationToDelete.id}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/8 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void submitDeleteConversation(conversationToDelete.id);
                }}
                disabled={pendingDeleteId === conversationToDelete.id}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-rose-500 px-4 text-sm font-medium text-white transition hover:bg-rose-400 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
