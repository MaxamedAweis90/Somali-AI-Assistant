import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MotionSection } from "@/components/landing/scroll-motion";

export function CTA() {
  return (
    <MotionSection className="py-16 sm:py-20" direction="down" distance={84}>
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(15,23,42,0.95)_52%,rgba(16,185,129,0.12))] px-5 py-8 shadow-[0_24px_80px_rgba(2,6,23,0.28)] sm:rounded-[36px] sm:px-8 sm:py-10 lg:flex lg:items-center lg:justify-between lg:px-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Start Now</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Start exploring AI with Garas.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
            Open the chat instantly and move from idea to answer in a product experience built specifically for Somali speakers.
          </p>
        </div>

        <div className="mt-8 lg:mt-0">
          <Link
            href="/chat"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-slate-100 sm:w-auto"
          >
            Start Chatting
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </MotionSection>
  );
}