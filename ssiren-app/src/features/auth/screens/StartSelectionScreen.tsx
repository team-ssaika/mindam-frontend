import { useRouter } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { colors, fonts, radius, fontSize } from '../../../theme';
import { AuthScreen, SirenMark } from '../components/AuthPrimitives';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_TOP_PADDING = Math.min(Math.max(SCREEN_HEIGHT * 0.24, 188), 238);

export function StartSelectionScreen() {
  const router = useRouter();
  const goLogin = () => router.push('/auth/login');

  return (
    <AuthScreen
      bottom={
        <View style={styles.bottom}>
          <Pressable
            style={styles.startButton}
            onPress={goLogin}
            accessibilityRole="button"
            accessibilityLabel="민담 시작하기"
          >
            <AppText style={styles.startButtonText}>민담 시작하기</AppText>
          </Pressable>

          <Pressable
            style={styles.loginLink}
            onPress={goLogin}
            accessibilityRole="button"
            accessibilityLabel="로그인"
          >
            <AppText style={styles.loginText}>
              이미 계정이 있다면 <AppText style={styles.loginAccent}>로그인</AppText>
            </AppText>
          </Pressable>
        </View>
      }
    >
      <View style={styles.hero}>
        <SirenMark size={74} />
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
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'flex-start',
    gap: 22,
    paddingTop: HERO_TOP_PADDING,
  },
  titleWrap: {
    gap: 0,
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
    paddingBottom: 76,
  },
  startButton: {
    height: 58,
    borderRadius: radius.sm,
    backgroundColor: '#30369A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  loginLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 2,
  },
  loginText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#8B8B8B',
  },
  loginAccent: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: '#30369A',
  },
});
