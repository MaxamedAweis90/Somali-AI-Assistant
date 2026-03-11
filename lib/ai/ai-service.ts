import { DynamicRetrievalMode, GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getAIModelOption, type AIModelId, type AIProvider } from "@/lib/ai/model-catalog";
import { SOMALI_SYSTEM_PROMPT } from "@/lib/ai/somali-system-prompt";
import { performExaSearch } from "@/lib/ai/exa-search";
import {
  AI_DEFAULT_GEMINI_MODEL,
  AI_DEFAULT_MAX_TOKENS,
  AI_DEFAULT_OPENAI_MODEL,
  AI_DEFAULT_TEMPERATURE,
  cleanMessageContent,
  estimateTokenCount,
} from "@/lib/ai/usage-optimization";
import type { ChatSource } from "@/types/chat";

interface AIMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface AIServiceInput {
  messages: AIMessageInput[];
  summary?: string;
  modelId?: AIModelId;
  useWebSearch?: boolean;
}

export interface AIServiceResponse {
  content: string;
  provider: AIProvider;
  model: string;
  grounded: boolean;
  responseTemplate: ResponsePreferences["template"];
  sources: ChatSource[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export type AIStreamEvent =
  | { type: "meta"; provider: AIProvider; model: string }
  | { type: "delta"; text: string }
  | {
      type: "done";
      message: string;
      provider: AIProvider;
      model: string;
      grounded: boolean;
      responseTemplate: ResponsePreferences["template"];
      sources: ChatSource[];
      usage: {
        inputTokens: number;
        outputTokens: number;
      };
    };

const GEMINI_FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-3-flash-preview"];
const MAX_CONTINUATION_ROUNDS = 3;
const CONTINUATION_PROMPT = "Continue exactly from where your previous answer stopped. Do not repeat earlier sentences. Finish the current thought cleanly and completely in Somali.";
const COMPLETE_END_PATTERN = /(?:[.!?…]|["'”’)]|```)$|(?:\*\*[^*]+\*\*)$/;

interface ResponsePreferences {
  guidance: string[];
  maxTokens: number;
  isListRequest: boolean;
  isHistoricalListRequest: boolean;
  wantsStructuredSections: boolean;
  template: "history" | "comparison" | "how-to" | "biography" | "analysis" | "general";
  requestedCount: number;
}

interface GroundingSupportMetadata {
  segment?: {
    endIndex?: number;
  };
  groundingChunkIndices?: number[];
}

interface GroundingResponseMetadata {
  groundingChunks?: Array<{ web?: { uri?: unknown; title?: unknown } }>;
  groundingSupports?: GroundingSupportMetadata[];
}

function normalizeSourceUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  return trimmed;
}

function extractDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function normalizeSourceTitle(title: unknown, url: string) {
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }

  return extractDomain(url);
}

function extractGroundingSources(response: { candidates?: Array<{ groundingMetadata?: unknown }> } | undefined) {
  const metadata = response?.candidates?.[0]?.groundingMetadata as GroundingResponseMetadata | undefined;

  const seen = new Set<string>();
  const sources: ChatSource[] = [];

  for (const chunk of metadata?.groundingChunks ?? []) {
    const url = normalizeSourceUrl(chunk?.web?.uri);

    if (!url || seen.has(url)) {
      continue;
    }

    seen.add(url);
    sources.push({
      title: normalizeSourceTitle(chunk?.web?.title, url),
      url,
      domain: extractDomain(url),
    });
  }

  return sources.slice(0, 6);
}

function applyInlineGroundingCitations(
  content: string,
  response: { candidates?: Array<{ groundingMetadata?: unknown }> } | undefined,
  sources: ChatSource[]
) {
  if (!content || sources.length === 0) {
    return content;
  }

  const metadata = response?.candidates?.[0]?.groundingMetadata as GroundingResponseMetadata | undefined;
  const chunks = metadata?.groundingChunks ?? [];
  const supports = metadata?.groundingSupports ?? [];

  if (supports.length === 0) {
    return content;
  }

  const sourceIndexByUrl = new Map(sources.map((source, index) => [source.url, index + 1]));
  const insertions = supports
    .map((support) => {
      const endIndex = support.segment?.endIndex;

      if (typeof endIndex !== "number" || endIndex <= 0 || endIndex > content.length) {
        return null;
      }

      const refs = [...new Set((support.groundingChunkIndices ?? [])
        .map((chunkIndex) => {
          const url = normalizeSourceUrl(chunks[chunkIndex]?.web?.uri);
          return url ? sourceIndexByUrl.get(url) ?? null : null;
        })
        .filter((value): value is number => typeof value === "number"))];

      if (refs.length === 0) {
        return null;
      }

      return {
        endIndex,
        citationText: refs.map((ref) => `[${ref}]`).join(""),
      };
    })
    .filter((item): item is { endIndex: number; citationText: string } => Boolean(item))
    .sort((left, right) => right.endIndex - left.endIndex);

  let citedContent = content;

  for (const insertion of insertions) {
    const before = citedContent.slice(0, insertion.endIndex);
    const after = citedContent.slice(insertion.endIndex);

    if (before.endsWith(insertion.citationText)) {
      continue;
    }

    citedContent = `${before}${insertion.citationText}${after}`;
  }

  return citedContent;
}

function shouldUseGeminiGrounding(input: AIServiceInput, provider: AIProvider) {
  return provider === "gemini" && input.useWebSearch !== false;
}

function getGeminiTools(model: string, useGrounding: boolean) {
  if (!useGrounding) {
    return undefined;
  }

  if (model.includes("1.5")) {
    return [
      {
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.3,
          },
        },
      },
    ];
  }

