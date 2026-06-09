import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_STORAGE_KEY = 'ssiren.accessToken';
let runtimeAccessToken: string | null = null;

function getDevMachineHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    null;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(':')[0];
}

function isLocalhostUrl(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const devHost = getDevMachineHost();

  // Expo Go(실기기): localhost는 폰 자신을 가리켜 API 호출이 실패함 → Metro PC IP 사용
  if (__DEV__ && Platform.OS !== 'web' && devHost) {
    if (!configured || isLocalhostUrl(configured)) {
      return `http://${devHost}:8080`;
    }
  }

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }

  return 'http://localhost:8080';
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setApiAccessToken(accessToken: string | null) {
  runtimeAccessToken = accessToken;
}

async function getAccessToken() {
  if (runtimeAccessToken) {
    return runtimeAccessToken;
  }

  const envAccessToken = process.env.EXPO_PUBLIC_API_ACCESS_TOKEN?.trim();
  if (envAccessToken) {
    return envAccessToken;
  }

  if (Platform.OS === 'web') {
    return null;
  }

  const storedAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_STORAGE_KEY);
  runtimeAccessToken = storedAccessToken;
  return storedAccessToken;
}

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
