import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  AuthButton,
  AuthHero,
  AuthInput,
  AuthScreen,
  DevButton,
} from '../components/AuthPrimitives';
import { AppText } from '../../../components/ui';
import { fonts } from '../../../theme';

const DEV_EMAIL = 'name@police.go.kr';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AdminEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const goToInfo = (nextEmail: string) => {
    router.push({
      pathname: '/auth/admin-info',
      params: { email: nextEmail },
    });
  };

  const handleSubmit = () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      Alert.alert('이메일 확인', '기관 이메일 형식을 확인해 주세요.');
      return;
    }

    goToInfo(trimmed);
  };

  const handleDev = () => {
    setEmail(DEV_EMAIL);
    goToInfo(DEV_EMAIL);
  };

  return (
    <AuthScreen
      onBack={() => router.replace('/')}
      devAction={<DevButton onPress={handleDev} />}
    >
      <View style={styles.content}>
        <AuthHero
          title="제보관리"
          subtitle="흩어진 제보를 한눈에, 대응은 더 빠르게"
          topPadding={26}
        />

        <View style={styles.form}>
          <AuthInput
            label="기관 이메일"
            value={email}
            onChangeText={setEmail}
            placeholder="name@police.go.kr"
            autoCapitalize="none"
            keyboardType="email-address"
            helpText="경찰청 또는 공공기관 이메일로 관리자 자격을 확인합니다"
          />
          <AuthButton label="인증 메일 받기" variant="dark" onPress={handleSubmit} />
          <AppText style={styles.footnote}>
            인증 후 소속 기관 승인 시 관리자 기능을 사용할 수 있습니다
          </AppText>
        </View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 54,
    paddingBottom: 26,
  },
  form: {
    gap: 15,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#8B8B8B',
    textAlign: 'center',
  },
});
