import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { ReactNode, useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Icon, ListRow } from '../../../components/ui';
import { colors, fonts, statusColors, fontSize } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { fetchMyProfile } from '../../profile/api/userApi';
import { officerStats } from '../mocks/officerMock';
import { formatOfficerDepartments } from '../utils/officerDepartmentDisplay';

const PROFILE_BG = '#F4F5F8';

const MENU_ITEMS = [
  { icon: 'gear' as const, label: '설정', route: '/(officer)/config' as const },
  { icon: 'doc' as const, label: '처리 이력' },
  {
    icon: 'layers' as const,
    label: '제보 이관',
    route: '/(officer)/transfer-requests' as const,
    officerOnly: true,
  },
  { icon: 'headset' as const, label: '내부 문의' },
  { icon: 'info' as const, label: '담당 구역 설정' },
];

function SectionCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function ProfileSectionTitle({
  title,
  actionLabel,
}: {
  title: string;
  actionLabel?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {actionLabel ? <AppText style={styles.sectionMeta}>{actionLabel}</AppText> : null}
    </View>
  );
}

function getProfileFallbackName(_role: string | null) {
  return '담당자';
}

export function OfficerProfileScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
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

  const visibleMenuItems = MENU_ITEMS.filter(
    (item) => !('officerOnly' in item) || role === 'OFFICER'
  );

  return (
    <View style={styles.flex}>
      <AppBar title="내 정보" logo={false} border={false} backgroundColor={PROFILE_BG} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Icon name="user" size={42} color="#B8B8B8" strokeWidth={1.8} />
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

        <SectionCard>
          <ProfileSectionTitle title="담당 제보 처리 현황" actionLabel="이번 달 142건" />
          <View style={styles.statRow}>
            {officerStats.map((stat, index) => (
              <View key={stat.label} style={styles.statColumn}>
                {index > 0 ? <View style={styles.statSeparator} /> : null}
                <View style={styles.statPressable}>
                  <AppText style={[styles.statCount, { color: statusColors[stat.tone].dot }]}>
                    {stat.count}
                  </AppText>
                  <AppText style={styles.statLabel}>{stat.label}</AppText>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard>
          <View style={styles.avgRow}>
            <View style={styles.avgText}>
              <AppText style={styles.sectionTitle}>평균 처리 시간</AppText>
              <View style={styles.avgValueRow}>
                <AppText style={styles.avgValue}>1.8일</AppText>
                <AppText style={styles.avgDelta}>▼ 0.4일</AppText>
              </View>
            </View>
            <View style={styles.avgIcon}>
              <Icon name="clock" size={24} color={statusColors.done.fg} />
            </View>
          </View>
        </SectionCard>

        <SectionCard>
          <ProfileSectionTitle title="메뉴" />
          <View style={styles.menuList}>
            {visibleMenuItems.map((item, index) => (
              <ListRow
                key={item.label}
                icon={item.icon}
                label={item.label}
                first={index === 0}
                size="lg"
                onPress={
                  'route' in item && item.route
                    ? () => router.push(item.route)
                    : undefined
                }
              />
            ))}
          </View>
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: PROFILE_BG,
  },
  content: {
    paddingTop: 22,
    paddingHorizontal: 16,
    gap: 22,
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F1F1F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  profileName: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 25,
    color: '#111111',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: '#8A8A8A',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.base,
    color: '#707070',
    letterSpacing: -0.1,
  },
  sectionMeta: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: 6,
    paddingBottom: 2,
    marginHorizontal: -10,
  },
  statColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statSeparator: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#ECECEC',
    marginVertical: 8,
  },
  statPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statCount: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: '#777777',
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avgText: {
    flex: 1,
  },
  avgValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 10,
  },
  avgValue: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    color: '#111111',
    letterSpacing: -0.5,
  },
  avgDelta: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: statusColors.done.fg,
  },
  avgIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F0F1F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuList: {
    marginHorizontal: -22,
    marginBottom: -22,
  },
});
