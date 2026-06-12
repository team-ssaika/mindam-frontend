import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppBar,
  AppText,
  Icon,
  ListRow,
  StatusBadge,
} from '../../../components/ui';
import { colors, fonts, layout, statusColors, StatusKey, fontSize } from '../../../theme';
import { fetchMyReports } from '../../report/api/reportApi';
import type { MyReportItem } from '../../report/types/myReport';
import {
  formatReportDate,
  getReportStatusLabel,
  getReportStatusTone,
  summarizeReportStatuses,
  type ReportStatusSummary,
} from '../../report/utils/reportStatus';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { fetchMyProfile } from '../api/userApi';

const STATUS_ITEMS: { key: StatusKey; label: string }[] = [
  { key: 'wait', label: '접수 대기' },
  { key: 'prog', label: '처리중' },
  { key: 'done', label: '처리 완료' },
];

const EMPTY_STATUS_SUMMARY: ReportStatusSummary = { wait: 0, prog: 0, done: 0 };

/** Pull enough of the user's reports in one call to count statuses for the summary widget. */
const STATUS_SUMMARY_FETCH_SIZE = 100;
const RECENT_REPORTS_COUNT = 3;

const MENU_ITEMS = [
  { icon: 'info' as const, label: '이용안내' },
  { icon: 'headset' as const, label: '고객센터' },
];

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
          <AppText style={styles.sectionAction}>{actionLabel}</AppText>
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
              {name ?? '시민 님'}
            </AppText>
            <AppText style={styles.email} numberOfLines={1}>
              {email ?? '이메일을 불러오는 중이에요'}
            </AppText>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <ProfileSectionTitle title="내 제보 현황" />
          <View style={styles.statRow}>
            {STATUS_ITEMS.map((item, index) => (
              <View key={item.key} style={styles.statColumn}>
                {index > 0 ? <View style={styles.statSeparator} /> : null}
                <View style={styles.statPressable}>
                  <AppText style={[styles.statCount, { color: statusColors[item.key].dot }]}>
                    {statusSummary[item.key]}
                  </AppText>
                  <AppText style={styles.statLabel}>{item.label}</AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <ProfileSectionTitle
            title="최근 제보"
            actionLabel="전체 보기 ›"
            onPressAction={goMyReports}
          />
          {recent.length === 0 ? (
            <View style={styles.emptyBox}>
              <AppText style={styles.emptyText}>아직 제보 내역이 없어요.</AppText>
            </View>
          ) : (
            recent.map((item) => (
              <RecentRow
                key={item.report.id}
                item={item}
                onPress={() => router.push(`/my-reports/${item.report.id}`)}
              />
            ))
          )}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <ProfileSectionTitle title="도움이 필요하신가요?" />
          <View style={styles.helpList}>
            {MENU_ITEMS.map((item, index) => (
              <ListRow
                key={item.label}
                icon={item.icon}
                label={item.label}
                first={index === 0}
                onPress={() => {}}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function RecentRow({
  item,
  onPress,
}: {
  item: MyReportItem;
  onPress: () => void;
}) {
  const { report, category } = item;
  const meta = `${formatReportDate(report.createdAt)} · ${category?.categoryName ?? getReportStatusLabel(report.status)}`;
  return (
    <Pressable onPress={onPress} style={styles.recentRow}>
      <View style={styles.recentText}>
        <AppText style={styles.recentTitle} numberOfLines={1}>{report.title}</AppText>
        <AppText style={styles.recentMeta}>{meta}</AppText>
      </View>
      <StatusBadge
        status={getReportStatusTone(report.status)}
        size="sm"
        label={getReportStatusLabel(report.status)}
      />
    </Pressable>
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
  email: {
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
  sectionAction: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.brand,
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

  emptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.muted,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: layout.screenPadding,
  },
  recentText: { flex: 1, minWidth: 0 },
  recentTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  recentMeta: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 3,
  },

  helpList: {
    marginTop: 2,
  },
});
