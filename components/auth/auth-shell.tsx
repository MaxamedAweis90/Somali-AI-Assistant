import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  description: string;
  alternateLabel: string;
  alternateHref: Route;
  alternateText: string;
  children: ReactNode;
}

export function AuthShell({
  title,
  description,
  alternateLabel,
  alternateHref,
  alternateText,
  children,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_30px_90px_-35px_rgba(14,165,233,0.45)] backdrop-blur-xl sm:p-10">
        <div className="flex items-center gap-3">
          <div className="relative size-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Image src="/images/GARAS.png" alt="GARAS Chat logo" fill sizes="48px" className="object-contain p-1.5" priority />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">GARAS Chat</p>
            <p className="text-sm text-slate-400">Somali AI Assistant</p>
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>

        <div className="mt-8">{children}</div>

        <p className="mt-6 text-sm text-slate-400">
          {alternateLabel}{" "}
          <Link href={alternateHref} className="font-medium text-sky-300 transition hover:text-sky-200">
            {alternateText}
          </Link>
        </p>
      </section>
    </main>
  );
}