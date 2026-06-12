import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { colors, fonts, fontSize } from '../../../theme';
import {
  checkUserTermsAgreement,
  clearStoredAuthSession,
  kakaoLogin,
  submitTermsAgreement,
} from '../services/authService';
import type { PendingLoginResult, TermsAgreementState, TermsKey } from '../types/auth.types';
import { TermsAgreementBottomSheet } from '../components/TermsAgreementBottomSheet';
import {
  AuthButton,
  AuthHero,
  AuthScreen,
  KakaoGlyph,
} from '../components/AuthPrimitives';

const INITIAL_TERMS_STATE: TermsAgreementState = {
  location: false,
  privacy: false,
};

export function LoginScreen() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isTermsVisible, setIsTermsVisible] = useState(false);
  const [isSubmittingTerms, setIsSubmittingTerms] = useState(false);
  const [termsState, setTermsState] = useState<TermsAgreementState>(INITIAL_TERMS_STATE);
  const [termsErrorMessage, setTermsErrorMessage] = useState<string | null>(null);
  const [pendingLoginResult, setPendingLoginResult] = useState<PendingLoginResult | null>(null);

  const goCitizenHome = () => {
    router.replace('/(tabs)');
  };

  const handlePressBrowse = async () => {
    try {
      await clearStoredAuthSession();
    } catch (error) {
      console.log('[Auth] clear auth session for guest failed', error);
    } finally {
      console.log('[Auth] continue as guest');
      goCitizenHome();
    }
  };

  const handlePressKakaoLogin = async () => {
    if (isLoggingIn) {
      return;
    }

    setIsLoggingIn(true);
    setTermsErrorMessage(null);

    try {
      const loginResult = await kakaoLogin();
      const termsStatus = await checkUserTermsAgreement(loginResult);

      if (termsStatus.needsTermsAgreement) {
        setPendingLoginResult(loginResult);
        setTermsState(INITIAL_TERMS_STATE);
        setIsTermsVisible(true);
        return;
      }

      goCitizenHome();
    } catch (error) {
      console.log('[Auth] kakao login error', error);
      Alert.alert('로그인에 실패했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleToggleAllTerms = () => {
    const nextValue = !Object.values(termsState).every(Boolean);
    setTermsErrorMessage(null);
    setTermsState({
      location: nextValue,
      privacy: nextValue,
    });
  };

  const handleToggleTerm = (key: TermsKey) => {
    setTermsErrorMessage(null);
    setTermsState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmitTerms = async () => {
    if (isSubmittingTerms) {
      return;
    }

    setIsSubmittingTerms(true);
    setTermsErrorMessage(null);

    try {
      if (!pendingLoginResult) {
        throw new Error('pending_login_missing');
      }

      await submitTermsAgreement(pendingLoginResult, termsState);
      setPendingLoginResult(null);
      setIsTermsVisible(false);
      goCitizenHome();
    } catch (error) {
      console.log('[Auth] submit terms error', error);
      setTermsErrorMessage('약관 동의 처리 중 문제가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setIsSubmittingTerms(false);
    }
  };

  return (
    <>
      <AuthScreen onBack={() => router.replace('/')}>
        <View style={styles.content}>
          <AuthHero
            title="시민제보"
            subtitle="간편한 제보 하나로, 우리 동네를 더 안전하게"
            topPadding={58}
          />

          <View style={styles.actions}>
            <AuthButton
              label="카카오톡으로 로그인"
              variant="kakao"
              icon={<KakaoGlyph />}
              loading={isLoggingIn}
              onPress={handlePressKakaoLogin}
            />

            <Pressable onPress={handlePressBrowse} style={styles.browseButton}>
              <AppText style={styles.browseText}>
                회원가입 없이 <AppText style={styles.browseAccent}>둘러보기</AppText>
              </AppText>
            </Pressable>
          </View>
        </View>
      </AuthScreen>

      <TermsAgreementBottomSheet
        visible={isTermsVisible}
        onClose={() => {
          setIsTermsVisible(false);
          setPendingLoginResult(null);
          clearStoredAuthSession().catch((error: unknown) => {
            console.log('[Auth] clear pending auth session failed', error);
          });
          setTermsState(INITIAL_TERMS_STATE);
        }}
        onSubmit={handleSubmitTerms}
        onToggleAll={handleToggleAllTerms}
        onToggleItem={handleToggleTerm}
        state={termsState}
        isSubmitting={isSubmittingTerms}
        errorMessage={termsErrorMessage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 84,
    paddingBottom: 34,
  },
  actions: {
    gap: 16,
  },
  browseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  browseText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#111111',
  },
  browseAccent: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: '#8B7561',
  },
});
