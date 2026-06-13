import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { fonts, fontSize } from '../../../theme';
import {
  AuthButton,
  AuthScreen,
  KakaoGlyph,
} from '../components/AuthPrimitives';
import { TermsAgreementBottomSheet } from '../components/TermsAgreementBottomSheet';
import {
  checkUserTermsAgreement,
  clearStoredAuthSession,
  completeLogin,
  kakaoLogin,
  submitTermsAgreement,
} from '../services/authService';
import type { PendingLoginResult, TermsAgreementState, TermsKey } from '../types/auth.types';

const MINDAM_LOGO = require('../../../assets/mindam_logo.png');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_TOP_PADDING = Math.min(Math.max(SCREEN_HEIGHT * 0.18, 148), 198);

const INITIAL_TERMS_STATE: TermsAgreementState = {
  location: false,
  privacy: false,
  notification: false,
};

export function StartSelectionScreen() {
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

      await completeLogin(loginResult);
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
      notification: nextValue,
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
      <AuthScreen
        bottom={
          <View style={styles.bottom}>
            <AuthButton
              label="카카오톡으로 로그인"
              variant="kakao"
              icon={<KakaoGlyph />}
              loading={isLoggingIn}
              onPress={handlePressKakaoLogin}
            />

            <Pressable
              onPress={handlePressBrowse}
              style={styles.browseButton}
              accessibilityRole="button"
              accessibilityLabel="회원가입 없이 둘러보기"
            >
              <AppText style={styles.browseText}>
                회원가입 없이 <AppText style={styles.browseAccent}>둘러보기</AppText>
              </AppText>
            </Pressable>
          </View>
        }
      >
        <View style={styles.hero}>
          <Image
            source={MINDAM_LOGO}
            defaultSource={MINDAM_LOGO}
            fadeDuration={0}
            resizeMode="contain"
            style={styles.logo}
            accessibilityLabel="민담 로고"
          />
          <View style={styles.titleWrap}>
            <AppText style={styles.titleLine}>
              <AppText style={styles.titleAccent}>민</AppText>원은 편하게,
            </AppText>
            <AppText style={styles.titleLine}>
              <AppText style={styles.titleAccent}>담</AppText>당자는 쉽게
            </AppText>
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
  hero: {
    alignItems: 'flex-start',
    gap: 22,
    paddingTop: HERO_TOP_PADDING,
  },
  logo: {
    width: 120,
    height: 120,
    marginLeft: -14,
  },
  titleWrap: {
    gap: 0,
    alignSelf: 'stretch',
  },
  titleLine: {
    fontFamily: fonts.bold,
    fontWeight: '800',
    fontSize: 35,
    lineHeight: 44,
    color: '#000000',
    letterSpacing: -0.5,
  },
  titleAccent: {
    fontFamily: fonts.black,
    fontWeight: '900',
    fontSize: 35,
    lineHeight: 44,
    color: '#30369A',
    letterSpacing: -0.5,
  },
  bottom: {
    gap: 16,
    marginTop: -22,
    paddingBottom: 50,
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
    color: '#30369A',
  },
});
