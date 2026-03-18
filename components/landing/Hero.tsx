import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, MessageSquareText, Sparkles, Stars } from "lucide-react";
import { FloatingAccent, MotionCard, MotionSection } from "@/components/landing/scroll-motion";

const proofPoints = [
  "Somali-first guidance",
  "Guest mode ready",
  "Focused chat workflow",
];

const metrics = [
  { label: "Somali clarity", value: "Natural" },
  { label: "Response flow", value: "Instant" },
  { label: "Chat setup", value: "1 click" },
];

export function Hero() {
  return (
    <section className="relative pb-16 pt-2 lg:pb-24">
      <FloatingAccent
        className="hidden sm:block right-[6%] top-24 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.28),rgba(56,189,248,0.02)_70%)] blur-2xl"
        x={[0, 16, -12, 0]}
        y={[0, -18, 12, 0]}
        rotate={[0, 6, -5, 0]}
        duration={14}
      />
      <FloatingAccent
        className="hidden sm:block left-[4%] top-[48%] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22),rgba(16,185,129,0.02)_72%)] blur-2xl"
        x={[0, -12, 8, 0]}
        y={[0, 14, -10, 0]}
        rotate={[0, -4, 4, 0]}
        duration={16}
        delay={1.2}
      />
      <header className="sticky top-3 z-40 flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-[#07131f]/82 px-4 py-2.5 shadow-[0_12px_30px_rgba(2,6,23,0.22)] backdrop-blur-xl sm:top-4 sm:gap-4 sm:rounded-full sm:px-5 sm:py-3 lg:top-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200/80">Garas</p>
          <p className="text-xs text-slate-300 sm:text-sm">Somali AI Assistant</p>
        </div>

        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/20 bg-sky-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 sm:gap-2 sm:px-4"
        >
          <span className="sm:hidden">Chat</span>
          <span className="hidden sm:inline">Start Chatting</span>
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <MotionSection className="grid items-center gap-10 py-10 sm:gap-12 sm:py-12 lg:grid-cols-[1.2fr_0.8fr] lg:py-20" direction="up" distance={72}>
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3.5 py-2 text-xs text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.12)] sm:px-4 sm:text-sm">
            <Bot className="size-4" />
            AI built for Somali speakers
          </div>

          <h1 className="mt-7 max-w-4xl text-[2.65rem] font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
            Garas makes AI feel native, useful, and clear in Somali.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-xl sm:leading-8">
            The first modern AI assistant designed for Somali speakers. Ask questions, learn faster, draft better, and explore ideas in a calm product experience instead of a noisy chatbot.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-300 px-6 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-sky-200 sm:px-6"
            >
              Start Chatting
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3.5 text-base font-medium text-slate-100 transition hover:bg-white/10 sm:px-6"
            >
              Learn More
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-2.5 sm:mt-10 sm:gap-3">
            {proofPoints.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-slate-200 backdrop-blur sm:px-4 sm:text-sm"
              >
                <CheckCircle2 className="size-4 text-emerald-200" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-3 sm:mt-12 sm:gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-[24px] border border-white/10 bg-white/4 px-4 py-3.5 backdrop-blur sm:px-5 sm:py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{metric.label}</p>
                <p className="mt-2 text-xl font-semibold text-white sm:mt-3 sm:text-2xl">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[40px] bg-[linear-gradient(135deg,rgba(56,189,248,0.20),rgba(16,185,129,0.08),transparent)] blur-2xl" />
          <MotionCard className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/6 p-5 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:rounded-[36px] sm:p-7" direction="right" distance={64}>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-medium text-white">Live assistant flow</p>
                <p className="text-xs text-slate-400">A cleaner AI experience for Somali conversations</p>
              </div>
              <span className="rounded-full bg-emerald-300/12 px-3 py-1 text-xs text-emerald-100">Online</span>
            </div>

            <div className="mt-6 space-y-4 text-sm leading-6 text-slate-200">
              <div className="ml-auto max-w-[86%] rounded-[26px] bg-sky-300 px-4 py-3.5 text-slate-950 shadow-[0_12px_30px_rgba(125,211,252,0.18)]">
                Iga caawi inaan si degdeg ah u fahmo mawduucan, kadibna i sii sharaxaad Somali ah oo kooban.
              </div>

              <div className="max-w-[92%] rounded-[26px] border border-white/10 bg-slate-950/55 px-4 py-3.5 text-slate-100">
                Waa hagaag. Waxaan kuu kala saari karaa qodobbada muhiimka ah, waxaan kuu soo koobayaa Somali cad, kadibna waxaan ku siin karaa tusaalooyin fudud.
              </div>

              <div className="grid gap-3 rounded-[24px] border border-white/10 bg-[#071521] p-4 sm:rounded-[26px]">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Product signals</p>
                  <Stars className="size-4 text-sky-200" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-sky-100">
                      <MessageSquareText className="size-4" />
                      <span className="text-sm font-medium">Somali-ready answers</span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-400">
                      Clear wording for study, writing, translations, and everyday problem solving.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-emerald-100">
                      <Sparkles className="size-4" />
                      <span className="text-sm font-medium">Focused workflow</span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-slate-400">
                      Minimal interface, fast replies, and a clear path from first prompt to final answer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </MotionCard>

          <MotionCard className="relative mt-4 max-w-full rounded-[24px] border border-white/10 bg-[#08111f]/90 px-4 py-3 shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur sm:max-w-max xl:absolute xl:-bottom-5 xl:-left-10 xl:mt-0" direction="left" distance={42}>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Built for</p>
            <p className="mt-2 text-sm font-medium text-white">Students, teams, writers, and builders</p>
          </MotionCard>
        </div>
      </MotionSection>
    </section>
  );
}