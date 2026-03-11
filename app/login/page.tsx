"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getAppwriteConfigError, isAppwriteConfigured } from "@/lib/appwrite/client";
import { getAuthErrorMessage, getCurrentUser, loginWithEmail } from "@/services/auth-service";

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
        <Link href="/" className="font-medium text-sky-300 hover:text-sky-200">
          bogga hore
        </Link>
        .
      </div>
    </AuthShell>
  );
}