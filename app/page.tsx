import { headers } from "next/headers";
import { redirect } from "next/navigation";

function resolveHostname(hostHeader: string | null) {
  return hostHeader?.split(":")[0].toLowerCase() ?? "";
}

type AppVariant = "auto" | "landing" | "chat";

function resolveAppVariant(value: string | undefined): AppVariant {
  const normalized = (value ?? "auto").trim().toLowerCase();
  if (normalized === "landing" || normalized === "chat") return normalized;
  return "auto";
}

export default async function IndexPage() {
  const headerStore = await headers();
  const hostname = resolveHostname(headerStore.get("x-forwarded-host") ?? headerStore.get("host"));

  const variant = resolveAppVariant(process.env.APP_VARIANT);
  if (variant === "chat") redirect("/chat");
  if (variant === "landing") redirect("/home");

  const isChatHostname = hostname.startsWith("chat.") || hostname.startsWith("chat-");
  redirect(isChatHostname ? "/chat" : "/home");
}
