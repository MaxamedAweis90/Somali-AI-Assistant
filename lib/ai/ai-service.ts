import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { SOMALI_SYSTEM_PROMPT } from "@/lib/ai/somali-system-prompt";
import {
  AI_DEFAULT_GEMINI_MODEL,
  AI_DEFAULT_MAX_TOKENS,
  AI_DEFAULT_OPENAI_MODEL,
  AI_DEFAULT_TEMPERATURE,
  cleanMessageContent,
  estimateTokenCount,
} from "@/lib/ai/usage-optimization";

export type AIProvider = "gemini" | "openai";

interface AIMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface AIServiceInput {
  messages: AIMessageInput[];
  summary?: string;
}

export interface AIServiceResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

const GEMINI_FALLBACK_MODELS = ["gemini-flash-latest", "gemini-2.5-flash"];
const MAX_CONTINUATION_ROUNDS = 3;
const CONTINUATION_PROMPT = "Continue exactly from where your previous answer stopped. Do not repeat earlier sentences. Finish the current thought cleanly and completely in Somali.";
const COMPLETE_END_PATTERN = /(?:[.!?…]|["'”’)]|```)$|(?:\*\*[^*]+\*\*)$/;

interface ResponsePreferences {
  guidance: string[];
  maxTokens: number;
}

function normalizeEnvValue(value: string | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getActiveProvider(): AIProvider {
  const provider = normalizeEnvValue(process.env.AI_PROVIDER) || "gemini";

  if (provider === "gemini" || provider === "openai") {
    return provider;
  }

  throw new Error("Invalid AI provider.");
}

function getLatestUserMessage(messages: AIMessageInput[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

function buildResponsePreferences(messages: AIMessageInput[]): ResponsePreferences {
  const latestUserMessage = cleanMessageContent(getLatestUserMessage(messages)).toLowerCase();
  const guidance = [
    "Jawaabta si toos ah u billow, hana ku darin hordhac ama gabagabo aan loo baahnayn.",
    "Ha ku celin codsiga user-ka, hana ku darin filler text ama hadal qurxin ah oo aan wax tar lahayn.",
    "Ha isticmaalin quotes ama headings haddii aysan si cad u faa'iideyn jawaabta.",
  ];
  let maxTokens = AI_DEFAULT_MAX_TOKENS;

  const countMatch = latestUserMessage.match(/(?:top|liis|list)\s*(\d{1,2})|(?:\b(\d{1,2})\b\s*(?:qodob|item|artist|fannaan|fanaan))/i);
  const requestedCount = Number(countMatch?.[1] ?? countMatch?.[2] ?? 0);
  const isListRequest = /\b(top|liis|list|fannaan|artist|ugu fiican|ugu caansan)\b/i.test(latestUserMessage);
  const wantsDetails = /\b(faahfaahin|sharax|dheeree|detailed|faahfaahsan|why|sabab)\b/i.test(latestUserMessage);
  const wantsBrief = /\b(kooban|gaaban|si kooban|short|brief|kaliya|only|just)\b/i.test(latestUserMessage);
  const isSimpleInfoRequest = /\b(waa maxay|maxay tahay|yaa ah|goorma|meeqa|sidee|ii sheeg|magac|tusaale)\b/i.test(latestUserMessage);

  if (isListRequest) {
    if (requestedCount > 0) {
      guidance.push(`Bixi sax ahaan ${requestedCount} qodob, ha ka badin hana ka yaraan.`);
    }

    guidance.push("Qodob kasta ka dhig hal sadar ama ugu badnaan laba sadar oo gaaban.");
    guidance.push("Ha ku darin sharaxaad dheer item kasta ilaa user-ku si gaar ah u codsado.");
    guidance.push("Ha ku darin weedho hordhac dheer sida 'waa kuwan' haddii aan loo baahnayn.");
    maxTokens = wantsDetails ? Math.min(AI_DEFAULT_MAX_TOKENS, 480) : 220;
  } else if (wantsBrief) {
    guidance.push("Jawaabta ka dhig mid aad u kooban laakiin wali waxtar leh.");
    maxTokens = 180;
  } else if (isSimpleInfoRequest && !wantsDetails) {
    guidance.push("Bixi jawaab gaaban oo si degdeg ah u gaarsiisa nuxurka ugu muhiimsan.");
    maxTokens = 240;
  } else if (!wantsDetails) {
    guidance.push("Haddii user-kuusan codsan faahfaahin, jawaabta kooban oo nuxur leh ka dhig.");
    maxTokens = Math.min(AI_DEFAULT_MAX_TOKENS, 340);
  }

  return { guidance, maxTokens };
}

function buildGeminiPrompt(messages: AIMessageInput[], summary?: string) {
  const preferences = buildResponsePreferences(messages);
  const transcript = messages
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${cleanMessageContent(message.content)}`)
    .join("\n");

  return [
    "Waa kuwan xogaha wada sheekaysiga hadda jira.",
    summary ? `Soo koobid: ${cleanMessageContent(summary)}` : null,
    "Wada sheekaysiga dhawaan:",
    transcript,
    "Ka jawaab Somali cad, saaxiibtinimo leh, oo habeysan.",
    ...preferences.guidance,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function isGeminiModelNotFoundError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /404|not found|not supported for generatecontent/i.test(message);
}

function shouldContinueFromGemini(result: Awaited<ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]>>) {
  const finishReason = result.response.candidates?.[0]?.finishReason;
  return typeof finishReason === "string" && /max_tokens/i.test(finishReason);
}

function shouldContinueFromOpenAI(finishReason: string | null | undefined) {
  return finishReason === "length";
}

function responseLooksIncomplete(content: string, outputTokens: number, maxTokens: number) {
  const trimmed = cleanMessageContent(content);

  if (!trimmed) {
    return true;
  }

  const lastLine = trimmed.split(/\n/).pop()?.trim() ?? trimmed;
  const lastToken = lastLine.split(/\s+/).filter(Boolean).pop() ?? "";
  const tokenNearLimit = outputTokens >= Math.max(80, Math.floor(maxTokens * 0.82));

  if (/```[^`]*$/.test(trimmed)) {
    return true;
  }

  if (/[:(\[{-]$/.test(trimmed)) {
    return true;
  }

  if (/^[-*]\s+\S{0,24}$/u.test(lastLine)) {
    return true;
  }

  if (/\b(?:iyo|ama|sida|marka|haddii|laakiin|because|and|or|with|for)$/i.test(trimmed)) {
    return true;
  }

  if (lastToken.length <= 2 && /[A-Za-z\p{L}]$/u.test(trimmed)) {
    return true;
  }

  if (!COMPLETE_END_PATTERN.test(trimmed) && tokenNearLimit) {
    return true;
  }

  return false;
}

function buildContinuationMessages(input: AIServiceInput, partialContent: string): AIMessageInput[] {
  return [
    ...input.messages,
    { role: "assistant", content: partialContent },
    { role: "user", content: CONTINUATION_PROMPT },
  ];
}

async function generateGeminiResponse(input: AIServiceInput): Promise<AIServiceResponse> {
  const apiKey = normalizeEnvValue(process.env.GEMINI_API_KEY);

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const preferences = buildResponsePreferences(input.messages);
  const configuredModel = normalizeEnvValue(process.env.GEMINI_MODEL) || AI_DEFAULT_GEMINI_MODEL;
  const candidateModels = [...new Set([configuredModel, AI_DEFAULT_GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS])];
  let lastError: unknown;

  for (const model of candidateModels) {
    try {
      const generativeModel = client.getGenerativeModel({
        model,
        systemInstruction: SOMALI_SYSTEM_PROMPT,
      });
      let currentMessages = input.messages;
      let combinedContent = "";
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for (let round = 0; round <= MAX_CONTINUATION_ROUNDS; round += 1) {
        const roundPrompt = buildGeminiPrompt(currentMessages, input.summary);
        const result = await generativeModel.generateContent({
          contents: [{ role: "user", parts: [{ text: roundPrompt }] }],
          generationConfig: {
            temperature: AI_DEFAULT_TEMPERATURE,
            maxOutputTokens: preferences.maxTokens,
          },
        });
        const content = result.response.text().trim();

        if (!content) {
          throw new Error("Gemini returned an empty response.");
        }

        const usage = result.response.usageMetadata;
        totalInputTokens += usage?.promptTokenCount ?? estimateTokenCount(roundPrompt);
        totalOutputTokens += usage?.candidatesTokenCount ?? estimateTokenCount(content);
        combinedContent = `${combinedContent}${combinedContent ? "\n\n" : ""}${content}`.trim();

        const needsContinuation = shouldContinueFromGemini(result) || responseLooksIncomplete(combinedContent, totalOutputTokens, preferences.maxTokens);

        if (!needsContinuation || round === MAX_CONTINUATION_ROUNDS) {
          return {
            content: combinedContent,
            provider: "gemini",
            model,
            usage: {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
            },
          };
        }

        currentMessages = buildContinuationMessages(input, combinedContent);
      }
    } catch (error) {
      lastError = error;

      if (!isGeminiModelNotFoundError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini request failed.");
}

async function generateOpenAIResponse(input: AIServiceInput): Promise<AIServiceResponse> {
  const apiKey = normalizeEnvValue(process.env.OPENAI_API_KEY);

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  const model = normalizeEnvValue(process.env.OPENAI_MODEL) || AI_DEFAULT_OPENAI_MODEL;
  const baseURL = normalizeEnvValue(process.env.OPENAI_BASE_URL) || "https://api.openai.com/v1";
  const client = new OpenAI({ apiKey, baseURL });
  const preferences = buildResponsePreferences(input.messages);
  let currentMessages = input.messages;
  let combinedContent = "";
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let round = 0; round <= MAX_CONTINUATION_ROUNDS; round += 1) {
    const completion = await client.chat.completions.create({
      model,
      temperature: AI_DEFAULT_TEMPERATURE,
      max_tokens: preferences.maxTokens,
      messages: [
        { role: "system", content: SOMALI_SYSTEM_PROMPT },
        ...(input.summary
          ? [
              {
                role: "system" as const,
                content: `Soo koobid wada sheekaysiga:\n${cleanMessageContent(input.summary)}`,
              },
            ]
          : []),
        ...preferences.guidance.map((instruction) => ({ role: "system" as const, content: instruction })),
        ...currentMessages.map((message) => ({ role: message.role, content: cleanMessageContent(message.content) })),
      ],
    });
    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("OpenAI returned an empty response.");
    }

    totalInputTokens += completion.usage?.prompt_tokens ?? 0;
    totalOutputTokens += completion.usage?.completion_tokens ?? estimateTokenCount(content);
    combinedContent = `${combinedContent}${combinedContent ? "\n\n" : ""}${content}`.trim();

    const needsContinuation =
      shouldContinueFromOpenAI(completion.choices[0]?.finish_reason) ||
      responseLooksIncomplete(combinedContent, totalOutputTokens, preferences.maxTokens);

    if (!needsContinuation || round === MAX_CONTINUATION_ROUNDS) {
      return {
        content: combinedContent,
        provider: "openai",
        model,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
      };
    }

    currentMessages = buildContinuationMessages(input, combinedContent);
  }

  throw new Error("OpenAI continuation failed.");
}

export async function generateAIResponse(input: AIServiceInput): Promise<AIServiceResponse> {
  const provider = getActiveProvider();

  if (provider === "gemini") {
    return generateGeminiResponse(input);
  }

  return generateOpenAIResponse(input);
}