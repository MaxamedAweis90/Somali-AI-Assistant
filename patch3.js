const fs = require('fs');
let code = fs.readFileSync('components/chat/message-bubble.tsx', 'utf8');

const codeBlockDef = `
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\\w+)/.exec(className || "");
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
      await navigator.clipboard.writeText(String(children).replace(/\\n$/, ""));
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
        <pre className="!bg-transparent !p-0 !m-0 w-full max-w-full">
          <code className={cn("font-mono text-slate-300 min-w-full block", className)} {...props}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};
`;

code = code.replace(/export function MessageBubble([^}]+)\{/, `export function MessageBubble$1{\n${codeBlockDef}\n`);

// Replace both instances of code object
code = code.replace(/code:\s*\(\{\s*\.\.\.props\s*\}\)\s*=>\s*\([\s\S]*?\),/g, `code: CodeBlock as any,
                  pre: ({ children }: any) => <>{children}</>,`);


fs.writeFileSync('components/chat/message-bubble.tsx', code);
