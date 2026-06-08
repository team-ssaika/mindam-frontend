export type KakaoLoginResult = {
  accessToken: string;
  kakaoId: string;
  nickname: string;
};

export type UserTermsStatus = {
  needsTermsAgreement: boolean;
};

export type TermsKey = 'service' | 'location' | 'privacy';

export type TermsAgreementState = Record<TermsKey, boolean>;

export type TermsItem = {
  key: TermsKey;
  label: string;
};
