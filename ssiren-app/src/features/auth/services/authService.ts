import type {
  KakaoLoginResult,
  TermsAgreementState,
  UserTermsStatus,
} from '../types/auth.types';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockKakaoLogin(): Promise<KakaoLoginResult> {
  await delay(900);

  return {
    accessToken: 'mock-kakao-access-token',
    kakaoId: 'kakao-user-001',
    nickname: 'SSIREN 사용자',
  };
}

export async function checkUserTermsAgreement(
  _user: KakaoLoginResult
): Promise<UserTermsStatus> {
  await delay(500);

  return {
    needsTermsAgreement: true,
  };
}

export async function submitTermsAgreement(
  agreement: TermsAgreementState
): Promise<void> {
  await delay(700);

  if (!agreement.service || !agreement.location || !agreement.privacy) {
    throw new Error('required_terms_missing');
  }
}
