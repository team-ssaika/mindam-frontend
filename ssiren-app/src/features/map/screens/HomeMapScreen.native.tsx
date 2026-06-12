import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  getAppCurrentPosition,
  getDefaultMapCenter,
  requestAppLocationPermission,
} from '../../../lib/location/appLocation';
import { Icon } from '../../../components/ui';
import {
  KakaoMapView,
  type KakaoMapCircle,
  type KakaoMapRegion,
  type KakaoMapViewHandle,
} from '../../../components/map/KakaoMapView';
import { fetchIssueDetail, fetchIssues } from '../../report/api/issueApi';
import { ReportDetailBottomSheet } from '../../report/components/ReportDetailBottomSheet';
import type { ReportDetail } from '../../report/types/reportDetail';
import type { PublicReportItem } from '../../report/types/publicReport';
import {
  hasValidIssueCoordinate,
  hasValidReportCoordinate,
  issueDetailToPublicReportItem,
  issueToPublicReportItem,
  toMapReportDetail,
} from '../../report/utils/publicReportMap';
import { fonts } from '../../../theme';

const ssirenNameLogo = require('../../../assets/SSIREN-name.png');
const ssirenMarkerLogo = require('../../../assets/ssiren-logo.png');
const markerIconUri = Image.resolveAssetSource(ssirenMarkerLogo).uri;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SKY = '#7EC8F7';
const SKY_DARK = '#55B5F0';
const SKY_SOFT = 'rgba(126, 200, 247, 0.22)';
const TEXT = '#050505';
const MUTED = '#777777';
const DANGER = '#D95E5E';
const HEADER_BODY_HEIGHT = Math.min(49, Math.max(40, SCREEN_HEIGHT * 0.05));
const LOGO_WIDTH = Math.min(104, Math.max(88, SCREEN_WIDTH * 0.225));
const SEARCH_TOP_OFFSET = 14;
const SEARCH_HEIGHT = 48;
const SEARCH_SIDE = 27;
const BOTTOM_SHEET_HEIGHT = Math.min(Math.max(SCREEN_HEIGHT * 0.37, 292), 326);
const COLLAPSED_SHEET_HEIGHT = 74;
const CARD_WIDTH = Math.min(304, Math.max(264, SCREEN_WIDTH * 0.64));
const DEFAULT_MAP_CENTER = getDefaultMapCenter();
const DEFAULT_DELTA = { latitudeDelta: 0.012, longitudeDelta: 0.012 };
const EXPANDED_DELTA = { latitudeDelta: 0.0045, longitudeDelta: 0.0045 };

type LatLng = { latitude: number; longitude: number };

type NearbyReport = {
  id: string;
  latitude: number;
  longitude: number;
  keyword: string;
  title: string;
  riskScore: number;
  createdAt: string;
  address?: string;
  sigungu?: string;
  eupmyeondong?: string;
  count: number;
  issueGroupId?: number;
  reportId?: number;
  source?: PublicReportItem;
};

type ClusterMarker = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  reports: NearbyReport[];
  isCluster: boolean;
};

const ENGLISH_ADDRESS_FALLBACKS: Record<string, string> = {
  'Yeoksam-dong': '강남구 역삼동',
  Yeoksam: '강남구 역삼동',
  Gangnam: '강남구 역삼동',
  'Gangnam-gu': '강남구 역삼동',
  Gongdeok: '마포구 공덕동',
  'Gongdeok-dong': '마포구 공덕동',
  Mapo: '마포구 공덕동',
};

