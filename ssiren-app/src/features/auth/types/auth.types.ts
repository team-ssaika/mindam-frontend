export type KakaoLoginResult = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  isNewUser: boolean;
};

export type PendingLoginResult = KakaoLoginResult;

export type UserTermsStatus = {
  needsTermsAgreement: boolean;
};

export type TermsKey = 'service' | 'location' | 'privacy';

export type TermsAgreementState = Record<TermsKey, boolean>;

export type TermsItem = {
  key: TermsKey;
  label: string;
};
