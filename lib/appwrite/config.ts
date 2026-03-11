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

export const appwriteConfig = {
  endpoint: normalizeEnvValue(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT),
  projectId: normalizeEnvValue(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID),
  projectName: normalizeEnvValue(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME) || "garaschat",
  databaseId: normalizeEnvValue(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID) || "garas_main",
  conversationsCollectionId:
    normalizeEnvValue(process.env.NEXT_PUBLIC_APPWRITE_CONVERSATIONS_COLLECTION_ID) || "conversations",
  messagesCollectionId:
    normalizeEnvValue(process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID) || "messages",
  aiUsageLogsCollectionId:
    normalizeEnvValue(process.env.NEXT_PUBLIC_APPWRITE_AI_USAGE_LOGS_COLLECTION_ID) || "ai_usage_logs",
};

export function isAppwriteConfigured() {
  return Boolean(appwriteConfig.endpoint && appwriteConfig.projectId);
}

export function getAppwriteConfigError() {
  return "Ku dar NEXT_PUBLIC_APPWRITE_ENDPOINT iyo NEXT_PUBLIC_APPWRITE_PROJECT_ID gudaha .env.local si auth-ku u shaqeeyo.";
}