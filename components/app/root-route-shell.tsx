"use client";

import { usePathname } from "next/navigation";
import { z } from "zod";
import { ChatPageClient } from "@/components/chat/chat-page-client";

const chatRootPathSchema = z.string().regex(/^\/chat$/);
const conversationPathSchema = z.string().regex(/^\/chat\/c\/[^/]+$/);

export function RootRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatRoute = chatRootPathSchema.safeParse(pathname).success || conversationPathSchema.safeParse(pathname).success;

  if (!isChatRoute) {
    return <>{children}</>;
  }

  const initialConversationId = conversationPathSchema.safeParse(pathname).success
    ? pathname.split("/")[3] ?? undefined
    : undefined;

  return <ChatPageClient initialConversationId={initialConversationId} />;
}