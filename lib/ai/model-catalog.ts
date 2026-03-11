import {
  AI_DEFAULT_GEMINI_MODEL,
  AI_DEFAULT_OPENAI_MODEL,
} from "@/lib/ai/usage-optimization";

export const AI_MODEL_IDS = ["gemini-2-flash", "gemini-3-flash", "gpt-4o-mini", "gpt-4o", "qwen-img"] as const;
export type AIModelId = (typeof AI_MODEL_IDS)[number];

const LEGACY_MODEL_ID_ALIASES = {
  "gemini-flash": "gemini-2-flash",
  "gemini-pro": "gemini-3-flash",
} as const satisfies Record<string, AIModelId>;

export type AIProvider = "gemini" | "openai";
export type AIToolMode = "chat" | "image";
export type AIModelStatus = "ready" | "coming-soon";

export interface AIModelOption {
  id: AIModelId;
  shortLabel: string;
  label: string;
  provider: AIProvider;
  apiModel: string;
  capability: AIToolMode;
  status: AIModelStatus;
  description: string;
  dailyLimit?: number;
}

export const AI_IMAGE_DAILY_LIMIT = 3;

export const AI_MODEL_OPTIONS: AIModelOption[] = [
  {
    id: "gemini-2-flash",
    shortLabel: "2.5 Flash",
    label: "Gemini 2.5 Flash",
    provider: "gemini",
    apiModel: "gemini-2.5-flash",
    capability: "chat",
    status: "ready",
    description: "Fast and reliable for everyday Somali chat and grounded answers, using Gemini 2.5 Flash.",
  },
  {
    id: "gemini-3-flash",
    shortLabel: "3 Flash",
    label: "Gemini 3 Flash Preview",
    provider: "gemini",
    apiModel: "gemini-3-flash-preview",
    capability: "chat",
    status: "ready",
    description: "Broader, more structured answers for heavier writing and research.",
  },
  {
    id: "gpt-4o-mini",
    shortLabel: "4o mini",
    label: "GPT-4o mini",
    provider: "openai",
    apiModel: "gpt-4o-mini",
    capability: "chat",
    status: "ready",
    description: "Balanced speed and lower cost.",
  },
  {
    id: "gpt-4o",
    shortLabel: "4o",
    label: "GPT-4o",
    provider: "openai",
    apiModel: AI_DEFAULT_OPENAI_MODEL,
    capability: "chat",
    status: "ready",
    description: "Higher quality responses when needed.",
  },
  {
    id: "qwen-img",
    shortLabel: "Qwen Img",
    label: "Qwen Image",
    provider: "openai",
    apiModel: "qwen-image",
    capability: "image",
    status: "coming-soon",
    description: "Planned image generation with a 3 images per day limit.",
    dailyLimit: AI_IMAGE_DAILY_LIMIT,
  },
];

export function normalizeAIModelId(modelId: AIModelId | string | null | undefined) {
  if (!modelId) {
    return null;
  }

  if (modelId in LEGACY_MODEL_ID_ALIASES) {
    return LEGACY_MODEL_ID_ALIASES[modelId as keyof typeof LEGACY_MODEL_ID_ALIASES];
  }

  return AI_MODEL_IDS.find((value) => value === modelId) ?? null;
}

export function getAIModelOption(modelId: AIModelId | string | null | undefined) {
  const normalizedId = normalizeAIModelId(modelId);

  if (!normalizedId) {
    return null;
  }

  return AI_MODEL_OPTIONS.find((option) => option.id === normalizedId) ?? null;
}

export function getAIModelOptions(capability?: AIToolMode) {
  return capability ? AI_MODEL_OPTIONS.filter((option) => option.capability === capability) : AI_MODEL_OPTIONS;
}

export function getDefaultChatModelId(): AIModelId {
  if (AI_DEFAULT_OPENAI_MODEL.includes("mini")) {
    return "gpt-4o-mini";
  }

  if (AI_DEFAULT_GEMINI_MODEL.includes("3") || AI_DEFAULT_GEMINI_MODEL.includes("preview")) {
    return "gemini-3-flash";
  }

  return "gemini-2-flash";
}

export function findAIModelByApiModel(apiModel: string | null | undefined) {
  if (!apiModel) {
    return null;
  }

  const normalized = apiModel.toLowerCase();

  return (
    AI_MODEL_OPTIONS.find((option) => option.apiModel.toLowerCase() === normalized) ??
    AI_MODEL_OPTIONS.find((option) => {
      if (option.id === "gemini-2-flash") {
        return normalized.includes("gemini") && normalized.includes("2") && normalized.includes("flash");
      }

      if (option.id === "gemini-3-flash") {
        return normalized.includes("gemini") && normalized.includes("3") && normalized.includes("flash");
      }

      if (option.id === "qwen-img") {
        return normalized.includes("qwen") && normalized.includes("image");
      }

      return normalized.includes(option.apiModel.toLowerCase());
    }) ??
    null
  );
}

export function getShortModelLabel(modelId: AIModelId | string | null | undefined, apiModel?: string | null) {
  return getAIModelOption(modelId)?.shortLabel ?? findAIModelByApiModel(apiModel)?.shortLabel ?? apiModel ?? "2.5 Flash";
}

export function getModelLabel(modelId: AIModelId | string | null | undefined, apiModel?: string | null) {
  return getAIModelOption(modelId)?.label ?? findAIModelByApiModel(apiModel)?.label ?? apiModel ?? "Gemini 2.5 Flash";
}