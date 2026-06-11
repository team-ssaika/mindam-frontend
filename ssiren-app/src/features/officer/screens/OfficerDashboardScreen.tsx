import axios from 'axios';
import { getAppCurrentPosition, requestAppLocationPermission } from '../../../lib/location/appLocation';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppBar, AppText, Button, Icon, SectionLabel } from '../../../components/ui';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { colors, fonts, layout, radius, statusColors, type StatusKey } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { DashboardCategoryStatRow } from '../components/DashboardCategoryStatRow';
import { OfficerDenseAreaList } from '../components/OfficerDenseAreaList';
import {
  fetchAdminDashboardCategories,
  fetchAdminDashboardStatistics,
} from '../api/adminDashboardApi';
import { useOfficerDenseAreas } from '../hooks/useOfficerDenseAreas';
import type {
  AdminDashboardCategoryCount,
  AdminDashboardDenseAreaItem,
  AdminDashboardStatistics,
} from '../types/adminDashboard';
import {
  getCategoryTotalCount,
  sortCategoriesByCount,
} from '../utils/dashboardCategoryDisplay';

type FunnelItem = {
  label: string;
  count: number;
  tone: StatusKey | 'all';
};

function buildFunnelItems(stats: AdminDashboardStatistics): FunnelItem[] {
  return [
    { label: '전체', count: stats.totalReportCount, tone: 'all' },
    { label: '처리 전·중', count: stats.processingReportCount, tone: 'prog' },
    { label: '완료', count: stats.completedReportCount, tone: 'done' },
    { label: '지연', count: stats.delayedReportCount, tone: 'wait' },
  ];
}

function formatTodayLabel() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

