"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/chat";
import { MessageBubble } from "@/components/chat/message-bubble";

const TOP_PIN_OFFSET = 84;
const TOP_PIN_BUFFER = 24;

interface MessageListProps {
  activeConversationId: string;
  messages: ChatMessage[];
  streamingMessage: ChatMessage | null;
  isTyping: boolean;
}

export function MessageList({ activeConversationId, messages, streamingMessage, isTyping }: MessageListProps) {
  const scrollContainerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLElement | null>>({});
  const hasInitializedRef = useRef(false);
  const previousLastMessageIdRef = useRef<string | null>(null);
  const activeAnchorIdRef = useRef<string | null>(null);
  const hasPinnedInitialMessageRef = useRef(false);
  const previousConversationIdRef = useRef<string | null>(null);
  const pendingConversationScrollRef = useRef(false);
  const [tailSpacerHeight, setTailSpacerHeight] = useState(0);

  const scrollToPinnedMessage = (messageId: string, behavior: ScrollBehavior) => {
    const container = scrollContainerRef.current;
    const target = messageRefs.current[messageId];

    if (!container || !target) {
      return;
    }

    const nextTop = Math.max(0, target.offsetTop - TOP_PIN_OFFSET);
    container.scrollTo({ top: nextTop, behavior });
  };

  const scrollToBottom = (behavior: ScrollBehavior) => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  useLayoutEffect(() => {
    if (previousConversationIdRef.current === activeConversationId) {
      return;
    }

    previousConversationIdRef.current = activeConversationId;
    hasInitializedRef.current = false;
    previousLastMessageIdRef.current = null;
    activeAnchorIdRef.current = null;
    hasPinnedInitialMessageRef.current = false;
    pendingConversationScrollRef.current = Boolean(activeConversationId);

    if (tailSpacerHeight !== 0) {
      setTailSpacerHeight(0);
    }
  }, [activeConversationId, tailSpacerHeight]);

  useLayoutEffect(() => {
    if (!pendingConversationScrollRef.current || messages.length === 0 || isTyping || Boolean(streamingMessage)) {
      return;
    }

    pendingConversationScrollRef.current = false;
    hasInitializedRef.current = true;
    hasPinnedInitialMessageRef.current = true;
    previousLastMessageIdRef.current = messages.at(-1)?.id ?? null;
    scrollToBottom("auto");
  }, [isTyping, messages, streamingMessage, activeConversationId]);

  useLayoutEffect(() => {
    if (pendingConversationScrollRef.current) {
      return;
    }

    const lastMessage = messages.at(-1);

    if (!hasInitializedRef.current) {
      previousLastMessageIdRef.current = lastMessage?.id ?? null;
      if (lastMessage && !isTyping) {
        activeAnchorIdRef.current = lastMessage.id;
        hasPinnedInitialMessageRef.current = true;
        scrollToPinnedMessage(lastMessage.id, "auto");
      }
      hasInitializedRef.current = true;
      return;
    }

    if (!lastMessage) {
      previousLastMessageIdRef.current = null;
      return;
    }

    const previousLastMessageId = previousLastMessageIdRef.current;
    previousLastMessageIdRef.current = lastMessage.id;

    if (lastMessage.role !== "user" || previousLastMessageId === lastMessage.id) {
      return;
    }

    activeAnchorIdRef.current = lastMessage.id;

    scrollToPinnedMessage(lastMessage.id, "smooth");
  }, [messages, isTyping]);

  useLayoutEffect(() => {
    if (pendingConversationScrollRef.current) {
      return;
    }

    const lastMessage = messages.at(-1);

    if (!lastMessage || isTyping || hasPinnedInitialMessageRef.current) {
      return;
    }

    activeAnchorIdRef.current = lastMessage.id;
    hasPinnedInitialMessageRef.current = true;
    scrollToPinnedMessage(lastMessage.id, "auto");
  }, [messages, isTyping]);

  useLayoutEffect(() => {
    if (pendingConversationScrollRef.current) {
      return;
    }

    const anchorId = activeAnchorIdRef.current;
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    const target = anchorId ? messageRefs.current[anchorId] : null;

    if (!container || !content || !target) {
      if (tailSpacerHeight !== 0) {
        setTailSpacerHeight(0);
      }
      return;
    }

    const desiredTop = Math.max(0, target.offsetTop - TOP_PIN_OFFSET);
    const baseScrollableHeight = Math.max(0, content.offsetHeight - container.clientHeight);
    const requiredSpacer = Math.max(0, desiredTop - baseScrollableHeight + TOP_PIN_BUFFER);

    if (Math.abs(requiredSpacer - tailSpacerHeight) > 4) {
      setTailSpacerHeight(requiredSpacer);
      return;
    }

    if ((isTyping || streamingMessage || tailSpacerHeight > 0) && Math.abs(container.scrollTop - desiredTop) > 4) {
      container.scrollTo({ top: desiredTop, behavior: streamingMessage ? "auto" : "smooth" });
    }
  }, [isTyping, messages, streamingMessage?.content, tailSpacerHeight, streamingMessage]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-[linear-gradient(180deg,rgba(15,26,52,0.94),rgba(15,26,52,0.55),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-[linear-gradient(0deg,rgba(15,23,42,0.96),rgba(15,23,42,0.62),transparent)]" />

      <section
        ref={scrollContainerRef}
        className="chat-scrollbar min-h-0 h-full overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-6 pt-3 sm:px-6 sm:pt-4 lg:px-8"
      >
        <div ref={contentRef} className="mx-auto flex min-w-0 w-full max-w-160 flex-col gap-6">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span>Today</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              ref={(element) => {
                messageRefs.current[message.id] = element;
              }}
            >
              <MessageBubble message={message} />
            </div>
          ))}

          {streamingMessage && <MessageBubble message={streamingMessage} />}

          {isTyping && !streamingMessage && (
            <article className="message-appear flex min-w-0 w-full gap-3 overflow-x-hidden">
              <div className="mt-1 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-300/15 bg-sky-300/10 ring-1 ring-sky-300/10">
                <Image src="/images/GARAS.png" alt="GARAS Chat" width={22} height={22} className="object-contain" />
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-2 px-1 pt-2 text-xs text-slate-400">
                <span className="text-slate-300">GARAS ayaa qoraya</span>
                <span className="generating-dot size-1.5 rounded-full bg-sky-200/80" />
                <span className="generating-dot generating-dot-delay-1 size-1.5 rounded-full bg-sky-300/80" />
                <span className="generating-dot generating-dot-delay-2 size-1.5 rounded-full bg-cyan-200/80" />
              </div>
            </article>
          )}
        </div>

        <div aria-hidden="true" style={{ height: tailSpacerHeight }} />
      </section>
    </div>
  );
}