function makeMockReports(center: LatLng = DEFAULT_MAP_CENTER): NearbyReport[] {
  return [
    {
      id: 'mock-7',
      latitude: center.latitude + 0.0018,
      longitude: center.longitude - 0.0014,
      keyword: '쓰레기 무단투기',
      title: '역삼동 인근 일반 쓰레기 봉투 무단투기',
      riskScore: 64.5,
      createdAt: new Date(Date.now() - 19 * 60_000).toISOString(),
      address: '강남구 역삼동',
      sigungu: '강남구',
      eupmyeondong: '역삼동',
      count: 7,
    },
    {
      id: 'mock-13',
      latitude: center.latitude - 0.0009,
      longitude: center.longitude - 0.0026,
      keyword: '쓰레기 무단투기',
      title: '역삼동 인근 일반 쓰레기 봉투 무단투기',
      riskScore: 64.5,
      createdAt: new Date(Date.now() - 36 * 60_000).toISOString(),
      address: '강남구 역삼동',
      sigungu: '강남구',
      eupmyeondong: '역삼동',
      count: 13,
    },
    {
      id: 'mock-22',
      latitude: center.latitude - 0.0015,
      longitude: center.longitude + 0.0018,
      keyword: '도로 파손',
      title: '역삼역 주변 보도블록 파손으로 보행 위험',
      riskScore: 72,
      createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
      address: '강남구 역삼동',
      sigungu: '강남구',
      eupmyeondong: '역삼동',
      count: 22,
    },
  ];
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function buildIssueQuery(region: KakaoMapRegion, userLocation: LatLng | null) {
  if (userLocation && distanceMeters(userLocation, region) < 120) {
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radiusMeters: 5000,
    };
  }

  return {
    swLat: region.latitude - region.latitudeDelta / 2,
    swLng: region.longitude - region.longitudeDelta / 2,
    neLat: region.latitude + region.latitudeDelta / 2,
    neLng: region.longitude + region.longitudeDelta / 2,
  };
}

function parseReportDate(value: string) {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  return new Date(normalized).getTime();
}

function formatTimeAgo(createdAt: string) {
  const time = parseReportDate(createdAt);
  if (Number.isNaN(time)) {
    return '';
  }

  const diffMinutes = Math.max(Math.floor((Date.now() - time) / 60_000), 0);
  if (diffMinutes < 1) return '방금전';
  if (diffMinutes < 60) return `${diffMinutes}분전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일전`;
}

function compactAddress(report?: Pick<NearbyReport, 'sigungu' | 'eupmyeondong' | 'address'> | null) {
  if (!report) {
    return '내 주변';
  }

  if (report.sigungu || report.eupmyeondong) {
    return [report.sigungu, report.eupmyeondong].filter(Boolean).join(' ');
  }

  const address = report.address?.trim();
  if (!address) {
    return '내 주변';
  }

  for (const [english, korean] of Object.entries(ENGLISH_ADDRESS_FALLBACKS)) {
    if (address.includes(english)) {
      return korean;
    }
  }

  const koreanTokens = address.match(/[가-힣]+(?:구|군|시|동|읍|면|로|길)/g);
  if (koreanTokens && koreanTokens.length > 0) {
    return koreanTokens.slice(0, 2).join(' ');
  }

  return '강남구 역삼동';
}

function mapPublicReport(item: PublicReportItem): NearbyReport {
  return {
    id: String(item.issueGroup.id),
    latitude: item.report.latitude,
    longitude: item.report.longitude,
    keyword: item.category.categoryName || '제보',
    title: item.issueGroup.title || item.report.title || '주변 제보',
    riskScore: Number(item.report.riskScore ?? item.issueGroup.riskScore ?? 0),
    createdAt: item.report.createdAt || item.issueGroup.recentReportedAt,
    address: item.report.roadAddress || item.report.jibunAddress,
    sigungu: item.report.sigungu,
    eupmyeondong: item.report.eupmyeondong,
    count: Math.max(Number(item.issueGroup.reportCount ?? 1), 1),
    issueGroupId: item.issueGroup.id,
    reportId: item.report.id,
    source: item,
  };
}

function toNearbyReportDetail(
  item: NearbyReport,
  userLocation?: LatLng | null
): ReportDetail {
  if (item.source) {
    return toMapReportDetail(item.source, userLocation);
  }

  return {
    id: item.reportId != null ? String(item.reportId) : item.id,
    title: item.title,
    riskLabel: `위험지수 ${Number(item.riskScore).toFixed(1)}`,
    timeAgo: formatTimeAgo(item.createdAt),
    distance:
      userLocation != null
        ? `${Math.round(distanceMeters(userLocation, item))}m`
        : '-',
    address: item.address || compactAddress(item),
    summary: item.title,
    category: item.keyword,
    yesCount: item.count,
    organization: item.keyword,
    status: '접수됨',
  };
}

function clusterThresholdMeters(region: KakaoMapRegion) {
  const delta = Math.max(region.latitudeDelta, region.longitudeDelta);
  if (delta <= 0.007) return 0;
  if (delta <= 0.014) return 120;
  if (delta <= 0.03) return 260;
  if (delta <= 0.07) return 520;
  return 900;
}

