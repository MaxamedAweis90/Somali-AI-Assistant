"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Globe,
  ImagePlus,
  Mic,
  Plus,
  ArrowUp,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import {
  AI_IMAGE_DAILY_LIMIT,
} from "@/lib/ai/model-catalog";
import { useChatUIStore } from "@/stores/chat-ui-store";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  value: string;
  isTyping: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  variant?: "docked" | "centered";
}

interface FloatingMenuPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function MessageInput({
  value,
  isTyping,
  onChange,
  onSubmit,
  variant = "docked",
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [optionsMenuPosition, setOptionsMenuPosition] = useState<FloatingMenuPosition | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const selectedToolMode = useChatUIStore((state) => state.selectedToolMode);
  const imageQuota = useChatUIStore((state) => state.imageQuota);
  const webSearchEnabled = useChatUIStore((state) => state.webSearchEnabled);
  
  const setSelectedToolMode = useChatUIStore((state) => state.setSelectedToolMode);
  const setWebSearchEnabled = useChatUIStore((state) => state.setWebSearchEnabled);
  
  const todayKey = new Date().toISOString().slice(0, 10);
  const imageRemaining = imageQuota.dateKey === todayKey
    ? Math.max(0, AI_IMAGE_DAILY_LIMIT - imageQuota.used)
    : AI_IMAGE_DAILY_LIMIT;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (isExpanded) {
      textarea.style.height = "100%";
      textarea.style.overflowY = "auto";
      return;
    }

    const maxLines = 14;
    const lineHeight = 24;
    const maxHeight = lineHeight * maxLines;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        !containerRef.current?.contains(event.target as Node) &&
        !optionsMenuRef.current?.contains(event.target as Node)
      ) {
        setIsOptionsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOptionsMenuOpen(false);
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
    const getMenuPosition = (button: HTMLButtonElement | null): FloatingMenuPosition | null => {
      if (!button) return null;

      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = 240;
      const verticalGap = 12;
      const verticalMargin = 16;
      
      const left = Math.min(Math.max(16, rect.left), viewportWidth - width - 16);
      const availableAbove = rect.top - verticalMargin;
      const availableBelow = viewportHeight - rect.bottom - verticalMargin;
      
      const shouldOpenAbove = availableAbove >= 150 || availableAbove >= availableBelow;
      
      if (shouldOpenAbove) {
        return {
          bottom: viewportHeight - rect.top + verticalGap,
          left,
          width,
          maxHeight: Math.max(150, availableAbove - verticalGap)
        };
      } else {
        return {
          top: rect.bottom + verticalGap,
          left,
          width,
          maxHeight: Math.max(150, availableBelow - verticalGap)
        };
      }
    };

    const syncMenuPosition = () => {
      if (isOptionsMenuOpen) {
        setOptionsMenuPosition(getMenuPosition(plusButtonRef.current));
      }
    };

    if (isOptionsMenuOpen) {
      syncMenuPosition();
      window.addEventListener("resize", syncMenuPosition);
      window.addEventListener("scroll", syncMenuPosition, true);
    }

    return () => {
      window.removeEventListener("resize", syncMenuPosition);
      window.removeEventListener("scroll", syncMenuPosition, true);
    };
  }, [isOptionsMenuOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedToolMode === "image" || !value.trim()) return;
    onSubmit();
    setIsExpanded(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (selectedToolMode === "image" || !value.trim()) return;
      onSubmit();
      setIsExpanded(false);
    }

    if (event.key === "Escape" && isExpanded) {
      event.preventDefault();
      setIsExpanded(false);
    }
  };

  const hasText = value.trim().length > 0;

  const optionsMenu = isOptionsMenuOpen && optionsMenuPosition
    ? createPortal(
        <div
          ref={optionsMenuRef}
          className={cn(
            "fixed z-200 rounded-[16px] border border-white/5 bg-[#2f2f2f] shadow-2xl animate-in fade-in zoom-in-95 text-slate-100 flex flex-col p-1.5",
            optionsMenuPosition.bottom !== undefined ? "origin-bottom-left" : "origin-top-left"
          )}
          style={{
            ...(optionsMenuPosition.top !== undefined ? { top: optionsMenuPosition.top } : {}),
            ...(optionsMenuPosition.bottom !== undefined ? { bottom: optionsMenuPosition.bottom } : {}),
            left: optionsMenuPosition.left,
            width: optionsMenuPosition.width,
            maxHeight: optionsMenuPosition.maxHeight,
          }}
        >
          <div className="overflow-y-auto chat-scrollbar-soft">
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setWebSearchEnabled(!webSearchEnabled);
                  if (selectedToolMode === "image") setSelectedToolMode("chat");
                  setIsOptionsMenuOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-[15px] transition-colors",
                  webSearchEnabled ? "bg-white/10 text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Globe className={cn("size-4.5", webSearchEnabled ? "text-emerald-400" : "text-slate-400")} />
                  <span>Search web</span>
                </div>
                {webSearchEnabled && <Check className="size-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedToolMode(selectedToolMode === "image" ? "chat" : "image");
                  if (webSearchEnabled) setWebSearchEnabled(false);
                  setIsOptionsMenuOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-[15px] transition-colors",
                  selectedToolMode === "image" ? "bg-white/10 text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <ImagePlus className={cn("size-4.5", selectedToolMode === "image" ? "text-sky-400" : "text-slate-400")} />
                  <span>Create image</span>
                </div>
                {selectedToolMode === "image" && <Check className="size-4 text-sky-400" />}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {optionsMenu}
      
      {isExpanded && (
        <div 
          className="fixed inset-0 z-140 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200" 
          onClick={() => setIsExpanded(false)} 
        />
      )}

      <div className={cn(
        "w-full transition-all flex justify-center", 
        isExpanded ? "fixed inset-0 z-150 items-center p-4 sm:p-8 md:p-12 lg:p-20 pointer-events-none fade-in duration-300" : "pb-4",
        !isExpanded && (variant === "centered" ? "max-w-3xl mx-auto px-4" : "px-4 sm:px-6 lg:px-8")
      )}>
        <form onSubmit={handleSubmit} className={cn("w-full relative shadow-sm max-w-4xl pointer-events-auto", isExpanded && "h-[85vh] sm:h-[80vh] flex flex-col")}>
          <div ref={containerRef} className={cn(
            "w-full rounded-[26px] bg-[#212121] transition-shadow duration-200 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.15)] flex flex-col border border-white/5",
            isExpanded ? "h-full p-4 sm:p-5 shadow-2xl" : "p-2.5 sm:px-3 sm:py-3"
          )}>
            <div className={cn("flex items-end gap-2 w-full", isExpanded && "grow min-h-0")}>
              
              <button
                ref={plusButtonRef}
                type="button"
                onClick={() => setIsOptionsMenuOpen((curr) => !curr)}
                className={cn(
                  "shrink-0 size-8 sm:size-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-100 transition-colors",
                  isOptionsMenuOpen && "rotate-45"
                )}
                aria-label="Add tools"
              >
                <Plus className="size-6 transition-transform duration-200" strokeWidth={2} />
              </button>

              {selectedToolMode === "image" && (
                <button
                  type="button"
                  onClick={() => setSelectedToolMode("chat")}
                  className="flex shrink-0 items-center justify-center gap-2 h-9 px-3 rounded-full bg-transparent hover:bg-[#2f3542] text-[#82b4fb] font-medium text-[15px] transition-colors group"
                >
                  <div className="relative flex items-center justify-center size-5">
                    <ImagePlus className="size-4.5 absolute transition-opacity duration-200 group-hover:opacity-0" strokeWidth={2} />
                    <div className="absolute opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center size-5 bg-[#171717] rounded-full">
                      <X className="size-3.5" strokeWidth={2.5} />
                    </div>
                  </div>
                  <span>Image</span>
                </button>
              )}

              {webSearchEnabled && (
                <button
                  type="button"
                  onClick={() => setWebSearchEnabled(false)}
                  className="flex shrink-0 items-center justify-center gap-2 h-9 px-3 rounded-full bg-transparent hover:bg-[#2f3542] text-[#82b4fb] font-medium text-[15px] transition-colors group"
                >
                  <div className="relative flex items-center justify-center size-5">
                    <Globe className="size-4.5 absolute transition-opacity duration-200 group-hover:opacity-0" strokeWidth={2} />
                    <div className="absolute opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center size-5 bg-[#171717] rounded-full">
                      <X className="size-3.5" strokeWidth={2.5} />
                    </div>
                  </div>
                  <span>Search</span>
                </button>
              )}

              <div className={cn("relative grow min-w-0 flex flex-col group/textwrapper", isExpanded && "h-full")}>
                {isExpanded && (
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10 shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Message Editor</span>
                    <button 
                      type="button" 
                      onClick={() => setIsExpanded(false)} 
                      className="text-slate-400 hover:text-white transition-colors hover:bg-white/10 p-1.5 rounded-full"
                      aria-label="Minimize editor"
                    >
                        <Minimize2 className="size-4" />
                    </button>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Message GARAS..."
                  className={cn(
                    "grow w-full bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-400 resize-none py-1.5 sm:py-2 scroll-smooth",
                    "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent",
                    isExpanded ? "h-full max-h-none text-[16px] leading-6.5" : "text-[15px] sm:text-[16px] leading-5.5 min-h-6 max-h-75"
                  )}
                />

                {!isExpanded && value.length > 50 && (
                  <div className="absolute right-0 top-0 -mt-1 sm:-mt-2 opacity-0 group-hover/textwrapper:opacity-100 transition-opacity duration-200">
                    <button 
                      type="button" 
                      onClick={() => setIsExpanded(true)} 
                      className="p-1.5 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-sm text-slate-400 hover:text-white transition-colors"
                      title="Expand editor"
                    >
                      <Maximize2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="shrink-0 flex items-center">
                {!hasText ? (
                  <button type="button" className="size-8 sm:size-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors duration-200">
                    <Mic className="size-5.5" strokeWidth={2} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isTyping || selectedToolMode === "image"}
                    className="size-8 sm:size-9 rounded-full bg-white text-black flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <ArrowUp className="size-5.5" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
