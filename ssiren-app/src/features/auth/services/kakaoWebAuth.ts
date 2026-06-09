import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const KAKAO_AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';

function getKakaoRestApiKey() {
  const restApiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.trim();
  if (!restApiKey) {
    throw new Error('missing_kakao_rest_api_key');
  }
  return restApiKey;
}

export function getKakaoWebRedirectUri() {
  return AuthSession.makeRedirectUri();
}

export async function requestKakaoAuthorizationCode() {
  const redirectUri = getKakaoWebRedirectUri();

  if (__DEV__) {
    console.log('[Auth] Kakao web redirect URI:', redirectUri);
  }

  const authUrl = `${KAKAO_AUTHORIZE_URL}?${new URLSearchParams({
    client_id: getKakaoRestApiKey(),
    redirect_uri: redirectUri,
    response_type: 'code',
  }).toString()}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('kakao_web_login_cancelled');
  }

  if (result.type !== 'success') {
    throw new Error('kakao_web_login_failed');
  }

  const code = new URL(result.url).searchParams.get('code');
  if (!code) {
    throw new Error('kakao_web_login_code_missing');
  }

  return {
    code,
    redirectUri,
  };
}