function expandReport(report: NearbyReport): NearbyReport[] {
  const count = Math.max(Math.round(report.count), 1);
  if (count === 1) {
    return [{ ...report, count: 1 }];
  }

  const spread = 0.00018;
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count;
    const ring = spread * (1 + (index % 3) * 0.45);
    return {
      ...report,
      id: `${report.id}-${index + 1}`,
      latitude: report.latitude + Math.sin(angle) * ring,
      longitude: report.longitude + Math.cos(angle) * ring,
      count: 1,
    };
  });
}

function buildClusters(reports: NearbyReport[], region: KakaoMapRegion): ClusterMarker[] {
  const threshold = clusterThresholdMeters(region);
  if (threshold === 0) {
    return reports.flatMap((report) =>
      expandReport(report).map((item) => ({
        id: `report-${item.id}`,
        latitude: item.latitude,
        longitude: item.longitude,
        count: 1,
        reports: [item],
        isCluster: false,
      }))
    );
  }

  const used = new Set<string>();
  const clusters: ClusterMarker[] = [];

  reports.forEach((report) => {
    if (used.has(report.id)) {
      return;
    }

    const group = [report];
    used.add(report.id);

    reports.forEach((candidate) => {
      if (used.has(candidate.id)) {
        return;
      }

      if (distanceMeters(report, candidate) <= threshold) {
        group.push(candidate);
        used.add(candidate.id);
      }
    });

    const latitude = group.reduce((sum, item) => sum + item.latitude, 0) / group.length;
    const longitude = group.reduce((sum, item) => sum + item.longitude, 0) / group.length;
    const count = group.reduce((sum, item) => sum + item.count, 0);

    clusters.push({
      id: group.length === 1 ? `report-${group[0].id}` : `cluster-${clusters.length}`,
      latitude,
      longitude,
      count,
      reports: group,
      isCluster: group.length > 1,
    });
  });

  return clusters;
}

function buildDensityCircles(clusters: ClusterMarker[], region: KakaoMapRegion): KakaoMapCircle[] {
  const delta = Math.max(region.latitudeDelta, region.longitudeDelta);
  return clusters
    .filter((cluster) => cluster.isCluster || cluster.count > 1)
    .map((cluster) => ({
      id: `density-${cluster.id}`,
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      radiusMeters: Math.min(Math.max(delta * 8200, 170), 390) + cluster.count * 4,
      fillColor: SKY_SOFT,
      strokeColor: 'rgba(126, 200, 247, 0.05)',
    }));
}

async function resolveAddressLabel(location: LatLng, fallback?: NearbyReport | null) {
  try {
    const [address] = await Location.reverseGeocodeAsync(location);
    const sigungu = address?.district || address?.city;
    const dong = address?.subregion || address?.street;
    const label = [sigungu, dong].filter(Boolean).join(' ');
    if (label && /[가-힣]/.test(label)) {
      return label;
    }
  } catch (error) {
    console.log('[Location] reverse geocode failed', error);
  }

  return compactAddress(fallback);
}

