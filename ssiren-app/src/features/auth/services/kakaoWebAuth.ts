export function getKakaoWebRedirectUri() {
  return '';
}

export async function requestKakaoAuthorizationCode() {
  throw new Error('kakao_web_login_not_configured');
}
