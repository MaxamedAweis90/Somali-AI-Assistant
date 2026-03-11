import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Copy, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isStreaming = Boolean(message.isStreaming);

  return (
    <article className={cn("message-appear flex min-w-0 w-full gap-3 overflow-x-hidden", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-1 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-300/15 bg-sky-300/10 ring-1 ring-sky-300/10">
          <Image src="/images/GARAS.png" alt="GARAS Chat" width={22} height={22} className="object-contain" />
        </div>
      )}

      {isUser ? (
        <div className="group flex min-w-0 w-fit max-w-full flex-col items-end sm:max-w-140">
          <div className="min-w-0 max-w-full rounded-[20px] bg-white/12 px-4 py-3 text-sm leading-8 text-white shadow-[0_12px_30px_-22px_rgba(0,0,0,0.55)] backdrop-blur-sm wrap-anywhere">
            <ReactMarkdown
              components={{
                h2: ({ ...props }) => <h2 className="mb-2 mt-2 text-base font-semibold" {...props} />,
                h3: ({ ...props }) => <h3 className="mb-1 mt-2 text-sm font-semibold" {...props} />,
                ul: ({ ...props }) => <ul className="ml-5 list-disc space-y-1" {...props} />,
                p: ({ ...props }) => <p className="mb-2 wrap-anywhere last:mb-0" {...props} />,
                code: ({ ...props }) => (
                  <code
                    className="break-all rounded bg-black/30 px-1 py-0.5 font-mono text-[13px]"
                    {...props}
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          <div className="mt-2 flex max-w-full flex-wrap items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              aria-label="Copy message"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/8 hover:text-white"
            >
              <Copy className="size-3.5" />
              Copy
            </button>
            <button
              type="button"
              aria-label="Edit message"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/8 hover:text-white"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>
          </div>
        </div>
      ) : (
        <div className="min-w-0 max-w-full text-sm leading-7 text-slate-200 wrap-anywhere">
          <ReactMarkdown
            components={{
              h2: ({ ...props }) => <h2 className="mb-2 mt-2 text-base font-semibold" {...props} />,
              h3: ({ ...props }) => <h3 className="mb-1 mt-2 text-sm font-semibold" {...props} />,
              ul: ({ ...props }) => <ul className="ml-5 list-disc space-y-1" {...props} />,
              p: ({ ...props }) => <p className="mb-2 wrap-anywhere last:mb-0" {...props} />,
              code: ({ ...props }) => (
                <code
                  className="break-all rounded bg-black/30 px-1 py-0.5 font-mono text-[13px]"
                  {...props}
                />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          {isStreaming && <span className="streaming-caret ml-0.5 inline-block h-5 w-0.5 rounded-full bg-sky-200/90 align-[-2px]" />}
        </div>
      )}

    </article>
  );
}