  return [{ googleSearch: {} }] as Array<Record<string, unknown>>;
}

function countStructuredListItems(content: string) {
  const numberedItems = content.match(/(^|\n)\s*\d+[.)]\s+/g)?.length ?? 0;
  const bulletItems = content.match(/(^|\n)\s*[-*]\s+/g)?.length ?? 0;

  return Math.max(numberedItems, bulletItems);
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

function resolveRequestedModel(modelId?: AIModelId) {
  if (modelId) {
    const selectedModel = getAIModelOption(modelId);

    if (!selectedModel || selectedModel.capability !== "chat" || selectedModel.status !== "ready") {
      throw new Error("Model-ka la doortay lama heli karo hadda.");
    }

    return selectedModel;
  }

  const activeProvider = getActiveProvider();

  if (activeProvider === "openai") {
    const configuredModel = normalizeEnvValue(process.env.OPENAI_MODEL) || AI_DEFAULT_OPENAI_MODEL;
    return getAIModelOption(configuredModel.includes("mini") ? "gpt-4o-mini" : "gpt-4o");
  }

  const configuredGeminiModel = normalizeEnvValue(process.env.GEMINI_MODEL) || AI_DEFAULT_GEMINI_MODEL;

  if (configuredGeminiModel.includes("3") || configuredGeminiModel.includes("preview")) {
    return getAIModelOption("gemini-3-flash");
  }

  return getAIModelOption("gemini-2-flash");
}