export function OfficerDashboardScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const [statistics, setStatistics] = useState<AdminDashboardStatistics | null>(null);
  const [categories, setCategories] = useState<AdminDashboardCategoryCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  const {
    denseAreas,
    isLoading: isLoadingDenseAreas,
    reload: reloadDenseAreas,
  } = useOfficerDenseAreas({
    latitude: userLocation?.latitude ?? null,
    longitude: userLocation?.longitude ?? null,
    myDepartmentOnly: true,
    enabled: userLocation != null,
  });

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [statsData, categoryData] = await Promise.all([
        fetchAdminDashboardStatistics({ myDepartmentOnly: true }),
        fetchAdminDashboardCategories({ myDepartmentOnly: true }),
      ]);
      setStatistics(statsData);
      setCategories(categoryData.categories);
    } catch (error) {
      let message = '대시보드 통계를 불러오지 못했습니다.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        message = typeof apiMessage === 'string' ? apiMessage : error.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      if (axios.isAxiosError(error) && !error.response) {
        message = `${message}\n\n요청 주소: ${resolveApiBaseUrl()}`;
      }
      setStatistics(null);
      setCategories([]);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserLocation = useCallback(async () => {
    try {
      const granted = await requestAppLocationPermission();
      if (!granted) {
        setUserLocation(null);
        return;
      }
      setUserLocation(await getAppCurrentPosition());
    } catch {
      setUserLocation(null);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadStatistics(), loadUserLocation()]);
    if (userLocation) {
      await reloadDenseAreas();
    }
  }, [loadStatistics, loadUserLocation, reloadDenseAreas, userLocation]);

  useEffect(() => {
    loadStatistics();
    loadUserLocation();
  }, [loadStatistics, loadUserLocation]);

  const getDenseAreaDistance = useCallback(
    (area: AdminDashboardDenseAreaItem) => {
      if (!userLocation) {
        return null;
      }
      return distanceMeters(userLocation, {
        latitude: area.centerLatitude,
        longitude: area.centerLongitude,
      });
    },
    [userLocation]
  );

  const funnelItems = useMemo(
    () => (statistics ? buildFunnelItems(statistics) : []),
    [statistics]
  );

  const ctaTitle = statistics
    ? statistics.delayedReportCount > 0
      ? `지연 제보 ${statistics.delayedReportCount}건`
      : `처리 전·중 ${statistics.processingReportCount}건`
    : '';

  const sortedCategories = useMemo(() => sortCategoriesByCount(categories), [categories]);

  const totalCategoryReports = useMemo(
    () => getCategoryTotalCount(sortedCategories),
    [sortedCategories]
  );

  return (
    <View style={styles.flex}>
      <AppBar
        title="대시보드"
        logo={false}
        right={
          <Pressable onPress={handleRefresh} disabled={isLoading} hitSlop={8}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.ink} />
            ) : (
              <Icon name="refresh" size={20} color={colors.body} />
            )}
          </Pressable>
        }
      />

      {isLoading && !statistics ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{errorMessage}</AppText>
          <View style={styles.retryWrap}>
            <Button label="다시 시도" icon="refresh" onPress={handleRefresh} />
          </View>
        </View>
      ) : statistics ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <AppText style={styles.heroEyebrow}>내 관할 · {formatTodayLabel()}</AppText>
            <View style={styles.heroHeadlineRow}>
              <AppText variant="heading" color={colors.ink} style={styles.heroHeadline}>
                오늘 신규 제보
              </AppText>
              <AppText style={styles.heroCount}>{statistics.todayNewReportCount}건</AppText>
            </View>
            <AppText style={styles.heroSubtitle}>
              이번 달 처리 완료 {statistics.monthlyCompletedReportCount}건
            </AppText>
          </View>

          <View style={styles.statusSection}>
            <AppText style={styles.statusSectionTitle}>처리 현황</AppText>
            <View style={styles.statusGrid}>
              {funnelItems.map((item) => {
                const color = item.tone === 'all' ? colors.ink : statusColors[item.tone].dot;
                return (
                  <View key={item.label} style={styles.statusCard}>
                    <AppText style={[styles.statusCount, { color }]}>{item.count}</AppText>
                    <View style={styles.statusLabelRow}>
                      <View style={[styles.statusDot, { backgroundColor: color }]} />
                      <AppText style={styles.statusLabel} numberOfLines={2}>
                        {item.label}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionLabel title="유형별 제보 수" right="내 관할" />
              {sortedCategories.length > 0 ? (
                <AppText style={styles.categorySummary}>
                  {sortedCategories.length}개 유형 · 총 {totalCategoryReports}건
                </AppText>
              ) : null}
            </View>
            <View style={styles.categoryRows}>
              {sortedCategories.length === 0 ? (
                <View style={styles.emptyCategoryBox}>
                  <View style={styles.emptyCategoryIcon}>
                    <Icon name="chart" size={22} color={colors.faint} />
                  </View>
                  <AppText style={styles.emptyCategoryTitle}>집계된 제보 유형이 없어요</AppText>
                  <AppText style={styles.emptyCategoryText}>
                    담당 구역에 접수된 제보가 쌓이면 유형별 통계가 표시됩니다.
                  </AppText>
                </View>
              ) : (
                sortedCategories.map((item, index) => (
                  <DashboardCategoryStatRow
                    key={item.categoryId}
                    item={item}
                    rank={index + 1}
                    totalCount={totalCategoryReports}
                  />
                ))
              )}
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionLabel title="주변 밀집 구역" right="이슈그룹 기준" />
            </View>
            {!userLocation ? (
              <AppText style={styles.emptyCategoryText}>
                현재 위치 권한이 필요합니다. 위치를 허용하면 주변 밀집 구역을 볼 수 있어요.
              </AppText>
            ) : (
              <View style={styles.denseListWrap}>
                <OfficerDenseAreaList
                  denseAreas={denseAreas.slice(0, 5)}
                  isLoading={isLoadingDenseAreas}
                  formatDistance={formatDistance}
                  getDistanceMeters={getDenseAreaDistance}
                  onPressArea={() => router.push('/(officer)')}
                  emptyText="반경 5km 안에 밀집 구역이 없습니다."
                />
              </View>
            )}
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.ctaSection}>
            <View style={styles.cta}>
              <View style={styles.ctaText}>
                <AppText style={styles.ctaTitle}>{ctaTitle}</AppText>
                <AppText style={styles.ctaSub}>제보함에서 오래된 순으로 처리해 보세요</AppText>
              </View>
              <Pressable style={styles.ctaButton} onPress={() => router.push('/(officer)/inbox')}>
                <AppText style={styles.ctaButtonText}>처리하기</AppText>
                <Icon name="chevR" size={15} color={colors.ink} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  errorText: { fontSize: 14.5, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  retryWrap: { width: '100%', maxWidth: 220 },
  content: { paddingTop: 8 },

  heroSection: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
  },
  heroEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.muted,
  },
  heroHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroHeadline: {
    flex: 1,
    minWidth: 0,
  },
  heroCount: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.brand,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
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
    paddingHorizontal: layout.screenPadding,
    marginBottom: 8,
    gap: 4,
  },
  categorySummary: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.muted,
  },
  categoryRows: {
    gap: 2,
    paddingHorizontal: layout.screenPadding,
  },

  statusSection: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 4,
    paddingBottom: 22,
    gap: 16,
  },
  statusSectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.muted,
    letterSpacing: -0.1,
  },
  statusGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  statusLabelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
    minHeight: 30,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  statusLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.body,
    textAlign: 'center',
    lineHeight: 15,
  },
  statusCount: {
    fontFamily: fonts.bold,
    fontSize: 24,
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  denseListWrap: { paddingHorizontal: layout.screenPadding },
  emptyCategoryBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.soft2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCategoryTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.ink,
  },
  emptyCategoryText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: layout.screenPadding,
  },

  ctaSection: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 18,
    paddingBottom: 18,
  },
  cta: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaText: { flex: 1 },
  ctaTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  ctaSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  ctaButtonText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
});
