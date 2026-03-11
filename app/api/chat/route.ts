import { NextResponse } from "next/server";
import { z } from "zod";
import { AI_MODEL_IDS } from "@/lib/ai/model-catalog";
import {
  cleanMessageContent,
} from "@/lib/ai/usage-optimization";
import { generateAIResponseStream } from "@/lib/ai/ai-service";

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(16000),
      })
    )
    .min(1)
    .max(14),
  summary: z.string().trim().max(12000).optional(),
  modelId: z.enum(AI_MODEL_IDS).optional(),
  useWebSearch: z.boolean().optional(),
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

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of generateAIResponseStream({
            messages,
            summary,
            modelId: result.data.modelId,
            useWebSearch: result.data.useWebSearch,
          })) {
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          }
        } catch (error) {
          if (error instanceof Error) {
            console.error("AI provider request failed:", error.message);
          } else {
            console.error("AI provider request failed.");
          }

          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", error: FRIENDLY_AI_ERROR })}\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json({ error: "Cilad ayaa ka dhacday chat API-ga." }, { status: 500 });
  }
}