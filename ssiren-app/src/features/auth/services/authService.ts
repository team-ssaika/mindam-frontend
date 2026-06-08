import { getKeyHashAndroid, initializeKakaoSDK } from '@react-native-kakao/core';
import { login as kakaoSdkLogin } from '@react-native-kakao/user';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient, setApiAccessToken } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';
import type {
  KakaoLoginResult,
  PendingLoginResult,
  TermsAgreementState,
  UserTermsStatus,
} from '../types/auth.types';

const ACCESS_TOKEN_STORAGE_KEY = 'ssiren.accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'ssiren.refreshToken';

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
  setApiAccessToken(tokens.accessToken);
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken),
  ]);
}

export async function restoreAuthSession() {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_STORAGE_KEY);
  setApiAccessToken(accessToken);
  return accessToken;
}

export function clearRuntimeAuthSession() {
  setApiAccessToken(null);
}

export async function kakaoLogin(): Promise<PendingLoginResult> {
  ensureKakaoInitialized();

  const kakaoToken = await kakaoSdkLogin();
  const backendTokens = await loginToBackend(kakaoToken.accessToken);

  if (!backendTokens.isNewUser) {
    await persistBackendTokens(backendTokens);
  }

  return backendTokens;
}

export async function completeLogin(tokens: PendingLoginResult) {
  await persistBackendTokens(tokens);
}

export async function checkUserTermsAgreement(
  loginResult: PendingLoginResult
): Promise<UserTermsStatus> {
  return {
    needsTermsAgreement: loginResult.isNewUser,
  };
}

export async function submitTermsAgreement(
  loginResult: PendingLoginResult,
  agreement: TermsAgreementState
): Promise<void> {
  if (!agreement.service || !agreement.location || !agreement.privacy) {
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
