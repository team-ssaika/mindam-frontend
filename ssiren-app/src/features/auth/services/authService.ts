import { getKeyHashAndroid, initializeKakaoSDK } from '@react-native-kakao/core';
import { login as kakaoSdkLogin } from '@react-native-kakao/user';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  apiClient,
  clearApiAuthTokens,
  persistApiAuthTokens,
  setApiAccessToken,
} from '../../../lib/api/client';
import {
  deactivateStoredPushToken,
  registerDevicePushToken,
} from '../../notifications/services/pushNotificationService';
import type { ApiResponse } from '../../../lib/api/types';
import type {
  KakaoLoginResult,
  PendingLoginResult,
  TermsAgreementState,
  UserTermsStatus,
} from '../types/auth.types';

type BackendTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  isNewUser: boolean;
};

type UserConsentResponse = {
  id: number;
  locationAgreed: boolean;
  sensitiveInfoAgreed: boolean;
  sensitiveInfoAgreedAt: string | null;
  requiredAgreed: boolean;
  updatedAt: string;
};

let isKakaoInitialized = false;

function getKakaoNativeAppKey() {
  const nativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim();
  if (!nativeAppKey) {
    throw new Error('missing_kakao_native_app_key');
  }
  return nativeAppKey;
}

function ensureKakaoInitialized() {
  if (isKakaoInitialized) {
    return;
  }

  initializeKakaoSDK(getKakaoNativeAppKey());
  isKakaoInitialized = true;

  if (__DEV__ && Platform.OS === 'android') {
    getKeyHashAndroid()
      .then((keyHash) => console.log('[Auth] Kakao Android key hash', keyHash))
      .catch((error: unknown) => {
        console.log('[Auth] Kakao Android key hash unavailable', error);
      });
  }
}

async function loginToBackend(providerToken: string) {
  const response = await apiClient.post<ApiResponse<BackendTokenResponse>>(
    '/api/v1/auth/login',
    {
      provider: 'kakao',
      providerToken,
    }
  );

  return response.data.data;
}

async function persistBackendTokens(tokens: BackendTokenResponse) {
  await persistApiAuthTokens(tokens);
}

function registerPushTokenInBackground(logPrefix: string) {
  registerDevicePushToken().catch((error: unknown) => {
    console.log(`[Auth] push token ${logPrefix} skipped`, error);
  });
}

export async function loginByTestEmail(email: string) {
  await clearStoredAuthSession();

  const response = await apiClient.post<ApiResponse<BackendTokenResponse>>(
    '/api/v1/test/auth/login',
    { email }
  );

  const tokens = response.data.data;
  await persistBackendTokens(tokens);
  registerPushTokenInBackground('registration');
  return tokens;
}

export async function restoreAuthSession() {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_STORAGE_KEY);
  setApiAccessToken(accessToken);
  if (accessToken) {
    registerPushTokenInBackground('restore');
  }
  return accessToken;
}

export async function hasStoredAuthSession() {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_STORAGE_KEY);
  return Boolean(accessToken);
}

export function clearRuntimeAuthSession() {
  setApiAccessToken(null);
}

export async function clearStoredAuthSession() {
  await clearApiAuthTokens();
}

export async function logout() {
  try {
    await deactivateStoredPushToken();
    await apiClient.delete('/api/v1/auth/logout');
  } catch (error) {
    console.log('[Auth] backend logout skipped', error);
  } finally {
    await clearStoredAuthSession();
  }
}

export async function kakaoLogin(): Promise<PendingLoginResult> {
  ensureKakaoInitialized();
  await clearStoredAuthSession();

  const kakaoToken = await kakaoSdkLogin();
  const backendTokens = await loginToBackend(kakaoToken.accessToken);

  await persistBackendTokens(backendTokens);

  if (!backendTokens.isNewUser) {
    registerPushTokenInBackground('registration');
  }

  return backendTokens;
}

export async function completeLogin(tokens: PendingLoginResult) {
  await persistBackendTokens(tokens);
  registerPushTokenInBackground('registration');
}

export async function checkUserTermsAgreement(
  loginResult: PendingLoginResult
): Promise<UserTermsStatus> {
  setApiAccessToken(loginResult.accessToken);

  const response = await apiClient.get<ApiResponse<UserConsentResponse>>('/api/v1/users/me/consents');
  return {
    needsTermsAgreement: !response.data.data.requiredAgreed,
  };
}

export async function submitTermsAgreement(
  loginResult: PendingLoginResult,
  agreement: TermsAgreementState
): Promise<void> {
  if (!agreement.location || !agreement.privacy) {
    throw new Error('required_terms_missing');
  }

  setApiAccessToken(loginResult.accessToken);

  try {
    await apiClient.put<ApiResponse<UserConsentResponse>>('/api/v1/users/me/consents', {
      locationAgreed: agreement.location,
      sensitiveInfoAgreed: agreement.privacy,
    });
    await completeLogin(loginResult);
  } catch (error) {
    setApiAccessToken(null);
    throw error;
  }
}
