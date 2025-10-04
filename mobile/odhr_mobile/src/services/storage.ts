import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const keys = {
  login: 'odhr_login',
  apiKey: 'odhr_api_key',
  baseUrl: 'odhr_base_url',
};

async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    // expo-secure-store is not available on web; guard with API call
    if (Platform.OS === 'web') return false;
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function setItem(key: string, value: string) {
  if (await isSecureStoreAvailable()) {
    return SecureStore.setItemAsync(key, value);
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {}
}

async function getItem(key: string): Promise<string | null> {
  if (await isSecureStoreAvailable()) {
    return SecureStore.getItemAsync(key);
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return null;
}

async function deleteItem(key: string) {
  if (await isSecureStoreAvailable()) {
    return SecureStore.deleteItemAsync(key);
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {}
}

export async function saveCredentials(login: string, apiKey: string, baseUrl: string) {
  await setItem(keys.login, login);
  await setItem(keys.apiKey, apiKey);
  await setItem(keys.baseUrl, baseUrl);
}

export async function getCredentials() {
  const login = await getItem(keys.login);
  const apiKey = await getItem(keys.apiKey);
  const baseUrl = (await getItem(keys.baseUrl)) ?? '';
  return { login, apiKey, baseUrl };
}

export async function clearCredentials() {
  await deleteItem(keys.login);
  await deleteItem(keys.apiKey);
  await deleteItem(keys.baseUrl);
}
