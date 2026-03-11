import { ID, Permission, Query, Role, type Models } from "appwrite";
import { appwriteConfig, getAppwriteConfigError, getDatabases, isAppwriteConfigured } from "@/lib/appwrite/client";
import { estimateTokenCount } from "@/lib/ai/usage-optimization";
import { getCurrentUser } from "@/services/auth-service";
import type { ChatConversation, ChatMessage, ChatSource } from "@/types/chat";

const STORED_CONVERSATION_LIMIT = 100;
const STORED_MESSAGE_LIMIT = 500;

type ConversationDocument = Models.Document & {
  userId: string;
  title: string;
  summary?: string;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
};

type MessageDocument = Models.Document & {
  userId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  grounded?: boolean;
  sourcesJson?: string;
  tokenEstimate?: number;
  createdAt: string;
};

type AiUsageLogDocument = Models.Document & {
  conversationId?: string;
  userId: string;
  provider?: "gemini" | "openai";
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  createdAt: string;
  timestamp?: string;
};

function requireDatabases() {
  if (!isAppwriteConfigured()) {
    throw new Error(getAppwriteConfigError());
  }

  return getDatabases();
}

function buildDocumentPermissions(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

function formatRelativeSomali(dateString: string) {
  const timestamp = new Date(dateString).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "Hadda";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} daqiiqo kahor`;
  }

  if (diffHours < 24) {
    return `${diffHours} saac kahor`;
  }

  if (diffDays === 1) {
    return "Shalay";
  }

  return `${diffDays} maalmood kahor`;
}

function toConversation(document: ConversationDocument): ChatConversation {
  return {
    id: document.$id,
    title: document.title,
    updatedAt: formatRelativeSomali(document.updatedAt),
    summary: document.summary ?? "",
    messageCount: typeof document.messageCount === "number" ? document.messageCount : 0,
  };
}

function parseStoredSources(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as ChatSource[];

    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed.filter((source) =>
      Boolean(source && typeof source.title === "string" && typeof source.url === "string" && typeof source.domain === "string")
    );
  } catch {
    return undefined;
  }
}

function serializeStoredSources(sources: ChatSource[] | undefined) {
  if (!sources || sources.length === 0) {
    return "";
  }

  return JSON.stringify(sources.slice(0, 6));
}

function toMessage(document: MessageDocument): ChatMessage {
  return {
    id: document.$id,
    role: document.role,
    content: document.content,
    createdAt: document.createdAt,
    tokenEstimate: typeof document.tokenEstimate === "number" ? document.tokenEstimate : 0,
    grounded: Boolean(document.grounded),
    sources: parseStoredSources(document.sourcesJson),
  };
}

function createConversationTitle(text: string) {
  const normalized = text
    .replace(/[#>*_`~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "Chat cusub";
  }

  const firstSentence = normalized.split(/[.!?\n]/).find((segment) => segment.trim().length > 0)?.trim() ?? normalized;
  const words = firstSentence.split(" ").filter(Boolean);
  const conciseTitle = words.slice(0, 5).join(" ");
  const title = conciseTitle || firstSentence;

  return title.length <= 56 ? title : `${title.slice(0, 56).trim()}...`;
}

async function requireCurrentUserId() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Fadlan marka hore soo gal.");
  }

  return user.$id;
}

async function getOwnedConversationDocument(conversationId: string) {
  const userId = await requireCurrentUserId();
  const databases = requireDatabases();
  const document = await databases.getDocument<ConversationDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.conversationsCollectionId,
    conversationId
  );

  if (document.userId !== userId) {
    throw new Error("Conversation-kan adiga kuma lihid.");
  }

  return { document, userId };
}

export async function listStoredConversations() {
  const userId = await requireCurrentUserId();
  const databases = requireDatabases();

  const result = await databases.listDocuments<ConversationDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.conversationsCollectionId,
    [Query.equal("userId", userId), Query.orderDesc("updatedAt"), Query.limit(STORED_CONVERSATION_LIMIT)]
  );

  return result.documents.map(toConversation);
}

