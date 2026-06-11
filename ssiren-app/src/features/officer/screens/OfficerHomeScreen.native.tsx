import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAppCurrentPosition, getDefaultMapCenter, requestAppLocationPermission } from '../../../lib/location/appLocation';
import { AppText, CatChip, Icon, StatusBadge } from '../../../components/ui';
import {
  KakaoMapView,
  type KakaoMapRegion,
  type KakaoMapViewHandle,
} from '../../../components/map/KakaoMapView';
import { colors, fonts, radius, shadow, statusColors } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { OfficerDenseAreaLegend } from '../components/OfficerDenseAreaLegend';
import { useOfficerDenseAreas } from '../hooks/useOfficerDenseAreas';
import {
  denseAreaKey,
  denseAreaPolygonCoordinates,
  getDenseAreaColors,
  getMaxDenseAreaCount,
  resolveDenseAreaCenter,
  resolveDenseAreaRadius,
} from '../utils/officerDenseArea';
import type { ReportStatus } from '../../report/types/myReport';
import { getReportStatusLabel, getReportStatusTone } from '../../report/utils/reportStatus';
import { hasValidReportCoordinate } from '../../report/utils/publicReportMap';
import { fetchAdminIssues } from '../api/adminIssueApi';
import type { AdminIssueItem } from '../types/adminIssue';
import {
  adminIssueToPublicReportItem,
  buildAdminIssueQuery,
  hasValidAdminIssueCoordinate,
} from '../utils/adminIssueMap';

const DEFAULT_MAP_CENTER = getDefaultMapCenter();
const DEFAULT_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };
const PEEK_LIST_HEIGHT = 124;
const PEEK_COLLAPSE_DRAG_THRESHOLD = 24;

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

function summarizeIssues(issues: AdminIssueItem[]) {
  return issues.reduce(
    (acc, item) => {
      const status = item.representativeReport?.report?.status as ReportStatus | undefined;
      if (!status) {
        return acc;
      }
      const tone = getReportStatusTone(status);
      acc.total += 1;
      acc[tone] += 1;
      return acc;
    },
    { total: 0, wait: 0, prog: 0, done: 0 }
  );
}

