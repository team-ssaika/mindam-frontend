import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { getAppCurrentPosition, requestAppLocationPermission } from '../../../lib/location/appLocation';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { AppBar, AppText, Button, Icon } from '../../../components/ui';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { colors, fontSize, fonts, radius } from '../../../theme';
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

const DASHBOARD_BG = '#F4F5F8';
const CARD_HORIZONTAL_INSET = 38;

function SectionCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function DashboardSectionTitle({
  title,
  right,
  style,
  titleStyle,
}: {
  title: string;
  right?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <AppText style={[styles.sectionTitle, titleStyle]}>{title}</AppText>
      {right ? <AppText style={styles.sectionMeta}>{right}</AppText> : null}
    </View>
  );
}

type FunnelItem = {
  label: string;
  count: number;
  color: string;
};

const FUNNEL_STATUS_COLORS = {
  all: '#111111',
  prog: '#E8A64B',
  done: '#7EC8BF',
  wait: '#7EA7F6',
} as const;

function buildFunnelItems(stats: AdminDashboardStatistics): FunnelItem[] {
  return [
    { label: '전체', count: stats.totalReportCount, color: FUNNEL_STATUS_COLORS.all },
    { label: '처리 중', count: stats.processingReportCount, color: FUNNEL_STATUS_COLORS.prog },
    { label: '완료', count: stats.completedReportCount, color: FUNNEL_STATUS_COLORS.done },
    { label: '지연', count: stats.delayedReportCount, color: FUNNEL_STATUS_COLORS.wait },
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
  const didFocusOnceRef = useRef(false);

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

  useFocusEffect(
    useCallback(() => {
      if (!didFocusOnceRef.current) {
        didFocusOnceRef.current = true;
        return undefined;
      }

      loadStatistics();
      loadUserLocation();
      if (userLocation) {
        reloadDenseAreas();
      }

      return undefined;
    }, [loadStatistics, loadUserLocation, reloadDenseAreas, userLocation])
  );

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
      : `처리 중 ${statistics.processingReportCount}건`
    : '';

  const sortedCategories = useMemo(() => sortCategoriesByCount(categories), [categories]);

  const totalCategoryReports = useMemo(
    () => getCategoryTotalCount(sortedCategories),
    [sortedCategories]
  );

  const denseAreaSectionRight = useMemo(() => {
    if (!userLocation) {
      return '이슈그룹 기준';
    }
    if (isLoadingDenseAreas) {
      return '불러오는 중';
    }
    return `반경 5km · 총 ${denseAreas.length}곳`;
  }, [denseAreas.length, isLoadingDenseAreas, userLocation]);

  return (
    <View style={styles.flex}>
      <AppBar
        title="대시보드"
        logo={false}
        border={false}
        backgroundColor={DASHBOARD_BG}
        right={
          <Pressable onPress={handleRefresh} disabled={isLoading} hitSlop={8}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.ink} />
            ) : (
              <Icon name="refresh" size={22} color={colors.brand} strokeWidth={2.2} />
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
          <SectionCard style={styles.heroCard}>
            <View style={styles.heroHeadlineRow}>
              <AppText style={styles.heroHeadline}>오늘 신규 제보</AppText>
              <AppText style={styles.heroCount}>{statistics.todayNewReportCount}건</AppText>
            </View>
            <View style={styles.heroSubRow}>
              <AppText style={styles.heroSubtitle}>
                이번 달 처리 완료 {statistics.monthlyCompletedReportCount}건
              </AppText>
              <AppText style={styles.heroDate}>{formatTodayLabel()}</AppText>
            </View>
          </SectionCard>

          <SectionCard style={styles.statusCard}>
            <DashboardSectionTitle title="처리 현황" style={styles.statusSectionHeader} titleStyle={styles.statusSectionTitle} />
            <View style={styles.statRow}>
              {funnelItems.map((item, index) => (
                <View key={item.label} style={styles.statColumn}>
                  {index > 0 ? <View style={styles.statSeparator} /> : null}
                  <View style={styles.statPressable}>
                    <AppText style={[styles.statCount, { color: item.color }]}>{item.count}</AppText>
                    <AppText style={styles.statLabel}>{item.label}</AppText>
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard>
            <DashboardSectionTitle title="유형별 제보 수" right="내 관할" />
            {sortedCategories.length > 0 ? (
              <AppText style={styles.categorySummary}>
                {sortedCategories.length}개 유형 · 총 {totalCategoryReports}건
              </AppText>
            ) : null}
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
                  isLast={index === sortedCategories.length - 1}
                />
              ))
            )}
          </SectionCard>

          <SectionCard>
            <DashboardSectionTitle title="주변 밀집 구역" right={denseAreaSectionRight} />
            {!userLocation ? (
              <AppText style={styles.emptyCategoryText}>
                현재 위치 권한이 필요합니다. 위치를 허용하면 주변 밀집 구역을 볼 수 있어요.
              </AppText>
            ) : (
              <OfficerDenseAreaList
                denseAreas={denseAreas.slice(0, 5)}
                isLoading={isLoadingDenseAreas}
                userLocation={userLocation}
                formatDistance={formatDistance}
                getDistanceMeters={getDenseAreaDistance}
                emptyText="반경 5km 안에 밀집 구역이 없습니다."
                contentInset={CARD_HORIZONTAL_INSET}
                edgePadding={0}
              />
            )}
          </SectionCard>

          <SectionCard style={styles.ctaCard}>
            <LinearGradient
              colors={[colors.brand, colors.brandActive]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <View style={styles.ctaText}>
                <AppText style={styles.ctaTitle}>{ctaTitle}</AppText>
                <AppText style={styles.ctaSub}>제보함에서 민원을 확인하세요</AppText>
              </View>
              <Pressable style={styles.ctaButton} onPress={() => router.push('/(officer)/inbox')}>
                <AppText style={styles.ctaButtonText}>처리하기</AppText>
                <Icon name="chevR" size={15} color={colors.ink} />
              </Pressable>
            </LinearGradient>
          </SectionCard>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: DASHBOARD_BG },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  errorText: { fontSize: fontSize.mdLg, color: colors.muted, textAlign: 'center', lineHeight: 23 },
  retryWrap: { width: '100%', maxWidth: 220 },
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
    color: colors.muted,
  },

  heroCard: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  heroHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  heroHeadline: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  heroCount: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.brand,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroSubtitle: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.muted,
  },
  heroDate: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.muted,
    flexShrink: 0,
  },

  statusCard: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  statusSectionHeader: {
    marginBottom: 12,
  },
  statusSectionTitle: {
    fontSize: fontSize.md,
  },

  categorySummary: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: -10,
    marginBottom: 12,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: 2,
    paddingBottom: 0,
    marginHorizontal: -8,
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
    marginVertical: 6,
  },
  statPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  statCount: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: '#777777',
    textAlign: 'center',
  },

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
    fontSize: fontSize.mdLg,
    color: colors.ink,
  },
  emptyCategoryText: {
    fontSize: fontSize.md,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 23,
  },

  ctaCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  cta: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  ctaText: { flex: 1 },
  ctaTitle: { fontFamily: fonts.bold, fontSize: fontSize.base, color: colors.white },
  ctaSub: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  ctaButtonText: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.ink },
});