function getLatestUserMessage(messages: AIMessageInput[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
}

function detectResponseTemplate(latestUserMessage: string) {
  if (/\b(madaxweyne|president|history|taariikh|sooyaal|timeline|goorma|sanad|xukun)\b/i.test(latestUserMessage)) {
    return "history" as const;
  }

  if (/\b(compare|comparison|isku barbar dhig|farqiga|difference|vs\b|versus)\b/i.test(latestUserMessage)) {
    return "comparison" as const;
  }

  if (/\b(sidee|how to|talaabo|steps|habka|samee|build|create|qorshe)\b/i.test(latestUserMessage)) {
    return "how-to" as const;
  }

  if (/\b(yaa ah|who is|taariikh nololeed|biography|nolol|qofkan|person)\b/i.test(latestUserMessage)) {
    return "biography" as const;
  }

  if (/\b(why|sabab|sharax|explain|analysis|falanqayn|mawduuc|topic|guide|hagid)\b/i.test(latestUserMessage)) {
    return "analysis" as const;
  }

  return "general" as const;
}

function buildTemplateGuidance(template: ResponsePreferences["template"]) {
  switch (template) {
    case "history":
      return [
        "Qaabka jawaabta u samee sidan: ## Dulmar, ## Taxanaha Taariikhda ama Liiska, ## Qodobbada Muhiimka ah.",
        "Haddii ay jiraan dad ama dhacdooyin taxane leh, qor mid kasta sadar ama paragraph gaaban oo gooni ah.",
      ];
    case "comparison":
      return [
        "Qaabka jawaabta u samee sidan: ## Dulmar, ## Isku Ekaanshaha, ## Kala Duwanaanshaha, ## Kee ku habboon goorma.",
        "Marka la barbar dhigayo laba shay ama ka badan, ka dhig qodobadu kuwo si toos ah isku laaban si user-ku u arko farqiga.",
      ];
    case "how-to":
      return [
        "Qaabka jawaabta u samee sidan: ## Ujeeddo, ## Tallaabooyinka, ## Talooyin, ## Khaladaadka laga fogaado haddii ay ku habboon tahay.",
        "Marka aad bixinayso hab-raac, samee tallaabooyin isku xiran oo la fulin karo.",
      ];
    case "biography":
      return [
        "Qaabka jawaabta u samee sidan: ## Qofka, ## Taariikh Nololeed ama Asal, ## Waxqabad ama Door, ## Muhiimadda.",
        "Haddii xogtu tahay taariikh nololeed, bilow qofka iyo waxa uu caan ku yahay ka hor faahfaahinta kale.",
      ];
    case "analysis":
      return [
        "Qaabka jawaabta u samee sidan: ## Dulmar, ## Qodobbada Muhiimka ah, ## Faahfaahin, ## Gunaanad ama Talooyin.",
      ];
    default:
      return [
        "Haddii jawaabtu ka kooban tahay fikrado badan, u kala saar headings kooban iyo paragraphs gaagaaban.",
      ];
  }
}

function normalizeSpacingBetweenItems(content: string) {
  return content
    .replace(/\n(\d+[.)]\s+)/g, "\n\n$1")
    .replace(/\n([-*]\s+)/g, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeStructuredResponse(content: string, preferences: ResponsePreferences) {
  const trimmed = content.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!trimmed) {
    return trimmed;
  }

  if (/^#{1,3}\s/m.test(trimmed)) {
    return normalizeSpacingBetweenItems(trimmed);
  }

  const splitIndex = trimmed.search(/(^|\n)(\d+[.)]\s+|[-*]\s+)/m);
  const intro = splitIndex > 0 ? trimmed.slice(0, splitIndex).trim() : trimmed;
  const listBody = splitIndex > 0 ? trimmed.slice(splitIndex).trim() : "";
  const normalizedListBody = listBody ? normalizeSpacingBetweenItems(listBody) : "";
  const paragraphs = trimmed.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
  const firstParagraph = paragraphs[0] ?? trimmed;
  const restParagraphs = paragraphs.slice(1).join("\n\n").trim();

  switch (preferences.template) {
    case "history":
      return [
        "## Dulmar",
        intro || firstParagraph,
        normalizedListBody ? "## Taxanaha Taariikhda" : null,
        normalizedListBody || null,
        restParagraphs && !normalizedListBody ? "## Qodobbada Muhiimka ah" : null,
        restParagraphs && !normalizedListBody ? normalizeSpacingBetweenItems(restParagraphs) : null,
      ].filter(Boolean).join("\n\n");
    case "comparison":
      return [
        "## Dulmar",
        firstParagraph,
        "## Isbarbardhig",
        normalizeSpacingBetweenItems(restParagraphs || intro),
      ].filter(Boolean).join("\n\n");
    case "how-to":
      return [
        "## Ujeeddo",
        intro || firstParagraph,
        normalizedListBody ? "## Tallaabooyinka" : null,
        normalizedListBody || null,
        restParagraphs && normalizedListBody ? "## Talooyin" : null,
        restParagraphs && normalizedListBody ? normalizeSpacingBetweenItems(restParagraphs) : null,
      ].filter(Boolean).join("\n\n");
    case "biography":
      return [
        "## Qofka",
        firstParagraph,
        restParagraphs ? "## Faahfaahin" : null,
        restParagraphs ? normalizeSpacingBetweenItems(restParagraphs) : null,
      ].filter(Boolean).join("\n\n");
    case "analysis":
      return [
        "## Dulmar",
        firstParagraph,
        restParagraphs ? "## Faahfaahin" : null,
        restParagraphs ? normalizeSpacingBetweenItems(restParagraphs) : null,
      ].filter(Boolean).join("\n\n");
    default:
      return normalizeSpacingBetweenItems(trimmed);
  }
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
  const isListRequest = /\b(top|liis|list|fannaan|artist|ugu fiican|ugu caansan|madaxweyne|president|hoggaamiye|leader)\b/i.test(latestUserMessage);
  const isHistoricalListRequest = /\b(madaxweyne|president|hoggaamiye|leader|taariikh|history|sooyaal|xukun|sanad|years?)\b/i.test(latestUserMessage);
  const wantsDetails = /\b(faahfaahin|sharax|dheeree|detailed|faahfaahsan|why|sabab)\b/i.test(latestUserMessage);
  const wantsBrief = /\b(kooban|gaaban|si kooban|short|brief|kaliya|only|just)\b/i.test(latestUserMessage);
  const isSimpleInfoRequest = /\b(waa maxay|maxay tahay|yaa ah|goorma|meeqa|sidee|ii sheeg|magac|tusaale)\b/i.test(latestUserMessage);
  const wantsStructuredSections = /\b(sharax|explain|compare|isku barbar dhig|faahfaahin|qayb|section|topic|mawduuc|category|nooc|qorshe|plan|guide|hagid)\b/i.test(latestUserMessage) || (!wantsBrief && !isSimpleInfoRequest);
  const template = detectResponseTemplate(latestUserMessage);

  if (wantsStructuredSections) {
    guidance.push("Haddii jawaabtu leedahay dhowr fikradood ama mawduucyo kala duwan, isticmaal markdown headings iyo subheadings si akhrisku u fududaado.");
    guidance.push("Qaabeynta mudnaanta leh waa: heading gaaban, kadib sharaxaad kooban, kadib liis ama qodobo haddii loo baahdo.");
    guidance.push("Marka ay ku habboon tahay, u kala saar jawaabta qaybo sida Dulmar, Qodobbada Muhiimka ah, Faahfaahin, iyo Talooyin ama Gunaanad.");
  }

  guidance.push(...buildTemplateGuidance(template));

  if (isListRequest) {
    if (requestedCount > 0) {
      guidance.push(`Bixi sax ahaan ${requestedCount} qodob, ha ka badin hana ka yaraan.`);
    }

    guidance.push("Isticmaal liis nambaraysan oo si nadiif ah u kala caddeeya qodob kasta.");
    guidance.push("Qodob kasta ku bilow magac ama cinwaan gaaban, kadib sii hal ama laba faahfaahin oo qiimo leh.");
    guidance.push("Mudnaanta sii tayada qodob kasta halkii aad ka bixin lahayd weedho aad u gaaban oo aan wax badan tarayn.");
    guidance.push("Ha ku darin hordhac dheer; si toos ah ugu bilow liiska.");
    guidance.push("Ka dhig hal qodob halkii sadar ama paragraph gaaban, hana isku dhex darin qodobo badan hal sadar.");
    guidance.push("Haddii liisku leeyahay qaybo ama categories dabiici ah, ku kala saar subheading gaaban ka hor liiska qayb kasta.");
    guidance.push("Haddii mawduucu leeyahay liis dhammeystiran oo la yaqaan, isku day inaad soo gabagabayso liiska si aan qodob u kala go'in ama tiro kali ahi uga harin dhammaadka.");

    if (isHistoricalListRequest) {
      guidance.push("Haddii liisku yahay dad, xilal, ama dhacdooyin taariikhi ah, qaabee sida: lambarka, magaca, kadib sanadaha ama muddada xilka ee ku habboon.");
      guidance.push("Hubi in taxanaha taariikhiga ah uu kala horreeyo kii ugu horreeyay ilaa kii ugu dambeeyay haddii user-ku uusan si kale u codsan.");
      guidance.push("Ha isku darin qof iyo sanado aan la hubin; haddii xogtu hubin u baahan tahay, dooro qaab taxaddar leh oo cad.");
      guidance.push("Ha joojin liiska bartankiisa; hubi in item-ka ugu dambeeya uu dhammeystiran yahay ka hor intaadan dirin jawaabta.");
    }

    maxTokens = isHistoricalListRequest ? (wantsDetails ? 1800 : 1400) : wantsDetails ? Math.min(AI_DEFAULT_MAX_TOKENS, 1600) : 1100;
  } else if (wantsBrief) {
    guidance.push("Jawaabta ka dhig mid aad u kooban laakiin wali waxtar leh.");
    maxTokens = 280;
  } else if (isSimpleInfoRequest && !wantsDetails) {
    guidance.push("Bixi jawaab gaaban oo si degdeg ah u gaarsiisa nuxurka ugu muhiimsan.");
    maxTokens = 720;
  } else if (!wantsDetails) {
    guidance.push("Haddii user-kuusan codsan faahfaahin buuxda, jawaabta nuxur leh oo cad ka dhig.");
    maxTokens = Math.min(AI_DEFAULT_MAX_TOKENS, wantsStructuredSections ? 1400 : 1000);
  } else {
    maxTokens = Math.min(AI_DEFAULT_MAX_TOKENS, 2000);
  }

  return { guidance, maxTokens, isListRequest, isHistoricalListRequest, wantsStructuredSections, template, requestedCount };
}

