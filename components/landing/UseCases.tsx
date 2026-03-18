import { BookOpenText, Code2, Languages, Lightbulb } from "lucide-react";
import { MotionCard, MotionSection } from "@/components/landing/scroll-motion";

const useCases = [
  {
    title: "Students learning new topics",
    description: "Break down complex ideas into clear Somali explanations that are easier to review and remember.",
    icon: BookOpenText,
  },
  {
    title: "Developers asking coding questions",
    description: "Use Garas to reason through implementation ideas, debugging, and technical concepts with faster iteration.",
    icon: Code2,
  },
  {
    title: "General knowledge and explanations",
    description: "Get concise answers for everyday questions, summaries, and practical guidance without extra clutter.",
    icon: Lightbulb,
  },
  {
    title: "Quick Somali translations",
    description: "Move between Somali and other languages for writing, communication, and short-form content work.",
    icon: Languages,
  },
];

export function UseCases() {
  return (
    <MotionSection className="py-16 sm:py-20" direction="up" distance={94}>
      <div className="flex flex-col gap-4 sm:max-w-2xl">
        <p className="text-xs uppercase tracking-[0.28em] text-sky-200/80">Use Cases</p>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
          Built for real Somali-language workflows.
        </h2>
        <p className="text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
          The product story becomes stronger when users can immediately see where Garas fits into daily work, study, and communication.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {useCases.map(({ title, description, icon: Icon }, index) => (
          <MotionCard
            key={title}
            className="group rounded-[24px] border border-white/10 bg-white/4 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/6 sm:rounded-[28px] sm:p-6"
            direction={index % 2 === 0 ? "left" : "right"}
            distance={68}
          >
            <div className="inline-flex rounded-2xl border border-white/10 bg-white/6 p-3 text-sky-100 transition group-hover:border-sky-300/20 group-hover:bg-sky-300/10">
              <Icon className="size-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
          </MotionCard>
        ))}
      </div>
    </MotionSection>
  );
}