import { headers } from "next/headers";
import { redirect } from "next/navigation";

function resolveHostname(hostHeader: string | null) {
  return hostHeader?.split(":")[0].toLowerCase() ?? "";
}

export default async function IndexPage() {
  const headerStore = await headers();
  const hostname = resolveHostname(headerStore.get("x-forwarded-host") ?? headerStore.get("host"));

  redirect(hostname.startsWith("chat.") ? "/chat" : "/home");
}
