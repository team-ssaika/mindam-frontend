import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { fonts } from '../../../theme';
import {
  AuthButton,
  AuthHero,
  AuthInput,
  AuthScreen,
  DevButton,
} from '../components/AuthPrimitives';

const DEV_PROFILE = {
  name: '홍길동',
  organization: '세종경찰청',
  department: '생활안전과',
};

export function AdminInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : 'name@police.go.kr';
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');

  const goHome = () => {
    router.replace('/(officer)');
  };

  const handleSubmit = () => {
    if (!name.trim() || !organization.trim() || !department.trim()) {
      Alert.alert('정보 확인', '이름, 소속 기관, 부서를 모두 입력해 주세요.');
      return;
    }

    goHome();
  };

  const handleDev = () => {
    setName(DEV_PROFILE.name);
    setOrganization(DEV_PROFILE.organization);
    setDepartment(DEV_PROFILE.department);
    goHome();
  };

  return (
    <AuthScreen devAction={<DevButton onPress={handleDev} />}>
      <View style={styles.content}>
        <View style={styles.top}>
          <AuthHero
            title="관리자 정보 입력"
            subtitle="관리자 권한 확인을 위해 기본 정보를 입력해 주세요"
            topPadding={10}
          />
          <View style={styles.badge}>
            <View style={styles.badgeCheckCircle}>
              <AppText style={styles.badgeCheck}>✓</AppText>
            </View>
            <AppText style={styles.badgeText}>{email} 인증 완료</AppText>
          </View>
        </View>

        <View style={styles.form}>
          <AuthInput
            label="이름"
            value={name}
            onChangeText={setName}
            placeholder="홍길동"
          />
          <AuthInput
            label="소속 기관"
            value={organization}
            onChangeText={setOrganization}
            placeholder="예 : 세종경찰청"
          />
          <AuthInput
            label="부서"
            value={department}
            onChangeText={setDepartment}
            placeholder="예 : 생활안전과"
            helpText="입력한 정보는 소속 기관 승인 및 관리자 권한 확인에 사용됩니다"
          />
        </View>

        <View style={styles.footer}>
          <AuthButton label="다음으로" variant="dark" onPress={handleSubmit} />
          <Pressable onPress={() => router.replace('/auth/admin-email')} style={styles.backLink}>
            <AppText style={styles.backText}>이전 단계로</AppText>
          </Pressable>
        </View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 18,
    paddingTop: 0,
    paddingBottom: 4,
  },
  top: {
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    height: 30,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
  },
  badgeCheckCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9B9B9B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCheck: {
    fontFamily: fonts.bold,
    fontSize: 8,
    lineHeight: 10,
    color: '#FFFFFF',
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#8A8A8A',
  },
  form: {
    gap: 13,
    marginTop: 10,
  },
  footer: {
    marginTop: 'auto',
    gap: 10,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  backText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#8A8A8A',
    textDecorationLine: 'underline',
  },
});
