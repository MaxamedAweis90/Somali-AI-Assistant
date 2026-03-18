import { MotionCard, MotionSection } from "@/components/landing/scroll-motion";

const steps = [
  {
    number: "01",
    title: "Ask a question",
    description: "Start with a prompt in Somali or mixed language, whether you need learning help, writing support, or a fast explanation.",
  },
  {
    number: "02",
    title: "Garas understands the context",
    description: "The product is tuned for Somali-first clarity, so the response feels structured instead of vague or generic.",
  },
  {
    number: "03",
    title: "Get helpful answers instantly",
    description: "Receive a focused response you can keep refining, using the same clean chat flow already present in the product.",
  },
];

export function HowItWorks() {
  return (
    <MotionSection className="py-16 sm:py-20" direction="right" distance={100}>
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,31,0.92),rgba(9,20,37,0.88))] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.28)] sm:rounded-[36px] sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200/80">How It Works</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              A simple path from question to answer.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              The experience stays intentionally minimal. Users do not need onboarding complexity to get value from the first interaction.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <MotionCard
                key={step.number}
                className="grid gap-4 rounded-[24px] border border-white/10 bg-white/4 p-4 sm:grid-cols-[72px_1fr] sm:items-start sm:rounded-[28px] sm:p-6"
                direction={index === 1 ? "up" : "left"}
                distance={66}
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sm font-semibold tracking-[0.2em] text-sky-100">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{step.description}</p>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </div>
    </MotionSection>
  );
}