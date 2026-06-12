import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
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
import { colors, fonts, shadow, statusColors, fontSize } from '../../../theme';
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

const ssirenNameLogo = require('../../../assets/SSIREN-name.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_MAP_CENTER = getDefaultMapCenter();
const DEFAULT_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };
const PEEK_CARD_MIN_HEIGHT = 140;
const PEEK_LIST_TOP_PADDING = 12;
const PEEK_LIST_BOTTOM_PADDING = 10;
const PEEK_LIST_HEIGHT =
  PEEK_CARD_MIN_HEIGHT + PEEK_LIST_TOP_PADDING + PEEK_LIST_BOTTOM_PADDING;
const PEEK_COLLAPSE_DRAG_THRESHOLD = 24;
const HEADER_BODY_HEIGHT = Math.min(49, Math.max(40, SCREEN_HEIGHT * 0.05));
const LOGO_WIDTH = Math.min(104, Math.max(88, SCREEN_WIDTH * 0.225));

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
    outputRange: [96, 132 + PEEK_LIST_HEIGHT],
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
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Image source={ssirenNameLogo} style={styles.nameLogo} resizeMode="contain" />
          <View style={styles.headerRight}>
            <View style={styles.jurisPill}>
              <Icon name="building" size={15} color={colors.brand} strokeWidth={2.1} />
              <AppText style={styles.jurisText} numberOfLines={1}>
                {jurisdictionLabel}
              </AppText>
            </View>
            <Pressable style={styles.bellButton} accessibilityLabel="알림">
              <Icon name="bell" size={26} color={colors.brand} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.mapArea}>
        <KakaoMapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialMapRegionRef.current}
          region={region}
          markers={mapMarkers}
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

        <Animated.View style={[styles.fabWrap, { bottom: fabBottom }]} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={moveToCurrentLocation}
            disabled={resolving}
            accessibilityRole="button"
            accessibilityLabel="현재 위치로 이동"
          >
            {resolving ? (
              <ActivityIndicator size="small" color={colors.brandActive} />
            ) : (
              <Icon name="location" size={25} color={colors.brandActive} strokeWidth={2.4} />
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.peek}>
        <View style={styles.peekDragZone} {...peekPanResponder.panHandlers}>
          <View style={styles.peekHandle} />
          <View style={styles.peekHeader}>
            <View style={styles.peekHeaderMain}>
              <AppText style={styles.peekTitle}>
                {isLoadingIssues
                  ? '관할 제보 불러오는 중...'
                  : `내 관할 제보 `}
                {!isLoadingIssues ? (
                  <AppText style={styles.peekCount}>{summary.total}건</AppText>
                ) : null}
              </AppText>
              <View style={styles.countsRow}>
                <Count tone="wait" label="대기" n={summary.wait} />
                <Count tone="prog" label="처리중" n={summary.prog} />
                <Count tone="done" label="완료" n={summary.done} />
              </View>
            </View>
            <Pressable style={styles.inboxLink} onPress={() => router.push('/(officer)/inbox')}>
              <AppText style={styles.inboxLinkText}>제보함</AppText>
              <Icon name="chevR" size={16} color={colors.brand} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        <Animated.View
          style={[
            styles.peekListWrap,
            { height: peekListHeight, opacity: peekListOpacity },
          ]}
          pointerEvents={isPeekExpanded ? 'auto' : 'none'}
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
                    delayPressIn={120}
                    android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
                    style={({ pressed }) => [styles.peekCard, pressed && styles.peekCardPressed]}
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
  headerSafe: {
    backgroundColor: colors.canvas,
    zIndex: 20,
    paddingBottom: 6,
  },
  header: {
    height: HEADER_BODY_HEIGHT,
    paddingLeft: 22,
    paddingRight: 20,
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameLogo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH * 0.31,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jurisPill: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 999,
    backgroundColor: colors.canvas,
    paddingHorizontal: 12,
    paddingVertical: 5,
    maxWidth: SCREEN_WIDTH * 0.52,
  },
  jurisText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.ink },

  mapArea: { flex: 1, backgroundColor: '#eef2e8' },
  map: { flex: 1 },

  fabWrap: { position: 'absolute', right: 30, zIndex: 11 },
  currentLocationButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.fab,
  },

  peek: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
    ...shadow.sheet,
    zIndex: 10,
  },
  peekDragZone: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  peekHandle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#B8B8B8',
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
  peekTitle: {
    fontFamily: fonts.black,
    fontSize: fontSize.display,
    lineHeight: 36,
    color: colors.ink,
  },
  peekCount: {
    fontFamily: fonts.black,
    fontSize: fontSize.display,
    lineHeight: 36,
    color: colors.brand,
  },
  countsRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  count: { fontFamily: fonts.semibold, fontSize: fontSize.sm },
  inboxLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 6 },
  inboxLinkText: { fontFamily: fonts.bold, fontSize: fontSize.mdLg, color: colors.brand },
  peekLoading: { paddingTop: 12, paddingBottom: 0, alignItems: 'center' },
  peekEmpty: { fontSize: fontSize.md, color: colors.muted, paddingTop: 12, paddingBottom: 0 },
  peekListContent: {
    gap: 10,
    paddingTop: PEEK_LIST_TOP_PADDING,
    paddingBottom: PEEK_LIST_BOTTOM_PADDING,
    paddingRight: 4,
  },
  peekCard: {
    width: 264,
    minHeight: PEEK_CARD_MIN_HEIGHT,
    backgroundColor: colors.canvas,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 8,
  },
  peekCardPressed: {
    backgroundColor: colors.soft2,
  },
  peekCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  peekCardTitle: { fontFamily: fonts.semibold, fontSize: fontSize.mdLg, color: colors.ink, lineHeight: 23 },
  peekCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  peekCardCount: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.muted },
  peekCardDot: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.faint },
  peekCardDist: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.muted },
});
