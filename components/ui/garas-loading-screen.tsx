import Image from "next/image";
import { cn } from "@/lib/utils";

interface GarasLoadingScreenProps {
  title?: string;
  description?: string;
  tone?: "full" | "calm";
}

export function GarasLoadingScreen({
  title = "GARAS Chat",
  description = "Xogta akoonka ayaa la hubinayaa...",
  tone = "full",
}: GarasLoadingScreenProps) {
  const isCalm = tone === "calm";

  return (
    <main className={cn("relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12", isCalm && "garas-loader-fade-in")}>
      <div className="pointer-events-none absolute inset-0">
        <div className={cn("absolute left-1/2 top-[14%] h-52 w-52 -translate-x-1/2 rounded-full bg-sky-400/16 blur-3xl", isCalm ? "opacity-80" : "garas-loader-drift")} />
        <div className={cn("absolute left-[18%] top-[52%] h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl", isCalm ? "opacity-70" : "garas-loader-drift-delayed")} />
        <div className={cn("absolute right-[16%] top-[48%] h-44 w-44 rounded-full bg-blue-500/10 blur-3xl", isCalm ? "opacity-70" : "garas-loader-drift-slow")} />
      </div>

      <section className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <div className="relative flex items-center justify-center">
          <div className={cn("absolute size-28 rounded-full border border-sky-300/15", isCalm ? "opacity-60" : "garas-loader-ring")} />
          <div className={cn("absolute size-36 rounded-full border border-white/8", isCalm ? "opacity-40" : "garas-loader-ring-delay")} />
          <div className={cn("absolute size-40 rounded-full", isCalm ? "garas-loader-halo opacity-65" : "garas-loader-halo")} />

          <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-[26px] border border-white/12 bg-slate-950/72 shadow-[0_26px_70px_-34px_rgba(14,165,233,0.72)] backdrop-blur-xl">
            <div className="absolute inset-px rounded-[24px] bg-linear-to-b from-white/10 via-white/4 to-transparent" />
            <Image
              src="/images/GARAS.png"
              alt="GARAS Chat"
              width={56}
              height={56}
              priority
              className={cn("relative object-contain", isCalm ? "opacity-95" : "garas-loader-float")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold tracking-[0.18em] text-white/96 uppercase">{title}</h1>
          <p className="mx-auto max-w-72 text-sm leading-6 text-slate-300">{description}</p>
        </div>

        {isCalm ? (
          <div className="w-full max-w-44 rounded-full border border-white/8 bg-white/4 p-1 shadow-[0_0_0_1px_rgba(125,211,252,0.05)]">
            <div className="h-1.5 rounded-full bg-linear-to-r from-sky-200/70 via-sky-300/80 to-cyan-200/70" />
          </div>
        ) : (
          <div className="w-full max-w-56 space-y-3">
            <div className="overflow-hidden rounded-full border border-white/8 bg-white/4 p-1 shadow-[0_0_0_1px_rgba(125,211,252,0.05)]">
              <div className="garas-loader-bar h-1.5 rounded-full bg-linear-to-r from-sky-200/85 via-sky-400/95 to-cyan-300/85" />
            </div>

            <div className="flex justify-center gap-2">
              <span className="garas-loader-dot size-1.5 rounded-full bg-sky-200/85" />
              <span className="garas-loader-dot garas-loader-dot-delay-1 size-1.5 rounded-full bg-sky-300/80" />
              <span className="garas-loader-dot garas-loader-dot-delay-2 size-1.5 rounded-full bg-cyan-200/80" />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}