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
import { AppBar, AppText, Button, Card, Icon, SectionLabel } from '../../../components/ui';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { colors, fonts, radius, statusColors, type StatusKey } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
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

const CATEGORY_BAR_COLORS = [colors.coral, colors.mustard, colors.brand, colors.mint, colors.faint];

const CATEGORY_CODE_COLOR: Record<string, string> = {
  TRAFFIC: colors.mint,
  ENVIRONMENT: colors.mustard,
  FACILITY: colors.coral,
  LIFE_INCONVENIENCE: colors.brand,
  PUBLIC_SAFETY: colors.brand,
  WELFARE: colors.faint,
  DISASTER_SAFETY: colors.coral,
  ETC: colors.faint,
  SAFETY: colors.brand,
};

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

  const maxCategoryCount = useMemo(
    () => Math.max(1, ...categories.map((item) => item.reportCount)),
    [categories]
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
          <View>
            <AppText style={styles.dept}>내 관할 · {formatTodayLabel()}</AppText>
            <AppText variant="title" color={colors.ink} style={styles.headline}>
              오늘 신규 제보 {statistics.todayNewReportCount}건
            </AppText>
            <AppText style={styles.subHeadline}>
              이번 달 처리 완료 {statistics.monthlyCompletedReportCount}건
            </AppText>
          </View>

          <View style={styles.funnelRow}>
            {funnelItems.map((item, index) => {
              const color = item.tone === 'all' ? colors.ink : statusColors[item.tone].dot;
              return (
                <View key={item.label} style={styles.funnelItem}>
                  <View style={styles.funnelTile}>
                    <AppText style={[styles.funnelCount, { color }]}>{item.count}</AppText>
                    <AppText style={styles.funnelLabel}>{item.label}</AppText>
                  </View>
                  {index < funnelItems.length - 1 ? (
                    <Icon name="chevR" size={14} color={colors.faint} />
                  ) : null}
                </View>
              );
            })}
          </View>

          <Card style={styles.graphCard}>
            <SectionLabel title="유형별 제보 수" right="내 관할" />
            <View style={styles.graphRows}>
              {categories.length === 0 ? (
                <AppText style={styles.emptyCategoryText}>집계된 제보 유형이 없습니다.</AppText>
              ) : (
                categories.map((item, index) => (
                  <View key={item.categoryId} style={styles.graphRow}>
                    <AppText style={styles.graphLabel} numberOfLines={1}>
                      {item.categoryName}
                    </AppText>
                    <View style={styles.graphTrack}>
                      <View
                        style={[
                          styles.graphFill,
                          {
                            width: `${(item.reportCount / maxCategoryCount) * 100}%`,
                            backgroundColor:
                              CATEGORY_CODE_COLOR[item.categoryCode] ??
                              CATEGORY_BAR_COLORS[index % CATEGORY_BAR_COLORS.length],
                          },
                        ]}
                      />
                    </View>
                    <AppText style={styles.graphValue}>{item.reportCount}</AppText>
                  </View>
                ))
              )}
            </View>
          </Card>

          <Card style={styles.denseCard}>
            <SectionLabel title="주변 밀집 구역" right="이슈그룹 기준" />
            {!userLocation ? (
              <AppText style={styles.emptyCategoryText}>
                현재 위치 권한이 필요합니다. 위치를 허용하면 주변 밀집 구역을 볼 수 있어요.
              </AppText>
            ) : (
              <OfficerDenseAreaList
                denseAreas={denseAreas.slice(0, 5)}
                isLoading={isLoadingDenseAreas}
                formatDistance={formatDistance}
                getDistanceMeters={getDenseAreaDistance}
                onPressArea={() => router.push('/(officer)')}
                emptyText="반경 5km 안에 밀집 구역이 없습니다."
              />
            )}
          </Card>

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
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  errorText: { fontSize: 14.5, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  retryWrap: { width: '100%', maxWidth: 220 },
  content: { paddingHorizontal: 18, paddingTop: 16, gap: 16 },
  dept: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  headline: { marginTop: 3 },
  subHeadline: { marginTop: 6, fontSize: 13.5, color: colors.muted },

  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  funnelItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  funnelTile: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 13,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  funnelCount: { fontFamily: fonts.bold, fontSize: 23, letterSpacing: -0.6 },
  funnelLabel: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.muted, marginTop: 3 },

  graphCard: {},
  denseCard: {},
  graphRows: { gap: 13 },
  graphRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  graphLabel: { width: 64, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.body },
  graphTrack: { flex: 1, height: 18, backgroundColor: colors.soft2, borderRadius: 6, overflow: 'hidden' },
  graphFill: { height: '100%', borderRadius: 6 },
  graphValue: { width: 28, textAlign: 'right', fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  emptyCategoryText: { fontSize: 13.5, color: colors.muted, textAlign: 'center', paddingVertical: 8 },

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
