import Link from "next/link";
import { X } from "lucide-react";

interface AuthRequiredModalProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

export function AuthRequiredModal({ open, title, description, onClose }: AuthRequiredModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close auth prompt"
        onClick={onClose}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.78),rgba(2,6,23,0.92))] backdrop-blur-md"
      />

      <div className="relative z-10 w-full max-w-md rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,26,52,0.96),rgba(8,15,33,0.98))] p-6 shadow-[0_30px_120px_-35px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-slate-300 transition hover:bg-white/8 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-sky-400 px-4 text-sm font-medium text-slate-950 transition hover:bg-sky-300"
          >
            Samee akoon
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-4 text-sm font-medium text-slate-100 transition hover:bg-white/8"
          >
            Soo gal
          </Link>
        </div>
      </div>
    </div>
  );
}