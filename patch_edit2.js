const fs = require('fs');
let code = fs.readFileSync('components/chat/message-bubble.tsx', 'utf8');

const newUserBlock = `{isUser ? (
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
        ) : (\n`;

const startIdx = code.indexOf('{isUser ? (');
const roleFallbackStr = '        <div className="min-w-0 max-w-full text-sm leading-7 text-slate-200 wrap-anywhere">';
const roleFallback = code.indexOf(roleFallbackStr);

if (startIdx !== -1 && roleFallback !== -1) {
    const finalStr = code.substring(0, startIdx) + newUserBlock + code.substring(roleFallback);
    fs.writeFileSync('components/chat/message-bubble.tsx', finalStr);
    console.log("SUCCESS FALLBACK");
} else {
    console.log("FAIL COMPELETELY", startIdx, roleFallback);
}
