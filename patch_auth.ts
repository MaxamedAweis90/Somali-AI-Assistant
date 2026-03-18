// Append this to services/auth-service.ts

export async function updateUser({ name, username }: { name: string; username?: string }) {
  if (!isAppwriteConfigured()) {
    throw new Error(getAppwriteConfigError());
  }

  const account = getAccount();
  if (name) {
    await account.updateName(name);
  }
  
  if (username) {
     const user = await account.get();
     await account.updatePrefs({ ...user.prefs, username });
  }
  
  return account.get();
}