export async function listStoredMessages(conversationId: string) {
  const userId = await requireCurrentUserId();
  const databases = requireDatabases();
  const result = await databases.listDocuments<MessageDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.messagesCollectionId,
    [
      Query.equal("userId", userId),
      Query.equal("conversationId", conversationId),
      Query.orderAsc("createdAt"),
      Query.limit(STORED_MESSAGE_LIMIT),
    ]
  );

  return result.documents.map(toMessage);
}

export async function createStoredConversation(initialText: string) {
  const userId = await requireCurrentUserId();
  const databases = requireDatabases();
  const timestamp = new Date().toISOString();

  const document = await databases.createDocument<ConversationDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.conversationsCollectionId,
    ID.unique(),
    {
      userId,
      title: createConversationTitle(initialText),
      summary: "",
      messageCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    buildDocumentPermissions(userId)
  );

  return toConversation(document);
}

export async function touchStoredConversation(
  conversationId: string,
  options?: { latestUserText?: string; summary?: string; messageCount?: number }
) {
  const databases = requireDatabases();
  const data: Record<string, string | number> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof options?.summary === "string") {
    data.summary = options.summary;
  }

  if (typeof options?.messageCount === "number") {
    data.messageCount = options.messageCount;
  }

  const document = await databases.updateDocument<ConversationDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.conversationsCollectionId,
    conversationId,
    data
  );

  return toConversation(document);
}

export async function createStoredMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  options?: { grounded?: boolean; sources?: ChatSource[] }
) {
  const userId = await requireCurrentUserId();
  const databases = requireDatabases();
  const tokenEstimate = estimateTokenCount(content);
  const sourcesJson = serializeStoredSources(options?.sources);
  const documentData = {
    userId,
    conversationId,
    role,
    content,
    grounded: Boolean(options?.grounded),
    sourcesJson,
    tokenEstimate,
    createdAt: new Date().toISOString(),
  };

  const fallbackDocumentData = {
    userId,
    conversationId,
    role,
    content,
    tokenEstimate,
    createdAt: documentData.createdAt,
  };

  let document: MessageDocument;

  try {
    document = await databases.createDocument<MessageDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.messagesCollectionId,
      ID.unique(),
      documentData,
      buildDocumentPermissions(userId)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!/unknown attribute|attribute not found|invalid document structure/i.test(message)) {
      throw error;
    }

    document = await databases.createDocument<MessageDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.messagesCollectionId,
      ID.unique(),
      fallbackDocumentData,
      buildDocumentPermissions(userId)
    );
  }

  return toMessage(document);
}

export async function renameStoredConversation(conversationId: string, title: string) {
  const normalizedTitle = title.trim().replace(/\s+/g, " ");

  if (!normalizedTitle) {
    throw new Error("Cinwaanka conversation-ka ma bannaanaan karo.");
  }

  await getOwnedConversationDocument(conversationId);
  const databases = requireDatabases();

  const document = await databases.updateDocument<ConversationDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.conversationsCollectionId,
    conversationId,
    {
      title: normalizedTitle.length <= 48 ? normalizedTitle : `${normalizedTitle.slice(0, 48).trim()}...`,
      updatedAt: new Date().toISOString(),
    }
  );

  return toConversation(document);
}

export async function deleteStoredConversation(conversationId: string) {
  const { userId } = await getOwnedConversationDocument(conversationId);
  const databases = requireDatabases();

  const relatedMessages = await databases.listDocuments<MessageDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.messagesCollectionId,
    [Query.equal("userId", userId), Query.equal("conversationId", conversationId), Query.limit(STORED_MESSAGE_LIMIT)]
  );

  await Promise.all(
    relatedMessages.documents.map((message) =>
      databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.messagesCollectionId, message.$id)
    )
  );

  await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.conversationsCollectionId, conversationId);
}

export async function createAiUsageLog(input: {
  conversationId?: string;
  provider: "gemini" | "openai";
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}) {
  const userId = await requireCurrentUserId();
  const databases = requireDatabases();

  await databases.createDocument<AiUsageLogDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.aiUsageLogsCollectionId,
    ID.unique(),
    {
      conversationId: input.conversationId ?? "",
      userId,
      provider: input.provider,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      estimatedCost: input.estimatedCost,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    },
    buildDocumentPermissions(userId)
  );
}