export default function OfficerHomeScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const mapRef = useRef<KakaoMapViewHandle | null>(null);
  const initialMapRegionRef = useRef<KakaoMapRegion>({ ...DEFAULT_MAP_CENTER, ...DEFAULT_DELTA });
  const ignoreRegionChangeUntilRef = useRef(0);
  const isUserDraggingMapRef = useRef(false);
  const [resolving, setResolving] = useState(false);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [region, setRegion] = useState<KakaoMapRegion>({ ...DEFAULT_MAP_CENTER, ...DEFAULT_DELTA });
  const [issues, setIssues] = useState<AdminIssueItem[]>([]);
  const [isPeekExpanded, setIsPeekExpanded] = useState(true);
  const [showDenseAreas, setShowDenseAreas] = useState(true);
  const peekExpandAnim = useRef(new Animated.Value(1)).current;
  const peekDragStart = useRef(1);

  const setPeekExpanded = (expanded: boolean) => {
    setIsPeekExpanded(expanded);
    Animated.spring(peekExpandAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      tension: 90,
      friction: 14,
    }).start();
  };

  const peekPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        peekExpandAnim.stopAnimation((value) => {
          peekDragStart.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(
          1,
          Math.max(0, peekDragStart.current - gesture.dy / PEEK_LIST_HEIGHT)
        );
        peekExpandAnim.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.vy > 0.35 || gesture.dy > PEEK_COLLAPSE_DRAG_THRESHOLD) {
          setPeekExpanded(false);
          return;
        }
        if (gesture.vy < -0.35 || gesture.dy < -PEEK_COLLAPSE_DRAG_THRESHOLD) {
          setPeekExpanded(true);
          return;
        }
        peekExpandAnim.stopAnimation((value) => {
          setPeekExpanded(value >= 0.5);
        });
      },
    })
  ).current;

  const peekListHeight = peekExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PEEK_LIST_HEIGHT],
  });
  const peekListOpacity = peekExpandAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });
  const fabBottom = peekExpandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [tabBarOffset + 96, tabBarOffset + 168],
  });

  const mapReports = useMemo(
    () =>
      issues
        .filter(hasValidAdminIssueCoordinate)
        .map(adminIssueToPublicReportItem)
        .filter((item): item is NonNullable<typeof item> => item != null)
        .filter(hasValidReportCoordinate),
    [issues]
  );

  const mapMarkers = useMemo(
    () =>
      mapReports.map((item) => ({
        id: String(item.issueGroup.id),
        latitude: item.report.latitude,
        longitude: item.report.longitude,
        kind: 'officer' as const,
        reportCount: item.issueGroup.reportCount,
      })),
    [mapReports]
  );

  const summary = useMemo(() => summarizeIssues(issues), [issues]);

  const denseAreaCenter = useMemo(
    () => resolveDenseAreaCenter(region, userLocation),
    [region, userLocation]
  );
  const denseAreaRadius = useMemo(
    () => resolveDenseAreaRadius(region, userLocation),
    [region, userLocation]
  );
  const { denseAreas, isLoading: isLoadingDenseAreas } = useOfficerDenseAreas({
    latitude: denseAreaCenter.latitude,
    longitude: denseAreaCenter.longitude,
    radiusMeters: denseAreaRadius,
    myDepartmentOnly: true,
  });

  const denseAreaPolygons = useMemo(() => {
    if (!showDenseAreas) {
      return [];
    }

    const maxCount = getMaxDenseAreaCount(denseAreas);
    return denseAreas.map((area, index) => {
      const { fill, stroke } = getDenseAreaColors(area.issueGroupCount, maxCount);
      return {
        id: denseAreaKey(area, index),
        coordinates: denseAreaPolygonCoordinates(area),
        fillColor: fill,
        strokeColor: stroke,
      };
    });
  }, [denseAreas, showDenseAreas]);

  const sortedIssues = useMemo(() => {
    const visible = issues.filter(hasValidAdminIssueCoordinate);
    if (!userLocation) {
      return [...visible].sort(
        (a, b) => (b.issueGroup.riskScore ?? 0) - (a.issueGroup.riskScore ?? 0)
      );
    }
    return [...visible].sort(
      (a, b) =>
        distanceMeters(userLocation, {
          latitude: a.issueGroup.groupLatitude,
          longitude: a.issueGroup.groupLongitude,
        }) -
        distanceMeters(userLocation, {
          latitude: b.issueGroup.groupLatitude,
          longitude: b.issueGroup.groupLongitude,
        })
    );
  }, [issues, userLocation]);

  const jurisdictionLabel = useMemo(() => {
    const department = issues[0]?.department;
    if (!department) {
      return '내 관할 제보';
    }
    return `${department.agencyType.name} · ${department.name} 관할`;
  }, [issues]);

  const syncMapRegion = (nextRegion: KakaoMapRegion, duration = 600) => {
    ignoreRegionChangeUntilRef.current = Date.now() + duration + 500;
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, duration);
  };

  const handleRegionChangeComplete = (nextRegion: KakaoMapRegion) => {
    if (Date.now() < ignoreRegionChangeUntilRef.current) {
      return;
    }
    if (!isUserDraggingMapRef.current) {
      return;
    }
    isUserDraggingMapRef.current = false;
    setRegion(nextRegion);
  };

  const focusCoordinate = (latitude: number, longitude: number) => {
    syncMapRegion({ latitude, longitude, ...DEFAULT_DELTA }, 500);
  };

  const focusIssue = (item: AdminIssueItem) => {
    const { groupLatitude, groupLongitude } = item.issueGroup;
    focusCoordinate(groupLatitude, groupLongitude);
  };

  const openIssueDetail = (item: AdminIssueItem) => {
    router.push(`/officer-report/${item.issueGroup.id}`);
  };

  const moveToCurrentLocation = async () => {
    try {
      setResolving(true);
      const granted = await requestAppLocationPermission();
      if (!granted) {
        return;
      }
      const position = await getAppCurrentPosition();
      setUserLocation(position);
      syncMapRegion({ ...position, ...DEFAULT_DELTA });
    } catch {
      // ignore
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    moveToCurrentLocation();
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoadingIssues(true);

    fetchAdminIssues({
      ...buildAdminIssueQuery(region, userLocation),
      myDepartmentOnly: true,
    })
      .then((data) => {
        if (!mounted) return;
        setIssues(Array.isArray(data.issues) ? data.issues : []);
      })
      .catch((error) => {
        console.log('[OfficerMap] fetch admin issues error', error);
        if (!mounted) return;
        setIssues([]);
      })
      .finally(() => {
        if (mounted) setIsLoadingIssues(false);
      });

    return () => {
      mounted = false;
    };
  }, [region, userLocation]);

  return (
    <View style={styles.container}>
      <KakaoMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialMapRegionRef.current}
        region={region}
        markers={mapMarkers}
        polygons={denseAreaPolygons}
        userLocation={userLocation}
        showsUserLocation
        onMapDragStart={() => {
          isUserDraggingMapRef.current = true;
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMarkerPress={(markerId) => {
          router.push(`/officer-report/${markerId}`);
        }}
      />

      <SafeAreaView edges={['top']} style={styles.topSafe} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="box-none">
          <View style={styles.logoCard}>
            <View style={styles.logoMark}>
              <Icon name="marker" size={15} color={colors.white} fill />
            </View>
            <AppText variant="heading" color={colors.ink}>
              시민제보
            </AppText>
            <View style={styles.roleBadge}>
              <AppText style={styles.roleBadgeText}>담당자</AppText>
            </View>
          </View>
          <Pressable style={styles.bellButton} accessibilityLabel="알림">
            <Icon name="bell" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.chipRow} pointerEvents="box-none">
          <View style={styles.jurisChip}>
            <Icon name="building" size={16} color={colors.brand} />
            <AppText style={styles.jurisText}>{jurisdictionLabel}</AppText>
          </View>
          {showDenseAreas ? (
            <OfficerDenseAreaLegend
              areaCount={isLoadingDenseAreas ? undefined : denseAreas.length}
            />
          ) : null}
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.fabColumn, { bottom: fabBottom }]} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.fab, showDenseAreas && styles.fabActive]}
          onPress={() => setShowDenseAreas((prev) => !prev)}
          accessibilityLabel="밀집 구역 표시"
        >
          <Icon name="layers" size={21} color={showDenseAreas ? colors.brand : colors.ink} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, styles.fabPrimary]}
          onPress={moveToCurrentLocation}
          disabled={resolving}
        >
          {resolving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Icon name="location" size={22} color={colors.white} />
          )}
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.peek}>
        <View style={styles.peekDragZone} {...peekPanResponder.panHandlers}>
          <View style={styles.peekHandle} />
          <View style={styles.peekHeader}>
            <View style={styles.peekHeaderMain}>
              <AppText variant="section" color={colors.ink}>
                {isLoadingIssues ? '관할 제보 불러오는 중...' : `내 관할 제보 ${summary.total}건`}
              </AppText>
              <View style={styles.countsRow}>
                <Count tone="wait" label="대기" n={summary.wait} />
                <Count tone="prog" label="처리중" n={summary.prog} />
                <Count tone="done" label="완료" n={summary.done} />
              </View>
            </View>
            <Pressable style={styles.inboxLink} onPress={() => router.push('/(officer)/inbox')}>
              <AppText style={styles.inboxLinkText}>제보함</AppText>
              <Icon name="chevR" size={16} color={colors.brand} />
            </Pressable>
          </View>
        </View>

        <Animated.View
          style={[
            styles.peekListWrap,
            { height: peekListHeight, opacity: peekListOpacity },
          ]}
          pointerEvents={isPeekExpanded ? 'auto' : 'none'}
          {...peekPanResponder.panHandlers}
        >
          {isLoadingIssues ? (
            <View style={styles.peekLoading}>
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          ) : sortedIssues.length === 0 ? (
            <AppText style={styles.peekEmpty}>현재 지도 영역에 관할 제보가 없어요.</AppText>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.peekListContent}
            >
              {sortedIssues.map((item) => {
                const report = item.representativeReport.report;
                const reportStatus = report.status as ReportStatus;
                const dist = userLocation
                  ? formatDistance(
                      distanceMeters(userLocation, {
                        latitude: item.issueGroup.groupLatitude,
                        longitude: item.issueGroup.groupLongitude,
                      })
                    )
                  : null;

                return (
                  <Pressable
                    key={item.issueGroup.id}
                    style={styles.peekCard}
                    onPress={() => {
                      focusIssue(item);
                      openIssueDetail(item);
                    }}
                  >
                    <View style={styles.peekCardTop}>
                      <CatChip
                        icon="alert"
                        label={item.category.categoryName}
                        color={colors.brand}
                      />
                      <StatusBadge
                        status={getReportStatusTone(reportStatus)}
                        size="sm"
                        label={getReportStatusLabel(reportStatus)}
                      />
                    </View>
                    <AppText style={styles.peekCardTitle} numberOfLines={2}>
                      {item.issueGroup.title || report.title}
                    </AppText>
                    <View style={styles.peekCardMeta}>
                      <AppText style={styles.peekCardCount}>
                        제보 {item.issueGroup.reportCount}건
                      </AppText>
                      {dist ? (
                        <>
                          <AppText style={styles.peekCardDot}>·</AppText>
                          <Icon name="location" size={13} color={colors.faint} />
                          <AppText style={styles.peekCardDist}>{dist}</AppText>
                        </>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

function Count({ tone, label, n }: { tone: 'wait' | 'prog' | 'done'; label: string; n: number }) {
  return (
    <AppText style={[styles.count, { color: statusColors[tone].dot }]}>
      ● {label} {n}
    </AppText>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  map: { flex: 1 },

  topSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  logoCard: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.canvas,
    borderRadius: 14,
    paddingHorizontal: 14,
    ...shadow.float,
  },
  logoMark: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: { backgroundColor: colors.brandSoft, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7 },
  roleBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.brand },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  chipRow: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  jurisChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    ...shadow.float,
  },
  jurisText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },

  fabColumn: { position: 'absolute', right: 16, gap: 10 },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  fabPrimary: { backgroundColor: colors.brand, borderWidth: 0 },
  fabActive: { borderColor: colors.brandSoft, backgroundColor: colors.brandSoft },

  peek: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    ...shadow.sheet,
  },
  peekDragZone: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  peekHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d8dbe1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  peekListWrap: {
    overflow: 'hidden',
  },
  peekHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  peekHeaderMain: { flex: 1 },
  countsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  count: { fontFamily: fonts.semibold, fontSize: 12.5 },
  inboxLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
  inboxLinkText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.brand },
  peekLoading: { paddingTop: 12, paddingBottom: 0, alignItems: 'center' },
  peekEmpty: { fontSize: 13.5, color: colors.muted, paddingTop: 12, paddingBottom: 0 },
  peekListContent: { gap: 10, paddingTop: 12, paddingBottom: 0, paddingRight: 4 },
  peekCard: {
    width: 228,
    backgroundColor: colors.soft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 13,
    gap: 8,
  },
  peekCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  peekCardTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, lineHeight: 19 },
  peekCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  peekCardCount: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
  peekCardDot: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.faint },
  peekCardDist: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted },
});
