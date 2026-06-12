import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Icon, ListRow } from '../../../components/ui';
import { colors, fonts, layout, statusColors, fontSize } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { fetchMyProfile } from '../../profile/api/userApi';
import { officerStats } from '../mocks/officerMock';
import { formatOfficerDepartments } from '../utils/officerDepartmentDisplay';

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

function getProfileFallbackName(_role: string | null) {
  return '담당자 님';
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
  }, []);

  useFocusEffect(loadProfile);

  return (
    <View style={styles.flex}>
      <AppBar title="내 정보" logo={false} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Icon name="user" size={42} color={colors.faint} />
          </View>
          <View style={styles.profileInfo}>
            <AppText variant="heading" color={colors.ink} numberOfLines={1}>
              {name ?? getProfileFallbackName(role)}
            </AppText>
            <AppText style={styles.subtitle} numberOfLines={2}>
              {department ?? '담당 부서를 불러오는 중이에요'}
            </AppText>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>담당 제보 처리 현황</AppText>
            <AppText style={styles.sectionMeta}>이번 달 142건</AppText>
          </View>
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
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <View style={styles.avgRow}>
            <View style={styles.avgText}>
              <AppText style={styles.avgLabel}>평균 처리 시간</AppText>
              <View style={styles.avgValueRow}>
                <AppText style={styles.avgValue}>1.8일</AppText>
                <AppText style={styles.avgDelta}>▼ 0.4일</AppText>
              </View>
            </View>
            <View style={styles.avgIcon}>
              <Icon name="clock" size={24} color={colors.forest} />
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <View style={styles.menuList}>
            {MENU_ITEMS.filter((item) => !('officerOnly' in item) || role === 'OFFICER').map((item, index) => (
              <ListRow
                key={item.label}
                icon={item.icon}
                label={item.label}
                first={index === 0}
                onPress={() => {
                  if ('route' in item && item.route) {
                    router.push(item.route);
                  }
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingTop: 8 },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.soft2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, minWidth: 0, gap: 6 },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.mdLg,
    color: colors.muted,
  },
  sectionDivider: {
    height: 8,
    backgroundColor: colors.soft,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },

  section: {
    paddingTop: 18,
    paddingBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.muted,
    letterSpacing: -0.1,
  },
  sectionMeta: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.muted,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: 4,
    paddingBottom: 4,
  },
  statColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statSeparator: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.hairline,
    marginVertical: 4,
  },
  statPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statCount: {
    fontFamily: fonts.bold,
    fontSize: fontSize.display,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.muted,
  },

  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: layout.screenPadding,
  },
  avgText: { flex: 1 },
  avgLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.muted,
    letterSpacing: -0.1,
  },
  avgValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  avgValue: {
    fontFamily: fonts.bold,
    fontSize: fontSize.display,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  avgDelta: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: statusColors.done.fg,
  },
  avgIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.soft2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuList: {
    marginTop: 2,
  },
});