function buildGeminiPrompt(messages: AIMessageInput[], summary?: string, useWebSearch?: boolean) {
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
    useWebSearch ? "Haddii jawaabtu u baahan tahay xaqiijin ama xog cusub, ku tiirso xogta aad ka hesho web-ka oo ha ku soo koobnayn xusuusta model-ka oo keliya." : null,
    useWebSearch ? "Marka aad web-ka adeegsato, diyaari jawaab si nadiif ah oo habeysan; ha keenin qodobo go'an ama kala go'ay xitaa haddii aad xog dibadda ka soo ururinayso." : null,
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

function responseLooksIncomplete(content: string, outputTokens: number, maxTokens: number, preferences?: ResponsePreferences) {
  const trimmed = cleanMessageContent(content);

  if (!trimmed) {
    return true;
  }

  const lastLine = trimmed.split(/\n/).pop()?.trim() ?? trimmed;
  const lastToken = lastLine.split(/\s+/).filter(Boolean).pop() ?? "";
  const tokenNearLimit = outputTokens >= Math.max(80, Math.floor(maxTokens * 0.82));
  const structuredItemCount = countStructuredListItems(content);

  if (/^\d+[.)]?\s*$/u.test(lastLine)) {
    return true;
  }

  if (preferences?.isListRequest) {
    if (preferences.requestedCount > 0 && structuredItemCount < preferences.requestedCount && tokenNearLimit) {
      return true;
    }

    if (structuredItemCount >= 2 && !COMPLETE_END_PATTERN.test(trimmed) && tokenNearLimit) {
      return true;
    }

    if (preferences.isHistoricalListRequest && structuredItemCount < 4 && tokenNearLimit) {
      return true;
    }
  }

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

function buildOpenAIMessages(input: AIServiceInput, preferences: ResponsePreferences, webSearchContext?: string) {
  return [
    { role: "system" as const, content: SOMALI_SYSTEM_PROMPT },
    ...(webSearchContext ? [{ role: "system" as const, content: webSearchContext }] : []),
    ...(input.summary
      ? [
          {
            role: "system" as const,
            content: `Soo koobid wada sheekaysiga:\n${cleanMessageContent(input.summary)}`,
          },
        ]
      : []),
    ...preferences.guidance.map((instruction) => ({ role: "system" as const, content: instruction })),
    ...input.messages.map((message) => ({ role: message.role, content: cleanMessageContent(message.content) })),
  ];
}

async function* streamGeminiResponse(input: AIServiceInput): AsyncGenerator<AIStreamEvent, void, void> {
  const apiKey = normalizeEnvValue(process.env.GEMINI_API_KEY);

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const preferences = buildResponsePreferences(input.messages);
  const selectedModel = resolveRequestedModel(input.modelId);
  const configuredModel = selectedModel?.provider === "gemini"
    ? selectedModel.apiModel
    : normalizeEnvValue(process.env.GEMINI_MODEL) || AI_DEFAULT_GEMINI_MODEL;
  const useGrounding = shouldUseGeminiGrounding(input, "gemini");
  const candidateModels = input.modelId
    ? [configuredModel]
    : [...new Set([configuredModel, AI_DEFAULT_GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS])];
  let lastError: unknown;

  for (const model of candidateModels) {
    try {
      const generativeModel = client.getGenerativeModel({
        model,
        systemInstruction: SOMALI_SYSTEM_PROMPT,
        tools: getGeminiTools(model, useGrounding) as never,
      });
      let currentMessages = input.messages;
      let combinedContent = "";
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let grounded = false;
      let sources: ChatSource[] = [];

      yield { type: "meta", provider: "gemini", model };

      for (let round = 0; round <= MAX_CONTINUATION_ROUNDS; round += 1) {
        const roundPrompt = buildGeminiPrompt(currentMessages, input.summary, useGrounding);
        const result = await generativeModel.generateContentStream({
          contents: [{ role: "user", parts: [{ text: roundPrompt }] }],
          generationConfig: {
            temperature: AI_DEFAULT_TEMPERATURE,
            maxOutputTokens: preferences.maxTokens,
          },
        });

        let roundContent = "";

        for await (const chunk of result.stream) {
          const text = chunk.text();

          if (!text) {
            continue;
          }

          roundContent += text;
          yield { type: "delta", text };
        }

        const finalResponse = await result.response;
        const content = roundContent.trim() || finalResponse.text().trim();

        if (!content) {
          throw new Error("Gemini returned an empty response.");
        }

        const usage = finalResponse.usageMetadata;
        const roundSources = extractGroundingSources(finalResponse);

        if (roundSources.length > 0) {
          grounded = true;
          sources = roundSources;
        }

        totalInputTokens += usage?.promptTokenCount ?? estimateTokenCount(roundPrompt);
        totalOutputTokens += usage?.candidatesTokenCount ?? estimateTokenCount(content);
        combinedContent = `${combinedContent}${combinedContent ? "\n\n" : ""}${content}`.trim();

        const needsContinuation = shouldContinueFromGemini({ response: finalResponse } as Awaited<ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]>>) || responseLooksIncomplete(combinedContent, totalOutputTokens, preferences.maxTokens, preferences);

        if (!needsContinuation || round === MAX_CONTINUATION_ROUNDS) {
          const citedMessage = grounded ? applyInlineGroundingCitations(combinedContent, finalResponse, sources) : combinedContent;
          const finalMessage = normalizeStructuredResponse(citedMessage, preferences);
          yield {
            type: "done",
            message: finalMessage,
            provider: "gemini",
            model,
            grounded,
            responseTemplate: preferences.template,
            sources,
            usage: {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
            },
          };
          return;
        }

        yield { type: "delta", text: "\n\n" };
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

async function* streamOpenAIResponse(input: AIServiceInput): AsyncGenerator<AIStreamEvent, void, void> {
  const apiKey = normalizeEnvValue(process.env.OPENAI_API_KEY);

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  const selectedModel = resolveRequestedModel(input.modelId);
  const model = selectedModel?.provider === "openai"
    ? selectedModel.apiModel
    : normalizeEnvValue(process.env.OPENAI_MODEL) || AI_DEFAULT_OPENAI_MODEL;
  const baseURL = normalizeEnvValue(process.env.OPENAI_BASE_URL) || "https://api.openai.com/v1";
  const client = new OpenAI({ apiKey, baseURL });
  const preferences = buildResponsePreferences(input.messages);
  let currentMessages = input.messages;
  let combinedContent = "";
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let webSearchContext: string | undefined;
  let sources: ChatSource[] = [];

  if (input.useWebSearch !== false) {
    const lastUserMessage = input.messages.filter(m => m.role === 'user').pop()?.content || "";
    if (lastUserMessage) {
      const searchResult = await performExaSearch(lastUserMessage);
      if (searchResult) {
        webSearchContext = searchResult.context;
        sources = searchResult.sources;
      }
    }
  }

  yield { type: "meta", provider: "openai", model };

  for (let round = 0; round <= MAX_CONTINUATION_ROUNDS; round += 1) {
    const completion = await client.chat.completions.create({
      model,
      temperature: AI_DEFAULT_TEMPERATURE,
      max_tokens: preferences.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
      messages: buildOpenAIMessages({ ...input, messages: currentMessages }, preferences, webSearchContext),
    });

    let roundContent = "";
    let finishReason: string | null | undefined;

    for await (const chunk of completion) {
      const text = chunk.choices[0]?.delta?.content ?? "";

      if (text) {
        roundContent += text;
        yield { type: "delta", text };
      }

      finishReason = chunk.choices[0]?.finish_reason ?? finishReason;

      if (chunk.usage) {
        totalInputTokens += chunk.usage.prompt_tokens ?? 0;
        totalOutputTokens += chunk.usage.completion_tokens ?? 0;
      }
    }

    const content = roundContent.trim();

    if (!content) {
      throw new Error("OpenAI returned an empty response.");
    }

    if (totalInputTokens === 0) {
      totalInputTokens += estimateTokenCount(JSON.stringify(buildOpenAIMessages({ ...input, messages: currentMessages }, preferences)));
    }

    if (totalOutputTokens === 0) {
      totalOutputTokens += estimateTokenCount(content);
    }

    combinedContent = `${combinedContent}${combinedContent ? "\n\n" : ""}${content}`.trim();

    const needsContinuation =
      shouldContinueFromOpenAI(finishReason) ||
      responseLooksIncomplete(combinedContent, totalOutputTokens, preferences.maxTokens, preferences);

    if (!needsContinuation || round === MAX_CONTINUATION_ROUNDS) {
      const finalMessage = normalizeStructuredResponse(combinedContent, preferences);
      yield {
        type: "done",
        message: finalMessage,
        provider: "openai",
        model,
        grounded: sources.length > 0,
        responseTemplate: preferences.template,
        sources: sources,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
        },
      };
      return;
    }

    yield { type: "delta", text: "\n\n" };
    currentMessages = buildContinuationMessages(input, combinedContent);
  }

  throw new Error("OpenAI continuation failed.");
}

async function generateGeminiResponse(input: AIServiceInput): Promise<AIServiceResponse> {
  const apiKey = normalizeEnvValue(process.env.GEMINI_API_KEY);

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const preferences = buildResponsePreferences(input.messages);
  const selectedModel = resolveRequestedModel(input.modelId);
  const configuredModel = selectedModel?.provider === "gemini"
    ? selectedModel.apiModel
    : normalizeEnvValue(process.env.GEMINI_MODEL) || AI_DEFAULT_GEMINI_MODEL;
  const useGrounding = shouldUseGeminiGrounding(input, "gemini");
  const candidateModels = input.modelId
    ? [configuredModel]
    : [...new Set([configuredModel, AI_DEFAULT_GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS])];
  let lastError: unknown;

  for (const model of candidateModels) {
    try {
      const generativeModel = client.getGenerativeModel({
        model,
        systemInstruction: SOMALI_SYSTEM_PROMPT,
        tools: getGeminiTools(model, useGrounding) as never,
      });
      let currentMessages = input.messages;
      let combinedContent = "";
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let grounded = false;
      let sources: ChatSource[] = [];

      for (let round = 0; round <= MAX_CONTINUATION_ROUNDS; round += 1) {
        const roundPrompt = buildGeminiPrompt(currentMessages, input.summary, useGrounding);
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
        const roundSources = extractGroundingSources(result.response);

        if (roundSources.length > 0) {
          grounded = true;
          sources = roundSources;
        }

        totalInputTokens += usage?.promptTokenCount ?? estimateTokenCount(roundPrompt);
        totalOutputTokens += usage?.candidatesTokenCount ?? estimateTokenCount(content);
        combinedContent = `${combinedContent}${combinedContent ? "\n\n" : ""}${content}`.trim();

        const needsContinuation = shouldContinueFromGemini(result) || responseLooksIncomplete(combinedContent, totalOutputTokens, preferences.maxTokens, preferences);

        if (!needsContinuation || round === MAX_CONTINUATION_ROUNDS) {
          const citedMessage = grounded ? applyInlineGroundingCitations(combinedContent, result.response, sources) : combinedContent;
          const finalMessage = normalizeStructuredResponse(citedMessage, preferences);
          return {
            content: finalMessage,
            provider: "gemini",
            model,
            grounded,
            responseTemplate: preferences.template,
            sources,
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

  const selectedModel = resolveRequestedModel(input.modelId);
  const model = selectedModel?.provider === "openai"
    ? selectedModel.apiModel
    : normalizeEnvValue(process.env.OPENAI_MODEL) || AI_DEFAULT_OPENAI_MODEL;
  const baseURL = normalizeEnvValue(process.env.OPENAI_BASE_URL) || "https://api.openai.com/v1";
  const client = new OpenAI({ apiKey, baseURL });
  const preferences = buildResponsePreferences(input.messages);
  let currentMessages = input.messages;
  let combinedContent = "";
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let webSearchContext: string | undefined;
  let sources: ChatSource[] = [];

  if (input.useWebSearch !== false) {
    const lastUserMessage = input.messages.filter(m => m.role === 'user').pop()?.content || "";
    if (lastUserMessage) {
      const searchResult = await performExaSearch(lastUserMessage);
      if (searchResult) {
        webSearchContext = searchResult.context;
        sources = searchResult.sources;
      }
    }
  }

  for (let round = 0; round <= MAX_CONTINUATION_ROUNDS; round += 1) {
    const completion = await client.chat.completions.create({
      model,
      temperature: AI_DEFAULT_TEMPERATURE,
      max_tokens: preferences.maxTokens,
      messages: buildOpenAIMessages({ ...input, messages: currentMessages }, preferences, webSearchContext),
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
      responseLooksIncomplete(combinedContent, totalOutputTokens, preferences.maxTokens, preferences);

    if (!needsContinuation || round === MAX_CONTINUATION_ROUNDS) {
      return {
        content: normalizeStructuredResponse(combinedContent, preferences),
        provider: "openai",
        model,
        grounded: sources.length > 0,
        responseTemplate: preferences.template,
        sources: sources,
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
  const selectedModel = resolveRequestedModel(input.modelId);
  const provider = selectedModel?.provider ?? getActiveProvider();

  if (provider === "gemini") {
    return generateGeminiResponse(input);
  }

  return generateOpenAIResponse(input);
}

export async function* generateAIResponseStream(input: AIServiceInput): AsyncGenerator<AIStreamEvent, void, void> {
  const selectedModel = resolveRequestedModel(input.modelId);
  const provider = selectedModel?.provider ?? getActiveProvider();

  if (provider === "gemini") {
    yield* streamGeminiResponse(input);
    return;
  }

  yield* streamOpenAIResponse(input);
}