export default function HomeMapScreen() {
  const mapRef = useRef<KakaoMapViewHandle | null>(null);
  const detailRequestIdRef = useRef(0);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [currentRegion, setCurrentRegion] = useState<KakaoMapRegion>({
    ...DEFAULT_MAP_CENTER,
    ...DEFAULT_DELTA,
  });
  const [nearbyReports, setNearbyReports] = useState<NearbyReport[]>([]);
  const [selectedReports, setSelectedReports] = useState<NearbyReport[]>([]);
  const [currentAddressLabel, setCurrentAddressLabel] = useState('내 주변');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(true);
  const [detailSheetReport, setDetailSheetReport] = useState<ReportDetail | null>(null);

  const closeReportDetail = useCallback(() => {
    detailRequestIdRef.current += 1;
    setDetailSheetReport(null);
  }, []);

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 18) {
            setIsSheetExpanded(false);
          } else if (gesture.dy < -18) {
            setIsSheetExpanded(true);
          }
        },
      }),
    []
  );

  const visibleReports = selectedReports.length > 0 ? selectedReports : nearbyReports;
  const sheetHeight = isSheetExpanded ? BOTTOM_SHEET_HEIGHT : COLLAPSED_SHEET_HEIGHT;

  const clusters = useMemo(
    () => buildClusters(nearbyReports, currentRegion),
    [currentRegion, nearbyReports]
  );

  const markers = useMemo(
    () =>
      clusters.map((cluster) => ({
        id: cluster.id,
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        kind: 'report' as const,
        reportCount: cluster.count,
        iconUri: markerIconUri,
      })),
    [clusters]
  );

  const densityCircles = useMemo(
    () => buildDensityCircles(clusters, currentRegion),
    [clusters, currentRegion]
  );

  const syncMapRegion = useCallback((nextRegion: KakaoMapRegion, duration = 600) => {
    setCurrentRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, duration);
  }, []);

  const loadNearbyReports = useCallback(
    async (region = currentRegion, location = currentLocation) => {
      if (isLoadingReports) {
        return;
      }

      setIsLoadingReports(true);
      setError(null);

      try {
        const data = await fetchIssues(buildIssueQuery(region, location));
        const reports = Array.isArray(data.issues)
          ? data.issues
              .filter(hasValidIssueCoordinate)
              .map(issueToPublicReportItem)
              .filter((item): item is PublicReportItem => item != null)
              .filter(hasValidReportCoordinate)
              .map(mapPublicReport)
          : [];
        const displayReports =
          reports.length >= 3 ? reports : makeMockReports(location ?? region);

        setNearbyReports(displayReports);
        setSelectedReports(displayReports);
        setCurrentAddressLabel(
          await resolveAddressLabel(location ?? region, displayReports[0] ?? null)
        );
      } catch (nextError) {
        console.log('[Issues] nearby fetch failed', nextError);
        const fallbackReports = makeMockReports(location ?? region);
        setError('nearby_fetch_failed');
        setNearbyReports(fallbackReports);
        setSelectedReports(fallbackReports);
        setCurrentAddressLabel(compactAddress(fallbackReports[0]));
      } finally {
        setIsLoadingReports(false);
      }
    },
    [currentLocation, currentRegion, isLoadingReports]
  );

  const moveToCurrentLocation = useCallback(async () => {
    if (isLoadingLocation) {
      return;
    }

    setIsLoadingLocation(true);

    try {
      const granted = await requestAppLocationPermission();
      if (!granted) {
        console.log('[Location] permission denied');
        await loadNearbyReports(currentRegion, currentLocation);
        return;
      }

      const position = await getAppCurrentPosition();
      const nextRegion = { ...position, ...DEFAULT_DELTA };
      setCurrentLocation(position);
      syncMapRegion(nextRegion);
      await loadNearbyReports(nextRegion, position);
    } catch (nextError) {
      console.log('[Location] current location failed', nextError);
      await loadNearbyReports(currentRegion, currentLocation);
    } finally {
      setIsLoadingLocation(false);
    }
  }, [currentLocation, currentRegion, isLoadingLocation, loadNearbyReports, syncMapRegion]);

  useEffect(() => {
    void moveToCurrentLocation();
  }, []);

  const handleRegionChangeComplete = (region: KakaoMapRegion) => {
    setCurrentRegion(region);
  };

  const handleRefresh = () => {
    void loadNearbyReports(currentRegion, currentLocation);
  };

  const handleMarkerPress = (markerId: string) => {
    const cluster = clusters.find((item) => item.id === markerId);
    if (!cluster) {
      return;
    }

    console.log('[Map] marker press', cluster);

    if (cluster.count === 1 && cluster.reports.length === 1) {
      void openReportDetail(cluster.reports[0]);
      return;
    }

    setSelectedReports(cluster.reports);
    setIsSheetExpanded(true);
    syncMapRegion(
      {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        ...EXPANDED_DELTA,
      },
      420
    );
  };

  const handleMapPress = () => {
    if (isSheetExpanded) {
      setIsSheetExpanded(false);
    }
  };

  const searchAddress = async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      return;
    }

    try {
      const results = await mapRef.current?.searchPlaces(trimmed, {
        ...(currentLocation
          ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              radiusMeters: 5000,
            }
          : {}),
      });
      const first = results?.[0];
      if (!first) {
        Alert.alert('검색 결과 없음', '입력한 주소나 지역을 찾지 못했어요.');
        return;
      }
      syncMapRegion({ latitude: first.latitude, longitude: first.longitude, ...DEFAULT_DELTA }, 500);
    } catch (nextError) {
      console.warn('[Search] place search failed', nextError);
    }
  };

  const handleSearchPress = () => {
    void searchAddress(searchText);
  };

  const handleMicPress = () => {
    const SpeechRecognition =
      (globalThis as typeof globalThis & {
        webkitSpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
          onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: ((event: unknown) => void) | null;
          start: () => void;
        };
        SpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
          onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: ((event: unknown) => void) | null;
          start: () => void;
        };
      }).SpeechRecognition ??
      (globalThis as typeof globalThis & {
        webkitSpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          maxAlternatives: number;
          onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: ((event: unknown) => void) | null;
          start: () => void;
        };
      }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[VoiceSearch] speech recognition is not available in this runtime');
      Alert.alert(
        '음성 검색 준비 중',
        '현재 실행 환경에서는 음성 인식을 바로 사용할 수 없어요. dev build에서 음성 인식 모듈을 연결하면 이 버튼에 붙일 수 있습니다.'
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        return;
      }
      setSearchText(transcript);
      console.log('[VoiceSearch] transcript', transcript);
      void searchAddress(transcript);
    };
    recognition.onerror = (event) => {
      console.warn('[VoiceSearch] failed', event);
    };
    recognition.start();
  };

  const openReportDetail = async (item: NearbyReport) => {
    const requestId = ++detailRequestIdRef.current;
    setDetailSheetReport(toNearbyReportDetail(item, currentLocation));

    if (item.issueGroupId == null) {
      console.log('[NearbyReport] missing public issue id', item);
      return;
    }

    try {
      const detail = await fetchIssueDetail(item.issueGroupId);
      const publicReport = issueDetailToPublicReportItem(detail);
      if (publicReport && detailRequestIdRef.current === requestId) {
        setDetailSheetReport(toMapReportDetail(publicReport, currentLocation));
      }
    } catch (nextError) {
      console.warn('[Issues] public detail fetch failed', nextError);
    }
  };

  const renderReportCard = ({ item }: { item: NearbyReport }) => (
    <Pressable style={styles.reportCard} onPress={() => openReportDetail(item)}>
      <Text style={styles.cardKeyword} numberOfLines={1}>
        {item.keyword}
      </Text>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.cardMetaRow}>
        <Text style={styles.riskText}>위험지수 {Number(item.riskScore).toFixed(1)}</Text>
        <Text style={styles.metaDivider}>|</Text>
        <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Image source={ssirenNameLogo} style={styles.nameLogo} resizeMode="contain" />
          <Pressable
            style={styles.bellButton}
            onPress={() => console.log('[Home] notification press')}
            accessibilityRole="button"
            accessibilityLabel="알림"
          >
            <Icon name="bell" size={26} color={SKY} strokeWidth={2.2} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.mapArea}>
        <KakaoMapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ ...DEFAULT_MAP_CENTER, ...DEFAULT_DELTA }}
          region={currentRegion}
          markers={markers}
          circles={densityCircles}
          userLocation={currentLocation}
          showsUserLocation
          onRegionChangeComplete={handleRegionChangeComplete}
          onMarkerPress={handleMarkerPress}
          onMapPress={handleMapPress}
          onMapDragStart={() => {
            setSelectedReports([]);
            setIsSheetExpanded(false);
          }}
        />

        <View style={styles.searchWrap} pointerEvents="box-none">
          <View style={styles.searchShadow}>
            <Pressable style={styles.searchBox} onPress={handleSearchPress}>
              <Icon name="search" size={24} color="#6B6B6B" strokeWidth={2.25} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="지역 · 주소로 제보 찾기"
                placeholderTextColor="#666666"
                underlineColorAndroid="transparent"
                selectionColor={SKY}
                cursorColor={SKY}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={handleSearchPress}
              />
              <Pressable style={styles.micButton} onPress={handleMicPress}>
                <Icon name="mic" size={24} color="#6B6B6B" strokeWidth={2.25} />
              </Pressable>
            </Pressable>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.currentLocationButton, { bottom: sheetHeight + 36 }]}
          onPress={moveToCurrentLocation}
          disabled={isLoadingLocation}
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 이동"
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={SKY_DARK} />
          ) : (
            <Icon name="location" size={25} color={SKY_DARK} strokeWidth={2.4} />
          )}
        </TouchableOpacity>

        <View
          style={[styles.bottomSheet, { height: sheetHeight }]}
          {...sheetPanResponder.panHandlers}
        >
          <Pressable
            style={styles.handleTouch}
            onPress={() => setIsSheetExpanded((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={isSheetExpanded ? '주변 제보 모달 접기' : '주변 제보 모달 펼치기'}
          >
            <View style={styles.handle} />
          </Pressable>

          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>
              내 주변 제보 <Text style={styles.sheetCount}>{visibleReports.length}건</Text>
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={isLoadingReports}
              accessibilityRole="button"
              accessibilityLabel="주변 제보 새로고침"
            >
              {isLoadingReports ? (
                <ActivityIndicator size="small" color="#AFAFAF" />
              ) : (
                <Icon name="refresh" size={30} color="#B3B3B3" strokeWidth={2.3} />
              )}
            </TouchableOpacity>
          </View>

          {isSheetExpanded ? (
            <>
              <View style={styles.addressPill}>
                <Text style={styles.addressText} numberOfLines={1}>
                  {currentAddressLabel}
                </Text>
              </View>

              {visibleReports.length > 0 ? (
                <FlatList
                  horizontal
                  data={visibleReports}
                  keyExtractor={(item) => item.id}
                  renderItem={renderReportCard}
                  style={styles.reportListScroller}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.reportList}
                />
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    {error ? '주변 제보를 불러오지 못했어요.' : '주변 제보가 없습니다.'}
                  </Text>
                </View>
              )}
            </>
          ) : null}
        </View>

        {detailSheetReport ? (
          <ReportDetailBottomSheet
            visible
            report={detailSheetReport}
            onClose={closeReportDetail}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerSafe: {
    backgroundColor: '#ffffff',
    zIndex: 20,
  },
  header: {
    height: HEADER_BODY_HEIGHT,
    paddingLeft: 22,
    paddingRight: 20,
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  nameLogo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH * 0.31,
  },
  bellButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#eef2e8',
  },
  map: {
    flex: 1,
  },
  searchWrap: {
    position: 'absolute',
    top: SEARCH_TOP_OFFSET,
    left: SEARCH_SIDE,
    right: SEARCH_SIDE,
    zIndex: 12,
  },
  searchShadow: {
    height: SEARCH_HEIGHT,
    borderRadius: 15,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'visible',
  },
  searchBox: {
    height: SEARCH_HEIGHT,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 17,
    paddingRight: 14,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    height: SEARCH_HEIGHT,
    marginLeft: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: TEXT,
    includeFontPadding: false,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  micButton: {
    width: 38,
    height: 38,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationButton: {
    position: 'absolute',
    right: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 11,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 18,
    zIndex: 10,
    overflow: 'hidden',
  },
  handleTouch: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 26,
  },
  handle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#B8B8B8',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: fonts.black,
    fontSize: 32,
    lineHeight: 40,
    color: TEXT,
  },
  sheetCount: {
    fontFamily: fonts.black,
    color: SKY,
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressPill: {
    alignSelf: 'flex-start',
    marginTop: 13,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 5,
    maxWidth: '70%',
  },
  addressText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: TEXT,
  },
  reportList: {
    gap: 20,
    paddingTop: 16,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 20,
  },
  reportListScroller: {
    marginHorizontal: -24,
  },
  reportCard: {
    width: CARD_WIDTH,
    height: 154,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
    paddingTop: 21,
    paddingBottom: 19,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.012,
    shadowRadius: 5,
    elevation: 1,
  },
  cardKeyword: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: SKY,
    marginBottom: 5,
  },
  cardTitle: {
    fontFamily: fonts.black,
    fontSize: 19,
    lineHeight: 28,
    color: TEXT,
    fontWeight: '900',
    textShadowColor: TEXT,
    textShadowOffset: { width: 0.35, height: 0 },
    textShadowRadius: 0,
  },
  cardMetaRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: DANGER,
  },
  metaDivider: {
    marginHorizontal: 12,
    fontSize: 15,
    color: '#C8C8C8',
  },
  timeText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: TEXT,
  },
  emptyBox: {
    marginTop: 30,
    height: 120,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: MUTED,
  },
});
