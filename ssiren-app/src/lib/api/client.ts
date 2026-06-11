import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const ACCESS_TOKEN_STORAGE_KEY = 'ssiren.accessToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'ssiren.refreshToken';

let runtimeAccessToken: string | null = null;
let refreshTokenRequest: Promise<string | null> | null = null;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type TokenRefreshResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  isNewUser: boolean;
};

type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

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

  // Expo Go(실기기): localhost는 폰 자신을 가리켜 API 호출이 실패함 -> Metro PC IP 사용
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

export async function persistApiAuthTokens(tokens: TokenRefreshResponse) {
  setApiAccessToken(tokens.accessToken);
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken),
  ]);
}

export async function clearApiAuthTokens() {
  setApiAccessToken(null);
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_STORAGE_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY),
  ]);
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

async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);

  if (!refreshToken) {
    console.log('[Auth] refresh token missing');
    await clearApiAuthTokens();
    return null;
  }

  try {
    console.log('[Auth] refreshing access token');
    const response = await apiClient.post<ApiResponse<TokenRefreshResponse>>(
      '/api/v1/auth/token/refresh',
      { refreshToken }
    );
    const tokens = response.data.data;
    await persistApiAuthTokens(tokens);
    console.log('[Auth] access token refreshed');
    return tokens.accessToken;
  } catch (error) {
    console.log('[Auth] failed to refresh access token', error);
    await clearApiAuthTokens();
    throw error;
  }
}

function getRefreshTokenRequest() {
  if (!refreshTokenRequest) {
    refreshTokenRequest = refreshAccessToken().finally(() => {
      refreshTokenRequest = null;
    });
  }

  return refreshTokenRequest;
}

function isTokenRefreshRequest(config: InternalAxiosRequestConfig) {
  return config.url?.includes('/api/v1/auth/token/refresh') ?? false;
}

function isAuthTokenOptionalRequest(config: InternalAxiosRequestConfig) {
  return (
    config.url?.includes('/api/v1/auth/login') ||
    config.url?.includes('/api/v1/auth/token/refresh') ||
    false
  );
}

function formatApiUrl(config: InternalAxiosRequestConfig) {
  const base = (config.baseURL ?? '').replace(/\/$/, '');
  const path = config.url ?? '';
  return path.startsWith('http') ? path : `${base}${path}`;
}

function logApiRequest(config: InternalAxiosRequestConfig) {
  if (!__DEV__) {
    return;
  }

  const method = (config.method ?? 'get').toUpperCase();
  const hasAuth = Boolean(config.headers.Authorization);

  console.log(`[API] → ${method} ${formatApiUrl(config)}`, {
    params: config.params ?? undefined,
    body: config.data ?? undefined,
    auth: hasAuth ? 'Bearer ***' : undefined,
  });
}

function logApiResponse(response: { config: InternalAxiosRequestConfig; status: number; data: unknown }) {
  if (!__DEV__) {
    return;
  }

  const method = (response.config.method ?? 'get').toUpperCase();
  console.log(`[API] ← ${response.status} ${method} ${formatApiUrl(response.config)}`, response.data);
}

type ApiErrorBody = {
  code?: string;
  message?: string;
};

function isStaleUserSessionError(error: AxiosError) {
  const body = error.response?.data as ApiErrorBody | undefined;
  return error.response?.status === 404 && body?.code === 'USER_NOT_FOUND';
}

async function handleStaleUserSession() {
  console.log('[Auth] stale session detected (USER_NOT_FOUND), clearing tokens');
  await clearApiAuthTokens();
}

function logApiError(error: AxiosError) {
  if (!__DEV__) {
    return;
  }

  const config = error.config;
  const method = (config?.method ?? 'get').toUpperCase();
  const url = config ? formatApiUrl(config) : 'unknown';
  const status = error.response?.status ?? 'NETWORK';

  console.log(`[API] ✕ ${status} ${method} ${url}`, {
    message: error.message,
    data: error.response?.data,
  });
}

apiClient.interceptors.request.use(async (config) => {
  if (isAuthTokenOptionalRequest(config)) {
    delete config.headers.Authorization;
    logApiRequest(config);
    return config;
  }

  const accessToken = await getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  logApiRequest(config);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    logApiResponse(response);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (isStaleUserSessionError(error)) {
      await handleStaleUserSession();
      logApiError(error);
      return Promise.reject(error);
    }

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isTokenRefreshRequest(originalRequest)
    ) {
      logApiError(error);
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const accessToken = await getRefreshTokenRequest();

    if (!accessToken) {
      logApiError(error);
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return apiClient.request(originalRequest);
  }
);
