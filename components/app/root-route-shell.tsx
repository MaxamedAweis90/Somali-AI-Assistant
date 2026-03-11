"use client";

import { usePathname } from "next/navigation";
import { z } from "zod";
import { ChatPageClient } from "@/components/chat/chat-page-client";

const conversationPathSchema = z.string().regex(/^\/c\/[^/]+$/);

export function RootRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatRoute = pathname === "/" || pathname === "/chat" || conversationPathSchema.safeParse(pathname).success;

  if (!isChatRoute) {
    return <>{children}</>;
  }

  const initialConversationId = conversationPathSchema.safeParse(pathname).success
    ? pathname.split("/")[2] ?? undefined
    : undefined;

  return <ChatPageClient initialConversationId={initialConversationId} />;
}