import { useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Copy, Globe, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  onEditSubmit?: (messageId: string, text: string) => void;
}

export function MessageBubble({ message, onEditSubmit }: MessageBubbleProps) {

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const isInline = !match;

  if (isInline) {
    return (
      <code className="break-all rounded bg-black/30 px-1.5 py-0.5 font-mono text-[13px] text-sky-200" {...props}>
        {children}
      </code>
    );
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] group/code shrink-0 w-full max-w-full">
      <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-2 text-xs font-medium text-slate-400">
        <span className="font-mono lowercase">{match?.[1] || "text"}</span>
        <button onClick={handleCopyCode} className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-[13.5px] leading-relaxed chat-scrollbar-soft w-full">
        <pre className="bg-transparent! p-0! m-0! w-full max-w-full">
          <code className={cn("font-mono text-slate-300 min-w-full block", className)} {...props}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleEditSubmitLocal = () => {
    if (editValue.trim() !== message.content && editValue.trim() !== "") {
      onEditSubmit?.(message.id, editValue);
    }
    setIsEditing(false);
  };


  const isUser = message.role === "user";
  const isStreaming = Boolean(message.isStreaming);
  const hasContent = message.content.trim().length > 0;
  const hasSources = !isUser && (message.sources?.length ?? 0) > 0;
  const showWebBadge = !isUser && (message.grounded || message.searchingWeb);

  return (
    <article className={cn("group message-appear flex min-w-0 w-full gap-3 overflow-x-hidden", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-1 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-300/15 bg-sky-300/10 ring-1 ring-sky-300/10">
          <Image src="/images/GARAS.png" alt="GARAS Chat" width={22} height={22} className="object-contain" />
        </div>
      )}

      {isUser ? (
          <div className="group flex min-w-0 w-full max-w-full flex-col items-end sm:max-w-140">
            {isEditing ? (
              <div className="min-w-0 w-full max-w-full rounded-[20px] bg-[#2f2f2f] border border-white/10 p-4 shadow-lg flex flex-col space-y-3">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-500 chat-scrollbar-soft focus:ring-0"
                  rows={4}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSubmitLocal();
                    } else if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditValue(message.content);
                    }
                  }}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                       setIsEditing(false);
                       setEditValue(message.content);
                    }}
                    className="rounded-full px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditSubmitLocal}
                    disabled={editValue.trim() === ""}
                    className="rounded-full bg-emerald-500/90 hover:bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
            <>
              <div className="min-w-0 max-w-full rounded-[20px] bg-white/12 px-4 py-3 text-sm leading-8 text-white shadow-[0_12px_30px_-22px_rgba(0,0,0,0.55)] backdrop-blur-sm wrap-anywhere">
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => <h1 className="mb-3 mt-2 text-lg font-semibold" {...props} />,
                    h2: ({ ...props }) => <h2 className="mb-2 mt-2 text-base font-semibold" {...props} />,
                    h3: ({ ...props }) => <h3 className="mb-1 mt-2 text-sm font-semibold" {...props} />,
                    h4: ({ ...props }) => <h4 className="mb-1 mt-2 text-sm font-medium" {...props} />,
                    ul: ({ ...props }) => <ul className="ml-5 list-disc space-y-1" {...props} />,
                    p: ({ ...props }) => <p className="mb-2 wrap-anywhere last:mb-0" {...props} />,
                    code: CodeBlock as any,
                      pre: ({ children }: any) => <>{children}</>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>

              <div className="mt-2 flex max-w-full flex-wrap items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy message"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/8 hover:text-white"
                >
                  {isCopied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {isCopied ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit message"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/8 hover:text-white"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </button>
              </div>
            </>
            )}
          </div>
        ) : (
        <div className="min-w-0 max-w-full text-sm leading-7 text-slate-200 wrap-anywhere">
          {showWebBadge && (
            <div className="mb-3 flex items-center gap-2 px-1 text-[11px] text-emerald-200/90">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1">
                <Globe className="size-3" />
                {message.grounded ? "Web verified" : "Searching web"}
              </span>
            </div>
          )}
          {isStreaming && !hasContent ? (
            <div className="flex items-center gap-2 px-1 pt-2 text-xs text-slate-400">
              <span className="text-slate-300">{message.searchingWeb ? "GARAS wuxuu web-ka ka baarayaa xogta" : "GARAS ayaa qoraya"}</span>
              <span className="generating-dot size-1.5 rounded-full bg-sky-200/80" />
              <span className="generating-dot generating-dot-delay-1 size-1.5 rounded-full bg-sky-300/80" />
              <span className="generating-dot generating-dot-delay-2 size-1.5 rounded-full bg-cyan-200/80" />
            </div>
          ) : (
            <>
              <ReactMarkdown
                components={{
                  h1: ({ ...props }) => <h1 className="mb-3 mt-2 text-lg font-semibold text-white" {...props} />,
                  h2: ({ ...props }) => <h2 className="mb-2 mt-2 text-base font-semibold" {...props} />,
                  h3: ({ ...props }) => <h3 className="mb-1 mt-2 text-sm font-semibold" {...props} />,
                  h4: ({ ...props }) => <h4 className="mb-1 mt-2 text-sm font-medium text-slate-100" {...props} />,
                  ol: ({ ...props }) => <ol className="ml-5 list-decimal space-y-2" {...props} />,
                  ul: ({ ...props }) => <ul className="ml-5 list-disc space-y-2" {...props} />,
                  li: ({ ...props }) => <li className="pl-1" {...props} />,
                  strong: ({ ...props }) => <strong className="font-semibold text-white" {...props} />,
                  blockquote: ({ ...props }) => <blockquote className="my-3 border-l-2 border-sky-300/30 pl-4 text-slate-300" {...props} />,
                  p: ({ ...props }) => <p className="mb-2 wrap-anywhere last:mb-0" {...props} />,
                  a: ({ ...props }) => (
                    <a 
                      className="text-sky-300 underline underline-offset-4 decoration-sky-300/30 hover:decoration-sky-300 hover:text-sky-200 transition-colors" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      {...props} 
                    />
                  ),
                  code: CodeBlock as any,
                  pre: ({ children }: any) => <>{children}</>,
                }}
              >
                {message.content}
              </ReactMarkdown>
              {hasSources && (
                  <div className="mt-5 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">
                      <Globe className="size-3.5 text-sky-400" />
                      ISHA XOGTA (SOURCES)
                    </div>
                    <div className="flex overflow-x-auto gap-2.5 pb-3 chat-scrollbar-soft w-full max-w-[85vw] snap-x">
                      {message.sources?.map((source, index) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          title={source.title}
                          className="group/source flex flex-col justify-between w-40 min-w-40 sm:w-45 sm:min-w-45 h-19 shrink-0 snap-start rounded-[14px] border border-white/10 bg-[#2f2f2f] p-3 transition-all hover:bg-[#383838] hover:border-white/20 text-left no-underline relative"
                        >
                          <span className="text-[13px] font-medium text-slate-200 line-clamp-2 group-hover/source:text-sky-300 transition-colors leading-snug">
                             {source.title}
                          </span>
                          <span className="text-[10.5px] font-medium text-slate-500 line-clamp-1 transition-colors flex items-center gap-1.5 mt-1">
                            <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-[8px]">
                              {index + 1}
                            </span>
                            <span className="truncate">{source.domain}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {isStreaming && <span className="streaming-caret ml-0.5 inline-block h-5 w-0.5 rounded-full bg-sky-200/90 align-[-2px]" />}
                
                {!isStreaming && (
                  <div className="mt-3 flex opacity-0 transition-opacity group-hover:opacity-100 items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      aria-label="Copy message"
                      className="inline-flex py-1.5 px-2 items-center justify-center rounded text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                      title="Copy response"
                    >
                      {isCopied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </article>
    );
}