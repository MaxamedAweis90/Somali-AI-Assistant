import { Globe2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { MotionCard, MotionSection } from "@/components/landing/scroll-motion";

const features = [
  {
    title: "Speak Somali naturally",
    description:
      "Garas is shaped around Somali communication so the experience feels direct, readable, and useful from the first message.",
    icon: Globe2,
  },
  {
    title: "Fast AI responses",
    description:
      "Get answers quickly for learning, writing, planning, and everyday tasks without waiting through a bloated interface.",
    icon: Zap,
  },
  {
    title: "Simple and clean",
    description:
      "The product stays focused on the conversation itself, so users can ask, refine, and move forward with less friction.",
    icon: Sparkles,
  },
  {
    title: "Future ready",
    description:
      "Garas is designed to expand into stronger research, translation, and productivity workflows as the platform grows.",
    icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <MotionSection id="features" className="border-t border-white/10 py-16 sm:py-20" direction="left" distance={104}>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-200/80">Features</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            A modern Somali AI product, not just a basic prompt box.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            The landing experience now explains the product faster and with more trust signals, while keeping the restrained premium direction already present in the app.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {features.map(({ title, description, icon: Icon }, index) => (
            <MotionCard
              key={title}
              className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 backdrop-blur-xl transition hover:border-sky-300/20 hover:bg-white/[0.07] sm:rounded-[30px] sm:p-6"
              direction={index % 2 === 0 ? "up" : "right"}
              distance={70}
            >
              <div className="inline-flex rounded-2xl border border-sky-300/20 bg-sky-300/10 p-3 text-sky-100">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            </MotionCard>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}