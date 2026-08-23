import * as SecureStore from 'expo-secure-store';

// Tokens must only ever live in expo-secure-store. Never persist to AsyncStorage
// and never log token values, including in error paths.
const TOKEN_KEY = 'erp_mobile_auth_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
