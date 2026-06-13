import { useFocusEffect, useRouter } from 'expo-router';
import { ReactNode, useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppBar, AppText, Icon } from '../../../components/ui';
import { colors, fonts, fontSize, statusColors, StatusKey } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { fetchMyReports } from '../../report/api/reportApi';
import type { MyReportItem } from '../../report/types/myReport';
import {
  formatReportDate,
  getReportStatusLabel,
  getReportStatusTone,
  summarizeReportStatuses,
  type ReportStatusSummary,
} from '../../report/utils/reportStatus';
import { fetchMyProfile } from '../api/userApi';

const STATUS_ITEMS: { key: StatusKey; label: string; color: string }[] = [
  { key: 'wait', label: '접수 대기', color: '#7EA7F6' },
  { key: 'prog', label: '처리중', color: '#E8A64B' },
  { key: 'done', label: '처리 완료', color: '#7EC8BF' },
];

const EMPTY_STATUS_SUMMARY: ReportStatusSummary = { wait: 0, prog: 0, done: 0 };

/** Pull enough of the user's reports in one call to count statuses for the summary widget. */
const STATUS_SUMMARY_FETCH_SIZE = 100;
const RECENT_REPORTS_COUNT = 3;

function SectionCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function ProfileSectionTitle({
  title,
  actionLabel,
  onPressAction,
}: {
  title: string;
  actionLabel?: string;
  onPressAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {actionLabel && onPressAction ? (
        <Pressable onPress={onPressAction} hitSlop={8} accessibilityRole="button">
          <AppText style={styles.sectionAction}>{actionLabel} ›</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}


export function MyPageScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [recent, setRecent] = useState<MyReportItem[]>([]);
  const [statusSummary, setStatusSummary] = useState<ReportStatusSummary>(EMPTY_STATUS_SUMMARY);

  const loadProfile = useCallback(() => {
    let isMounted = true;

    fetchMyProfile()
      .then((data) => {
        if (!isMounted) return;
        setName(data.nickname || data.email);
        setEmail(data.email);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.log('[Profile] failed to fetch /api/v1/users/me', error);
      });

    fetchMyReports({ page: 0, size: STATUS_SUMMARY_FETCH_SIZE, sort: 'createdAt,desc' })
      .then((page) => {
        if (!isMounted) return;
        const items = page?.contents ?? [];
        setRecent(items.slice(0, RECENT_REPORTS_COUNT));
        setStatusSummary(summarizeReportStatuses(items.map((item) => item.report.status)));
      })
      .catch((error) => {
        if (!isMounted) return;
        console.log('[Profile] failed to fetch my reports', error);
        setRecent([]);
        setStatusSummary(EMPTY_STATUS_SUMMARY);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(loadProfile);

  const goMyReports = () => {
    if (Platform.OS === 'web') {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    router.push('/my-reports');
  };

  return (
    <View style={styles.flex}>
      <AppBar title="내 정보" logo={false} border={false} backgroundColor="#F4F5F8" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard style={styles.profileCard}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Icon name="user" size={34} color="#B8B8B8" strokeWidth={1.8} />
            </View>
            <View style={styles.profileInfo}>
              <AppText style={styles.profileName} numberOfLines={1}>
                {name ?? '사용자'}
              </AppText>
              <AppText style={styles.email} numberOfLines={1}>
                {email ?? '이메일을 불러오는 중이에요'}
              </AppText>
            </View>
          </View>
        </SectionCard>

        <SectionCard>
          <ProfileSectionTitle title="내 제보 현황" />
          <View style={styles.statRow}>
            {STATUS_ITEMS.map((item, index) => (
              <View key={item.key} style={styles.statColumn}>
                {index > 0 ? <View style={styles.statSeparator} /> : null}
                <View style={styles.statPressable}>
                  <AppText style={[styles.statCount, { color: item.color }]}>
                    {statusSummary[item.key]}
                  </AppText>
                  <AppText style={styles.statLabel}>{item.label}</AppText>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard>
          <ProfileSectionTitle title="최근 제보" actionLabel="전체 보기" onPressAction={goMyReports} />
          {recent.length === 0 ? (
            <View style={styles.emptyBox}>
              <AppText style={styles.emptyText}>아직 제보 내역이 없어요</AppText>
            </View>
          ) : (
            recent.map((item, index) => (
              <RecentRow
                key={item.report.id}
                item={item}
                showDivider={index > 0}
                onPress={() => router.push(`/my-reports/${item.report.id}`)}
              />
            ))
          )}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

function RecentRow({
  item,
  showDivider,
  onPress,
}: {
  item: MyReportItem;
  showDivider?: boolean;
  onPress: () => void;
}) {
  const { report, category } = item;
  const meta = `${formatReportDate(report.createdAt)} · ${category?.categoryName ?? getReportStatusLabel(report.status)}`;
  const tone = getReportStatusTone(report.status);
  const statusColor = statusColors[tone].dot;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recentRow,
        showDivider ? styles.recentRowDivider : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.recentText}>
        <AppText style={styles.recentTitle} numberOfLines={1}>
          {report.title}
        </AppText>
        <AppText style={styles.recentMeta} numberOfLines={1}>
          {meta}
        </AppText>
      </View>
      <View style={styles.recentBadge}>
        <View style={[styles.recentBadgeDot, { backgroundColor: statusColor }]} />
        <AppText style={styles.recentBadgeText}>{getReportStatusLabel(report.status)}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F4F5F8',
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
  email: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
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
  sectionAction: {
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
  emptyBox: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: '#8A8A8A',
  },
  recentRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  recentRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },
  recentText: {
    flex: 1,
    minWidth: 0,
  },
  recentTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    lineHeight: 23,
    color: '#111111',
  },
  recentMeta: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: '#8A8A8A',
    marginTop: 8,
  },
  recentBadge: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F0F1F4',
  },
  recentBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recentBadgeText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: '#616778',
  },
  rowPressed: {
    opacity: 0.72,
  },
});
