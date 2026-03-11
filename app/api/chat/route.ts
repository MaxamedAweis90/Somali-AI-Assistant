import { NextResponse } from "next/server";
import { z } from "zod";
import {
  cleanMessageContent,
} from "@/lib/ai/usage-optimization";
import { generateAIResponse } from "@/lib/ai/ai-service";

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(8000),
      })
    )
    .min(1)
    .max(5),
  summary: z.string().trim().max(5000).optional(),
});

const FRIENDLY_AI_ERROR = "Wax yar ayaa khaldamay. Fadlan isku day mar kale.";

function getLatestUserMessage(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  return [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = chatRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Request-ka chat-ka sax ma aha." }, { status: 400 });
    }

    const messages = result.data.messages.map((message) => ({
      role: message.role,
      content: cleanMessageContent(message.content),
    }));
    const summary = result.data.summary ? cleanMessageContent(result.data.summary) : "";
    const latestUserMessage = getLatestUserMessage(messages);

    if (!latestUserMessage) {
      return NextResponse.json({ error: "Fariinta user-ka lama helin." }, { status: 400 });
    }

    let providerError: string | null = null;

    try {
      const providerReply = await generateAIResponse({ messages, summary });

      return NextResponse.json({
        message: providerReply.content,
        mode: "provider",
        provider: providerReply.provider,
        model: providerReply.model,
        usage: providerReply.usage,
      });
    } catch (error) {
      providerError = FRIENDLY_AI_ERROR;

      if (error instanceof Error) {
        console.error("AI provider request failed:", error.message);
      } else {
        console.error("AI provider request failed.");
      }
    }

    return NextResponse.json({
      message: FRIENDLY_AI_ERROR,
      mode: "fallback",
      provider: "fallback",
      model: null,
      providerError,
      usage: null,
    });
  } catch {
    return NextResponse.json({ error: "Cilad ayaa ka dhacday chat API-ga." }, { status: 500 });
  }
}