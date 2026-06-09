import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  checkUserTermsAgreement,
  clearStoredAuthSession,
  kakaoLogin,
  submitTermsAgreement,
} from '../services/authService';
import type { PendingLoginResult, TermsAgreementState, TermsKey } from '../types/auth.types';
import { TermsAgreementBottomSheet } from '../components/TermsAgreementBottomSheet';

const LOGO_IMAGE = require('../../../assets/ssiren-login.png');

const INITIAL_TERMS_STATE: TermsAgreementState = {
  service: false,
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

  const handlePressBrowse = () => {
    // TODO: replace with guest browsing entry flow when route is ready
    console.log('[Auth] continue as guest');
    router.replace('/(tabs)');
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

      router.replace('/(tabs)');
    } catch (error) {
      console.log('[Auth] kakao login error', error);
      Alert.alert('로그인에 실패했어요.', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleToggleAllTerms = () => {
    const nextValue = !Object.values(termsState).every(Boolean);
    setTermsErrorMessage(null);
    setTermsState({
      service: nextValue,
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
      router.replace('/(tabs)');
    } catch (error) {
      console.log('[Auth] submit terms error', error);
      setTermsErrorMessage('약관 동의 처리 중 문제가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmittingTerms(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoSection}>
          <Image
            source={LOGO_IMAGE}
            defaultSource={LOGO_IMAGE}
            fadeDuration={0}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>SSIREN</Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            onPress={handlePressKakaoLogin}
            disabled={isLoggingIn}
            style={[styles.kakaoButton, isLoggingIn && styles.kakaoButtonDisabled]}
          >
            <Ionicons name="chatbubble" size={18} color="#111111" />
            <Text style={styles.kakaoButtonText}>
              {isLoggingIn ? '카카오 로그인 중...' : '카카오톡으로 로그인'}
            </Text>
          </TouchableOpacity>

          <Pressable onPress={handlePressBrowse} style={styles.browseButton}>
            <Text style={styles.browseText}>
              회원가입 없이 <Text style={styles.browseAccent}>둘러보기</Text>
            </Text>
          </Pressable>
        </View>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  logoImage: {
    width: 132,
    height: 132,
  },
  logoText: {
    marginTop: 8,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#111111',
    transform: [{ scaleX: 1.08 }],
  },
  bottomSection: {
    paddingBottom: 44,
    gap: 16,
  },
  kakaoButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  kakaoButtonDisabled: {
    opacity: 0.68,
  },
  kakaoButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
  browseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  browseText: {
    fontSize: 15,
    color: '#17171F',
  },
  browseAccent: {
    color: '#8B7561',
  },
});
