import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 sm:flex sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-semibold text-white">Garas</p>
        <p className="mt-1 text-sm text-slate-400">Somali AI Assistant</p>
      </div>

      <nav className="mt-4 flex items-center gap-6 text-sm text-slate-400 sm:mt-0">
        <Link href="/home" className="transition hover:text-white">
          Home
        </Link>
        <Link href="/chat" className="transition hover:text-white">
          Chat
        </Link>
      </nav>
    </footer>
  );
}