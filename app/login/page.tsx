"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getAppwriteConfigError, isAppwriteConfigured } from "@/lib/appwrite/client";
import { getAuthErrorMessage, getCurrentUser, loginWithEmail, loginWithGoogle } from "@/services/auth-service";

const loginSchema = z.object({
  email: z.email("Geli email sax ah."),
  password: z.string().min(8, "Password-ku ugu yaraan waa 8 xaraf."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    void getCurrentUser()
      .then((user) => {
        if (isMounted && user) {
          router.replace("/chat");
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [router]);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);

    const result = loginSchema.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          setError(field, { message: issue.message });
        }
      });
      return;
    }

    startTransition(() => {
      void loginWithEmail(result.data)
        .then(() => {
          router.replace("/chat");
          router.refresh();
        })
        .catch((error) => {
          setFormError(getAuthErrorMessage(error));
        });
    });
  });

  const configError = isAppwriteConfigured() ? null : getAppwriteConfigError();

  return (
    <AuthShell
      title="Soo gal"
      description="Ku gal GARAS Chat si aad u bilowdo wada sheekaysiga Somali AI Assistant-ka."
      alternateLabel="Akoon ma lihid?"
      alternateHref="/register"
      alternateText="Is diiwaangeli"
    >
      <div className="space-y-4">
        <Button
          type="button"
          disabled={isPending || Boolean(configError)}
          onClick={() => {
            setFormError(null);
            startTransition(() => {
              void loginWithGoogle("/chat").catch((error) => {
                setFormError(getAuthErrorMessage(error));
              });
            });
          }}
          className="h-12 w-full justify-center gap-3 rounded-2xl !border-slate-200 !bg-white text-[0.95rem] font-semibold !text-slate-900 shadow-sm transition hover:!bg-slate-50 hover:!text-slate-900 disabled:hover:!bg-white dark:!bg-white dark:hover:!bg-slate-50"
        >
          <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.72 1.22 9.22 3.62l6.9-6.9C35.92 2.38 30.33 0 24 0 14.64 0 6.56 5.38 2.62 13.22l8.02 6.22C12.51 13.28 17.8 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.5 24.5c0-1.64-.15-3.22-.42-4.76H24v9.02h12.64c-.55 2.97-2.2 5.49-4.69 7.19l7.2 5.58c4.21-3.88 6.65-9.6 6.65-16.03z"
            />
            <path
              fill="#FBBC05"
              d="M10.64 28.56c-.48-1.46-.76-3.01-.76-4.56s.28-3.1.76-4.56l-8.02-6.22C.93 16.56 0 20.16 0 24c0 3.84.93 7.44 2.62 10.78l8.02-6.22z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.33 0 11.65-2.09 15.53-5.67l-7.2-5.58c-2 1.34-4.56 2.13-8.33 2.13-6.2 0-11.49-3.78-13.36-8.94l-8.02 6.22C6.56 42.62 14.64 48 24 48z"
            />
          </svg>
          <span>Ku gal Google</span>
        </Button>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-white/10" />
          <span>Ama</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
            placeholder="magac@example.com"
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-rose-300">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
            placeholder="ugu yaraan 8 xaraf"
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-rose-300">{errors.password.message}</p>}
        </div>

        {configError && <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">{configError}</p>}
        {formError && <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{formError}</p>}

        <Button type="submit" disabled={isPending || Boolean(configError)} className="h-12 w-full rounded-2xl bg-sky-400 text-slate-950 hover:bg-sky-300">
          {isPending ? "Sug..." : "Gal akoonka"}
        </Button>
      </form>

      <div className="mt-5 text-sm text-slate-400">
        Ama ku laabo{" "}
        <Link href="/home" className="font-medium text-sky-300 hover:text-sky-200">
          bogga hore
        </Link>
        .
      </div>
    </AuthShell>
  );
}