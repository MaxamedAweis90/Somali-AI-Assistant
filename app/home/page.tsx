import Link from "next/link";
import { ArrowRight, Bot, Globe2, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    title: "Somali-first responses",
    description: "Wadahadal si dabiici ah ugu socda Somali, iyadoo jawaabuhu ay ahaanayaan kuwo cad oo shaqaynaya.",
    icon: Globe2,
  },
  {
    title: "Fast, focused AI help",
    description: "Ka hel caawimo degdeg ah shaqo, waxbarasho, iyo qoraallo maalinle ah adoon ku wareerin interfaces culus.",
    icon: Sparkles,
  },
  {
    title: "Accounts when you need them",
    description: "Bilow guest ahaan, kadib u gudub akoon buuxa si chats-kaaga iyo history-gaaga loo kaydiyo.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06131f] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.16),transparent_22%),linear-gradient(180deg,#06131f_0%,#081826_48%,#030712_100%)]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(90deg,rgba(14,165,233,0.10),rgba(16,185,129,0.04),transparent)] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-12 pt-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200/80">Garas</p>
            <p className="text-sm text-slate-300">Somali AI Assistant</p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
          >
            Start Chatting
            <ArrowRight className="size-4" />
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
              <Bot className="size-4" />
              AI built for Somali speakers
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Garas - Somali AI Assistant
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              A modern AI assistant built for Somali speakers. Ask questions, draft documents, plan tasks, and get clear guidance in a focused chat experience.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-300 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-200"
              >
                Start Chatting
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3 text-base font-medium text-slate-100 transition hover:bg-white/10"
              >
                Create account
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[32px] bg-[linear-gradient(135deg,rgba(56,189,248,0.20),rgba(16,185,129,0.08),transparent)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-medium text-white">Live assistant flow</p>
                  <p className="text-xs text-slate-400">Built for everyday Somali communication</p>
                </div>
                <span className="rounded-full bg-emerald-300/12 px-3 py-1 text-xs text-emerald-100">Online</span>
              </div>

              <div className="space-y-4 text-sm leading-6 text-slate-200">
                <div className="ml-auto max-w-[85%] rounded-[24px] bg-sky-300 px-4 py-3 text-slate-950">
                  Ii qor email xirfad leh oo aan shaqo ku codsanayo.
                </div>
                <div className="max-w-[90%] rounded-[24px] border border-white/10 bg-slate-950/55 px-4 py-3 text-slate-100">
                  Haa. Waxaan kuu diyaarin karaa email kooban oo xirfad leh, kadibna waan kuu turjumi karaa ama kuu habayn karaa shaqada aad rabto.
                </div>
                <div className="grid gap-3 rounded-[24px] border border-white/10 bg-[#071521] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Why teams use Garas</p>
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span>Somali clarity</span>
                    <span className="text-sky-200">92%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span>Response speed</span>
                    <span className="text-emerald-200">Fast</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span>Guest access</span>
                    <span className="text-amber-100">Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 border-t border-white/10 py-12 md:grid-cols-3">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-sky-200/80">Product</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">A focused AI workspace instead of a generic chatbot.</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              Garas keeps the experience simple: a clean chat surface, optional account-based history, and Somali-first responses for practical daily use.
            </p>
          </div>

          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="inline-flex rounded-2xl border border-sky-300/20 bg-sky-300/10 p-3 text-sky-100">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            </article>
          ))}
        </section>

        <section className="my-8 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(15,23,42,0.92))] px-6 py-8 sm:px-8 lg:flex lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Call to action</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Start your next Somali AI conversation in seconds.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Launch the chat instantly as a guest, or create an account when you want saved conversations and a persistent history.
            </p>
          </div>

          <div className="mt-6 lg:mt-0">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Start Chatting
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex sm:items-center sm:justify-between">
          <p>Garas is a modern AI assistant experience tailored for Somali speakers.</p>
          <p className="mt-3 sm:mt-0">Built with Next.js, Tailwind CSS, and multi-provider AI routing.</p>
        </footer>
      </div>
    </main>
  );
}