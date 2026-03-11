import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client, Databases, ID, IndexType, Permission, Role } from "node-appwrite";

const ORDER_ASC = "ASC";
const ORDER_DESC = "DESC";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const values = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).trim();
    }

    values[key] = value;
  }

  return values;
}

const localEnv = parseEnvFile(path.join(projectRoot, ".env.local"));

const endpoint = localEnv.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = localEnv.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = localEnv.APPWRITE_API_KEY;
const databaseId = localEnv.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "garas_main";
const databaseName = localEnv.APPWRITE_DATABASE_NAME || "GARAS Chat Database";
const conversationsCollectionId =
  localEnv.NEXT_PUBLIC_APPWRITE_CONVERSATIONS_COLLECTION_ID || "conversations";
const messagesCollectionId = localEnv.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || "messages";
const aiUsageLogsCollectionId =
  localEnv.NEXT_PUBLIC_APPWRITE_AI_USAGE_LOGS_COLLECTION_ID || "ai_usage_logs";

if (!endpoint || !projectId || !apiKey) {
  console.error("Appwrite setup lama bilaabi karo.");
  console.error("Hubi inaad .env.local ku dartay:");
  console.error("- NEXT_PUBLIC_APPWRITE_ENDPOINT");
  console.error("- NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  console.error("- APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function withConflictGuard(task, label) {
  try {
    return await task();
  } catch (error) {
    if (error?.code === 409) {
      console.log(`${label}: hore ayuu u jiray, waan dhaafay.`);
      return null;
    }

    throw error;
  }
}

async function ensureDatabase() {
  await withConflictGuard(() => databases.create(databaseId, databaseName, true), `Database ${databaseId}`);
}

async function ensureCollection(collectionId, name) {
  await withConflictGuard(
    () =>
      databases.createCollection(
        databaseId,
        collectionId,
        name,
        [Permission.read(Role.users()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())],
        true,
        true
      ),
    `Collection ${collectionId}`
  );
}

async function ensureStringAttribute(collectionId, key, size, required) {
  await withConflictGuard(
    () => databases.createStringAttribute(databaseId, collectionId, key, size, required),
    `Attribute ${collectionId}.${key}`
  );
}

async function ensureDatetimeAttribute(collectionId, key, required) {
  await withConflictGuard(
    () => databases.createDatetimeAttribute(databaseId, collectionId, key, required),
    `Attribute ${collectionId}.${key}`
  );
}

async function ensureIntegerAttribute(collectionId, key, required, min = undefined, max = undefined, defaultValue = undefined) {
  await withConflictGuard(
    () => databases.createIntegerAttribute(databaseId, collectionId, key, required, min, max, defaultValue),
    `Attribute ${collectionId}.${key}`
  );
}

async function ensureBooleanAttribute(collectionId, key, required, defaultValue = undefined) {
  await withConflictGuard(
    () => databases.createBooleanAttribute(databaseId, collectionId, key, required, defaultValue),
    `Attribute ${collectionId}.${key}`
  );
}

async function ensureFloatAttribute(collectionId, key, required, min = undefined, max = undefined, defaultValue = undefined) {
  await withConflictGuard(
    () => databases.createFloatAttribute(databaseId, collectionId, key, required, min, max, defaultValue),
    `Attribute ${collectionId}.${key}`
  );
}

async function waitForAttributes(collectionId, keys) {
  const pending = new Set(keys);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    for (const key of [...pending]) {
      try {
        const attribute = await databases.getAttribute(databaseId, collectionId, key);

        if (attribute.status === "available") {
          pending.delete(key);
        }
      } catch {
        // Wait for the attribute to become visible.
      }
    }

    if (pending.size === 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error(`Attributes-ka wali ma diyaar noqon collection ${collectionId}: ${[...pending].join(", ")}`);
}

async function ensureIndex(collectionId, key, attributes, orders = undefined) {
  await withConflictGuard(
    () => databases.createIndex(databaseId, collectionId, key, IndexType.Key, attributes, orders),
    `Index ${collectionId}.${key}`
  );
}

async function setupConversationsCollection() {
  await ensureCollection(conversationsCollectionId, "Conversations");

  await ensureStringAttribute(conversationsCollectionId, "userId", 64, true);
  await ensureStringAttribute(conversationsCollectionId, "title", 255, true);
  await ensureStringAttribute(conversationsCollectionId, "summary", 5000, false);
  await ensureIntegerAttribute(conversationsCollectionId, "messageCount", false, 0, 100000);
  await ensureDatetimeAttribute(conversationsCollectionId, "createdAt", true);
  await ensureDatetimeAttribute(conversationsCollectionId, "updatedAt", true);

  await waitForAttributes(conversationsCollectionId, ["userId", "title", "summary", "messageCount", "createdAt", "updatedAt"]);

  await ensureIndex(conversationsCollectionId, "conversation_user_updated", ["userId", "updatedAt"], [ORDER_ASC, ORDER_DESC]);
}

async function setupMessagesCollection() {
  await ensureCollection(messagesCollectionId, "Messages");

  await ensureStringAttribute(messagesCollectionId, "userId", 64, true);
  await ensureStringAttribute(messagesCollectionId, "conversationId", 64, true);
  await ensureStringAttribute(messagesCollectionId, "role", 32, true);
  await ensureStringAttribute(messagesCollectionId, "content", 20000, true);
  await ensureBooleanAttribute(messagesCollectionId, "grounded", false);
  await ensureStringAttribute(messagesCollectionId, "sourcesJson", 12000, false);
  await ensureIntegerAttribute(messagesCollectionId, "tokenEstimate", false, 0, 100000);
  await ensureDatetimeAttribute(messagesCollectionId, "createdAt", true);

  await waitForAttributes(messagesCollectionId, ["userId", "conversationId", "role", "content", "grounded", "sourcesJson", "tokenEstimate", "createdAt"]);

  await ensureIndex(messagesCollectionId, "message_conversation_created", ["conversationId", "createdAt"], [ORDER_ASC, ORDER_DESC]);
  await ensureIndex(messagesCollectionId, "message_user_created", ["userId", "createdAt"], [ORDER_ASC, ORDER_DESC]);
}

async function setupAiUsageLogsCollection() {
  await ensureCollection(aiUsageLogsCollectionId, "AI Usage Logs");

  await ensureStringAttribute(aiUsageLogsCollectionId, "conversationId", 64, false);
  await ensureStringAttribute(aiUsageLogsCollectionId, "userId", 64, true);
  await ensureStringAttribute(aiUsageLogsCollectionId, "provider", 32, false);
  await ensureStringAttribute(aiUsageLogsCollectionId, "model", 100, true);
  await ensureIntegerAttribute(aiUsageLogsCollectionId, "inputTokens", true, 0, 1000000);
  await ensureIntegerAttribute(aiUsageLogsCollectionId, "outputTokens", true, 0, 1000000);
  await ensureFloatAttribute(aiUsageLogsCollectionId, "estimatedCost", true, 0, 1000000);
  await ensureDatetimeAttribute(aiUsageLogsCollectionId, "createdAt", true);
  await ensureDatetimeAttribute(aiUsageLogsCollectionId, "timestamp", false);

  await waitForAttributes(aiUsageLogsCollectionId, [
    "conversationId",
    "userId",
    "provider",
    "model",
    "inputTokens",
    "outputTokens",
    "estimatedCost",
    "createdAt",
    "timestamp",
  ]);

  await ensureIndex(aiUsageLogsCollectionId, "usage_user_created", ["userId", "createdAt"], [ORDER_ASC, ORDER_DESC]);
  await ensureIndex(aiUsageLogsCollectionId, "usage_conversation_created", ["conversationId", "createdAt"], [ORDER_ASC, ORDER_DESC]);
}

async function main() {
  console.log("Appwrite setup ayaa bilaabanaya...");
  await ensureDatabase();
  await setupConversationsCollection();
  await setupMessagesCollection();
  await setupAiUsageLogsCollection();

  console.log("\nAppwrite setup waa dhammaaday.");
  console.log(`Database: ${databaseId}`);
  console.log(`Collections: ${conversationsCollectionId}, ${messagesCollectionId}, ${aiUsageLogsCollectionId}`);
  console.log("Hadda waxaad u gudbi kartaa conversation persistence step-ka.");
}

main().catch((error) => {
  console.error("Appwrite setup wuu fashilmay.");
  console.error(error?.message ?? error);
  process.exit(1);
});