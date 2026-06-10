import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { fonts } from '../../../theme';
import { AuthButton, AuthScreen, SirenMark } from '../components/AuthPrimitives';

export function StartSelectionScreen() {
  const router = useRouter();

  return (
    <AuthScreen
      bottom={
        <View style={styles.bottom}>
          <AuthButton
            label="시민으로 시작하기"
            onPress={() => router.push('/auth/login')}
          />
          <AuthButton
            label="관리자로 시작하기"
            variant="dark"
            onPress={() => router.push('/auth/admin-email')}
          />
        </View>
      }
    >
      <View style={styles.hero}>
        <SirenMark size={82} />
        <View style={styles.titleWrap}>
          <AppText style={styles.titleRegular}>모두의 경찰관</AppText>
          <AppText style={styles.titleStrong}>싸이렌 입니다</AppText>
        </View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'flex-start',
    gap: 18,
    paddingTop: 116,
  },
  titleWrap: {
    gap: 8,
  },
  titleRegular: {
    fontFamily: fonts.regular,
    fontSize: 31,
    lineHeight: 40,
    color: '#000000',
    letterSpacing: -0.9,
  },
  titleStrong: {
    fontFamily: fonts.bold,
    fontWeight: '900',
    fontSize: 35,
    lineHeight: 42,
    color: '#000000',
    letterSpacing: -1,
  },
  bottom: {
    gap: 14,
    paddingBottom: 76,
  },
});
