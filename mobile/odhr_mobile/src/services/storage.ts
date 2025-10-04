import * as SecureStore from 'expo-secure-store';

const keys = {
  login: 'odhr_login',
  apiKey: 'odhr_api_key',
  baseUrl: 'odhr_base_url',
};

export async function saveCredentials(login: string, apiKey: string, baseUrl: string) {
  await SecureStore.setItemAsync(keys.login, login);
  await SecureStore.setItemAsync(keys.apiKey, apiKey);
  await SecureStore.setItemAsync(keys.baseUrl, baseUrl);
}

export async function getCredentials() {
  const login = await SecureStore.getItemAsync(keys.login);
  const apiKey = await SecureStore.getItemAsync(keys.apiKey);
  const baseUrl = (await SecureStore.getItemAsync(keys.baseUrl)) ?? '';
  return { login, apiKey, baseUrl };
}

export async function clearCredentials() {
  await SecureStore.deleteItemAsync(keys.login);
  await SecureStore.deleteItemAsync(keys.apiKey);
  await SecureStore.deleteItemAsync(keys.baseUrl);
}
