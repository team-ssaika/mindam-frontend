import axios from 'axios';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Button, Card, CatChip, Icon, ImageSlot, StatusBadge } from '../../../components/ui';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { colors, fonts, radius } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { fetchAdminIssues } from '../api/adminIssueApi';
import type { AdminIssueItem } from '../types/adminIssue';
import type { ReportStatus } from '../../report/types/myReport';
import { formatReportDateTime, getReportStatusLabel, getReportStatusTone } from '../../report/utils/reportStatus';

type ViewMode = 'list' | 'grid';

export function OfficerInboxScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const [view, setView] = useState<ViewMode>('list');
  const [issues, setIssues] = useState<AdminIssueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchAdminIssues({ myDepartmentOnly: true });
      setIssues(data.issues);
    } catch (error) {
      let message = '제보 목록을 불러오지 못했습니다.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        message = typeof apiMessage === 'string' ? apiMessage : error.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      if (axios.isAxiosError(error) && !error.response) {
        message = `${message}\n\n요청 주소: ${resolveApiBaseUrl()}`;
      }
      setIssues([]);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const sortedIssues = useMemo(
    () =>
      [...issues].sort(
        (a, b) =>
          new Date(b.issueGroup.recentReportedAt).getTime() -
          new Date(a.issueGroup.recentReportedAt).getTime()
      ),
    [issues]
  );

  const openDetail = (issueGroupId: number) => {
    router.push(`/officer-report/${issueGroupId}`);
  };

  return (
    <View style={styles.flex}>
      <AppBar title="제보함" logo={false} right={<Icon name="bell" size={20} color={colors.body} />} />

      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Icon name="search" size={19} color={colors.muted} />
          <AppText style={styles.searchPlaceholder}>제보 번호·제목·위치 검색</AppText>
        </View>
        <View style={styles.controlRow}>
          <Dropdown icon="sort" label="최신순" />
          <Dropdown icon="filter" label="상태 전체" />
          <View style={styles.flex} />
          <View style={styles.viewToggle}>
            <ViewButton icon="list" on={view === 'list'} onPress={() => setView('list')} />
            <ViewButton icon="grid" on={view === 'grid'} onPress={() => setView('grid')} />
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{errorMessage}</AppText>
          <View style={styles.retryWrap}>
            <Button label="다시 시도" icon="refresh" onPress={loadIssues} />
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            view === 'list' ? styles.listContent : styles.gridContent,
            { paddingBottom: tabBarOffset + 24 },
            sortedIssues.length === 0 && styles.emptyContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {sortedIssues.length === 0 ? (
            <AppText style={styles.emptyText}>관할 제보가 없어요.</AppText>
          ) : view === 'list' ? (
            sortedIssues.map((item) => (
              <ListCard key={item.issueGroup.id} item={item} onPress={() => openDetail(item.issueGroup.id)} />
            ))
          ) : (
            sortedIssues.map((item) => (
              <GridCard key={item.issueGroup.id} item={item} onPress={() => openDetail(item.issueGroup.id)} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Dropdown({ icon, label }: { icon: 'sort' | 'filter'; label: string }) {
  return (
    <View style={styles.dropdown}>
      <Icon name={icon} size={15} color={colors.body} />
      <AppText style={styles.dropdownLabel}>{label}</AppText>
      <Icon name="chevD" size={14} color={colors.faint} />
    </View>
  );
}

function ViewButton({ icon, on, onPress }: { icon: 'list' | 'grid'; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.viewButton, on && styles.viewButtonOn]}>
      <Icon name={icon} size={18} color={on ? colors.white : colors.faint} />
    </Pressable>
  );
}

function ListCard({ item, onPress }: { item: AdminIssueItem; onPress: () => void }) {
  const report = item.representativeReport.report;
  const reportStatus = report.status as ReportStatus;
  const location =
    report.roadAddress || `${report.sigungu} ${report.eupmyeondong}`.trim() || '위치 정보 없음';

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.listCard}>
        <View style={styles.listTop}>
          <AppText style={styles.mono}>#{item.issueGroup.id}</AppText>
          <StatusBadge
            status={getReportStatusTone(reportStatus)}
            size="sm"
            label={getReportStatusLabel(reportStatus)}
          />
        </View>
        <AppText style={styles.listTitle}>{item.issueGroup.title || report.title}</AppText>
        <View style={styles.listMeta}>
          <View style={styles.locRow}>
            <Icon name="location" size={14} color={colors.faint} />
            <AppText style={styles.locText} numberOfLines={1}>
              {location}
            </AppText>
          </View>
          <CatChip icon="alert" label={item.category.categoryName} color={colors.brand} />
        </View>
        <AppText style={styles.listSubMeta}>
          제보 {item.issueGroup.reportCount}건 · {formatReportDateTime(item.issueGroup.recentReportedAt)}
        </AppText>
      </Card>
    </Pressable>
  );
}

function GridCard({ item, onPress }: { item: AdminIssueItem; onPress: () => void }) {
  const report = item.representativeReport.report;
  const reportStatus = report.status as ReportStatus;
  const thumb = item.representativeReport.reportImages[0]?.imageUrl;

  return (
    <Pressable onPress={onPress} style={styles.gridItem}>
      <Card padded={false} style={styles.gridCard}>
        <ImageSlot height={78} label="" uri={thumb} />
        <View style={styles.gridBody}>
          <StatusBadge
            status={getReportStatusTone(reportStatus)}
            size="sm"
            label={getReportStatusLabel(reportStatus)}
          />
          <AppText style={styles.gridTitle} numberOfLines={2}>
            {item.issueGroup.title || report.title}
          </AppText>
          <CatChip icon="alert" label={item.category.categoryName} color={colors.brand} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  errorText: { fontSize: 14.5, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  retryWrap: { width: '100%', maxWidth: 220 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  emptyText: { fontSize: 14.5, color: colors.muted, textAlign: 'center' },

  controls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.soft,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
  },
  searchPlaceholder: { fontSize: 14.5, color: colors.muted },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 10,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  dropdownLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  viewButton: { width: 38, height: 36, alignItems: 'center', justifyContent: 'center' },
  viewButtonOn: { backgroundColor: colors.ink },

  listContent: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  listCard: { gap: 0, padding: 14 },
  listTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  mono: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  listTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, lineHeight: 20 },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 9 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  locText: { fontSize: 12.5, color: colors.muted, flex: 1 },
  listSubMeta: { fontSize: 12, color: colors.faint, marginTop: 8 },

  gridContent: { paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47.5%' },
  gridCard: { overflow: 'hidden' },
  gridBody: { padding: 11, gap: 8 },
  gridTitle: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink, lineHeight: 18, minHeight: 36 },
});
