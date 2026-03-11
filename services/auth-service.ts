import { AppwriteException, Models } from "appwrite";
import { getAccount, getAppwriteConfigError, ID, isAppwriteConfigured } from "@/lib/appwrite/client";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type AuthUser = Models.User<Models.Preferences>;

export async function registerWithEmail({ name, email, password }: RegisterInput) {
  if (!isAppwriteConfigured()) {
    throw new Error(getAppwriteConfigError());
  }

  const account = getAccount();
  await account.create(ID.unique(), email, password, name);
  await account.createEmailPasswordSession(email, password);
  return account.get();
}

export async function loginWithEmail({ email, password }: LoginInput) {
  if (!isAppwriteConfigured()) {
    throw new Error(getAppwriteConfigError());
  }

  const account = getAccount();
  await account.createEmailPasswordSession(email, password);
  return account.get();
}

export async function getCurrentUser() {
  if (!isAppwriteConfigured()) {
    return null;
  }

  try {
    return await getAccount().get();
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 401) {
      return null;
    }

    throw error;
  }
}

export async function logoutCurrentUser() {
  if (!isAppwriteConfigured()) {
    return;
  }

  try {
    await getAccount().deleteSession("current");
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 401) {
      return;
    }

    throw error;
  }
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AppwriteException) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Wax cilad ah ayaa dhacay. Fadlan mar kale isku day.";
}