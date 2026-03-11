"use client";

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Expand, Minimize2, Mic, Plus, SendHorizontal, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  value: string;
  isTyping: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  variant?: "docked" | "centered";
}

export function MessageInput({
  value,
  isTyping,
  onChange,
  onSubmit,
  variant = "docked",
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandRegionId = useId();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const maxLines = isExpanded ? 14 : 7;
    const lineHeight = 28;
    const maxHeight = lineHeight * maxLines;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }

    if (event.key === "Escape" && isExpanded) {
      event.preventDefault();
      setIsExpanded(false);
    }
  };

  const isCentered = variant === "centered";

  const shell = (
    <div
      className={cn(
        "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,33,0.96),rgba(7,12,25,0.98))] text-slate-100 backdrop-blur-xl transition-shadow duration-200",
        isExpanded ? "composer-shell-expanded" : "composer-shell"
      )}
    >
      <div className="flex min-w-0 flex-col overflow-hidden rounded-[30px]">
        <div
          id={expandRegionId}
          className={cn(
            "relative px-5 pt-4",
            isExpanded ? "min-h-88 pb-3 sm:min-h-96" : "pb-2"
          )}
        >
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="absolute right-4 top-4 z-10 inline-flex size-6 items-center justify-center text-slate-500 transition hover:text-slate-200"
            aria-label={isExpanded ? "Collapse composer" : "Expand composer"}
            aria-controls={expandRegionId}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <Minimize2 className="size-3.5" /> : <Expand className="size-3.5" />}
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Su'aashaada Af-Somali ku qor..."
            className={cn(
              "no-scrollbar block w-full min-w-0 resize-none bg-transparent pr-11 text-[15px] leading-7 text-slate-100 outline-none placeholder:text-slate-500",
              isExpanded ? "min-h-72" : "min-h-7"
            )}
          />
        </div>

        <div className="border-t border-white/8 px-4 py-2.5 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5">
              <button
                type="button"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/8"
                aria-label="Add attachment"
              >
                <Plus className="size-4.5" />
              </button>

              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-slate-300 transition hover:bg-white/8"
                aria-label="Tools"
              >
                <SlidersHorizontal className="size-4" />
                Tools
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-slate-300 transition hover:bg-white/8"
                aria-label="Thinking mode"
              >
                Thinking
                <span className="text-xs text-slate-500">▾</span>
              </button>

              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/8"
                aria-label="Voice input"
              >
                <Mic className="size-4" />
              </button>

              <Button
                type="submit"
                disabled={!value.trim() || isTyping}
                size="icon"
                className="size-10 rounded-full bg-sky-400 text-slate-950 hover:bg-sky-300 disabled:bg-white/8 disabled:text-slate-500"
              >
                <SendHorizontal className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isExpanded && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-[3px]" onClick={() => setIsExpanded(false)} />
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          isCentered
            ? "overflow-x-hidden px-0 py-0"
            : "shrink-0 overflow-x-hidden border-t border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.16),rgba(2,6,23,0.6))] px-4 py-4 sm:px-6 lg:px-8",
          isExpanded && "relative z-50"
        )}
      >
        <div
          className={cn(
            "mx-auto min-w-0 w-full",
            isCentered ? "max-w-170" : "max-w-160",
            isExpanded && "fixed inset-x-0 top-[8vh] z-50 w-[min(820px,calc(100vw-2rem))] max-w-none"
          )}
        >
          {shell}
        </div>
      </form>
    </>
  );
}
