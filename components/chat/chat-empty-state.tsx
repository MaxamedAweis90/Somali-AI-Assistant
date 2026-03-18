import { Compass, Sparkles, Stars } from "lucide-react";
import type { ReactNode } from "react";

interface ChatEmptyStateProps {
  quickPrompts: string[];
  onSelectPrompt: (prompt: string) => void;
  composer?: ReactNode;
}

export function ChatEmptyState({ quickPrompts, onSelectPrompt, composer }: ChatEmptyStateProps) {
  return (
    <section className="mx-auto flex min-h-[40vh] w-full max-w-4xl flex-col items-center justify-start px-3 pb-3 text-center sm:px-4 md:min-h-[60vh] md:justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-sky-100/80 shadow-[0_0_0_1px_rgba(125,211,252,0.05)] backdrop-blur">
        <Sparkles className="size-3.5 text-sky-300" />
        Somali-first AI helper
      </div>

      <h1 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white sm:mt-6 sm:text-5xl">
        Maxaa kaa caawin karaa maanta?
      </h1>

      <p className="mt-4 max-w-2xl text-balance text-sm leading-6 text-slate-300 sm:text-base">
        Isku darka muuqaalka Copilot, Gemini, iyo ChatGPT, laakiin si deggan oo Somali ah. Qor su&#39;aashaada,
        qorshe, ama qoraal aad rabto in lagu habeeyo Af-Somali.
      </p>

      {composer ? <div className="mt-5 w-full max-w-[680px] sm:mt-6">{composer}</div> : null}

      <div className="mt-4 w-full max-w-[920px] px-1 sm:mt-5">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {quickPrompts.map((prompt, index) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSelectPrompt(prompt)}
              className="group inline-flex w-full items-center justify-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition sm:hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-sky-300/10"
            >
              {index % 2 === 0 ? (
                <Compass className="size-4 shrink-0 text-sky-300/80" />
              ) : (
                <Stars className="size-4 shrink-0 text-cyan-300/80" />
              )}
              <span className="truncate text-sm font-medium text-slate-100">{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}