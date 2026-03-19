"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getAppwriteConfigError, isAppwriteConfigured } from "@/lib/appwrite/client";
import { getAuthErrorMessage, getCurrentUser } from "@/services/auth-service";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const next = searchParams.get("next") || "/chat";
    return next.startsWith("/") ? next : "/chat";
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    if (!isAppwriteConfigured()) {
      setError(getAppwriteConfigError());
      return;
    }

    void getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        if (!user) {
          router.replace(`/login?oauth=google_failed`);
          return;
        }

        router.replace(nextPath as never);
        router.refresh();
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(getAuthErrorMessage(err));
      });

    return () => {
      isMounted = false;
    };
  }, [nextPath, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950/60 p-8 text-center shadow-[0_30px_90px_-35px_rgba(14,165,233,0.45)] backdrop-blur-xl sm:p-10">
        <h1 className="text-xl font-semibold text-white">Soo galaya…</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Fadlan sug inta aan hubinayno akoonkaaga.
        </p>

        {error ? (
          <p className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : (
          <div className="mt-6 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-sky-300" />
          </div>
        )}
      </section>
    </main>
  );
}
