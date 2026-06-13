import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { ReactNode, useCallback, useState } from 'react';
import { Alert, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppBar, AppText, Icon } from '../../../components/ui';
import { colors, fonts, fontSize } from '../../../theme';
import { fetchMyProfile } from '../../profile/api/userApi';
import { OfficerTransferRequestsPanel } from '../transfer-requests';
import { formatOfficerDepartments } from '../utils/officerDepartmentDisplay';

const PROFILE_BG = '#F4F5F8';

function SectionCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function getProfileFallbackName(_role: string | null) {
  return '담당자';
}

export function OfficerProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const loadProfile = useCallback(() => {
    let isMounted = true;

    fetchMyProfile()
      .then((data) => {
        if (!isMounted) return;
        setName(data.nickname || data.email);
        setDepartment(formatOfficerDepartments(data.departments));
        setRole(data.role);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.log('[OfficerProfile] failed to fetch /api/v1/users/me', error);

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 404 &&
          (error.response.data as { code?: string } | undefined)?.code === 'USER_NOT_FOUND'
        ) {
          Alert.alert(
            '로그인 정보가 만료됐어요',
            '다시 로그인해 주세요.',
            [{ text: '확인', onPress: () => router.replace('/auth/admin-email') }]
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useFocusEffect(loadProfile);

  return (
    <View style={styles.flex}>
      <AppBar title="내 정보" logo={false} border={false} backgroundColor={PROFILE_BG} />
      <View style={styles.profileWrap}>
        <SectionCard style={styles.profileCard}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Icon name="user" size={34} color="#B8B8B8" strokeWidth={1.8} />
            </View>
            <View style={styles.profileInfo}>
              <AppText style={styles.profileName} numberOfLines={1}>
                {name ?? getProfileFallbackName(role)}
              </AppText>
              <AppText style={styles.subtitle} numberOfLines={2}>
                {department ?? '담당 부서를 불러오는 중이에요'}
              </AppText>
            </View>
          </View>
        </SectionCard>
      </View>
      <OfficerTransferRequestsPanel embedded />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: PROFILE_BG,
  },
  profileWrap: {
    paddingTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  card: {
    borderRadius: 20,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    paddingVertical: 22,
    shadowColor: '#AAB2C0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
    overflow: 'hidden',
  },
  profileCard: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F1F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  profileName: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    lineHeight: 22,
    color: '#111111',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: '#8A8A8A',
  },
});
