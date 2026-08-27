import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'bragstack.accessToken';

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token) {
  if (!token) return clearAccessToken();
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken() {
  return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
