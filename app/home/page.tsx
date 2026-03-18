import { CTA } from "@/components/landing/CTA";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { UseCases } from "@/components/landing/UseCases";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#06131f] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.16),transparent_22%),linear-gradient(180deg,#06131f_0%,#081826_48%,#030712_100%)]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(90deg,rgba(14,165,233,0.10),rgba(16,185,129,0.04),transparent)] blur-3xl" />
      <div className="absolute inset-x-0 top-[38%] h-72 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_54%)] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-12 pt-8 sm:px-8 lg:px-12">
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}