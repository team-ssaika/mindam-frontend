import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppBar,
  AppText,
  Card,
  Icon,
  SectionLabel,
  StatusBadge,
} from '../../../components/ui';
import { colors, fonts, radius, statusColors, StatusKey } from '../../../theme';
import { fetchMyReports } from '../../report/api/reportApi';
import type { MyReportItem } from '../../report/types/myReport';
import {
  formatReportDate,
  getReportStatusLabel,
  getReportStatusTone,
} from '../../report/utils/reportStatus';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { fetchMyProfile } from '../api/userApi';
import { myPageMock } from '../mocks/myPageMock';

const STATUS_CARDS = [
  { key: 'wait' as StatusKey, label: '접수 대기', count: myPageMock.statusSummary.pending },
  { key: 'prog' as StatusKey, label: '처리중', count: myPageMock.statusSummary.inProgress },
  { key: 'done' as StatusKey, label: '처리 완료', count: myPageMock.statusSummary.completed },
];

export function MyPageScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [recent, setRecent] = useState<MyReportItem[]>([]);

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

    fetchMyReports({ page: 0, size: 3, sort: 'createdAt,desc' })
      .then((page) => {
        if (!isMounted) return;
        setRecent(page?.contents ?? []);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.log('[Profile] failed to fetch recent reports', error);
        setRecent([]);
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

        <View style={styles.profileDivider} />

        {/* status summary */}
        <View style={styles.section}>
          <SectionLabel title="내 제보 현황" right="전체 보기 ›" onPressRight={goMyReports} />
          <View style={styles.statRow}>
            {STATUS_CARDS.map((s) => (
              <Pressable key={s.key} style={styles.statCard} onPress={goMyReports}>
                <AppText style={[styles.statCount, { color: statusColors[s.key].dot }]}>{s.count}</AppText>
                <AppText style={styles.statLabel}>{s.label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* recent reports */}
        <View style={styles.section}>
          <SectionLabel title="최근 제보" />
          <Card padded={false}>
            {recent.length === 0 ? (
              <View style={styles.emptyBox}>
                <AppText style={styles.emptyText}>아직 제보 내역이 없어요.</AppText>
              </View>
            ) : (
              recent.map((item, index) => (
                <RecentRow
                  key={item.report.id}
                  item={item}
                  first={index === 0}
                  onPress={() => router.push(`/my-reports/${item.report.id}`)}
                />
              ))
            )}
          </Card>
        </View>

        {/* menu tiles */}
        <View style={styles.menuRow}>
          <MenuTile icon="info" label="이용안내" />
          <MenuTile icon="headset" label="고객센터" />
        </View>
      </ScrollView>
    </View>
  );
}

function RecentRow({
  item,
  first,
  onPress,
}: {
  item: MyReportItem;
  first: boolean;
  onPress: () => void;
}) {
  const { report, category } = item;
  const meta = `${formatReportDate(report.createdAt)} · ${category?.categoryName ?? getReportStatusLabel(report.status)}`;
  return (
    <Pressable onPress={onPress} style={[styles.recentRow, !first && styles.recentDivider]}>
      <View style={styles.recentText}>
        <AppText style={styles.recentTitle} numberOfLines={1}>{report.title}</AppText>
        <AppText style={styles.recentMeta}>{meta}</AppText>
      </View>
      <StatusBadge status={getReportStatusTone(report.status)} size="sm" />
    </Pressable>
  );
}

function MenuTile({ icon, label }: { icon: 'info' | 'headset'; label: string }) {
  return (
    <Card style={styles.menuTile}>
      <Icon name={icon} size={20} color={colors.brand} />
      <AppText style={styles.menuLabel}>{label}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  content: { paddingHorizontal: 18, paddingTop: 18, gap: 16 },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
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
    fontSize: 14,
    color: colors.muted,
  },
  profileDivider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginBottom: 4,
  },

  section: { gap: 0 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statCount: { fontFamily: fonts.bold, fontSize: 26, letterSpacing: -0.5 },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, marginTop: 3 },

  emptyBox: { paddingVertical: 28, alignItems: 'center' },
  emptyText: { fontSize: 13.5, color: colors.muted },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  recentDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  recentText: { flex: 1, minWidth: 0 },
  recentTitle: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink },
  recentMeta: { fontSize: 12.5, color: colors.muted, marginTop: 3 },

  menuRow: { flexDirection: 'row', gap: 10 },
  menuTile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  menuLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
