import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Icon } from '../../../components/ui';
import {
  getAppCurrentPosition,
  getDefaultMapCenter,
  requestAppLocationPermission,
} from '../../../lib/location/appLocation';
import {
  KakaoMapView,
  type KakaoMapCircle,
  type KakaoMapMarker,
  type KakaoPlaceSearchResult,
  type KakaoMapRegion,
  type KakaoMapViewHandle,
} from '../../../components/map/KakaoMapView';
import { fetchIssueDetail, fetchIssues } from '../../report/api/issueApi';
import { ReportDetailBottomSheet } from '../../report/components/ReportDetailBottomSheet';
import type { ReportDetail } from '../../report/types/reportDetail';
import type { PublicReportItem } from '../../report/types/publicReport';
import { searchLocations } from '../api/locationSearchApi';
import {
  BOTTOM_SHEET_HEIGHT,
  NearbyReportsSheet,
  type NearbyReportsSheetHandle,
} from '../components/NearbyReportsSheet';
import {
  getIssueGroupDiscomfortCount,
  getReportMarkerTone,
  getTopReportMarkerTone,
  hasValidIssueCoordinate,
  hasValidReportCoordinate,
  issueDetailToPublicReportItem,
  issueToPublicReportItem,
  toMapReportDetail,
  type ReportMarkerTone,
} from '../../report/utils/publicReportMap';
import { fonts, fontSize } from '../../../theme';

const ssirenNameLogo = require('../../../assets/SSIREN-name.png');
const ssirenMarkerLogo = require('../../../assets/ssiren-marker-logo.png');
const markerIconUri = Image.resolveAssetSource(ssirenMarkerLogo).uri;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SKY = '#7EC8F7';
const SKY_DARK = '#55B5F0';
const SKY_SOFT = 'rgba(126, 200, 247, 0.22)';
const TEXT = '#050505';
const MUTED = '#777777';
const DANGER = '#D95E5E';
const HEADER_BODY_HEIGHT = Math.min(56, Math.max(46, SCREEN_HEIGHT * 0.055));
const LOGO_WIDTH = Math.min(104, Math.max(88, SCREEN_WIDTH * 0.225));
const SEARCH_TOP_OFFSET = 14;
const SEARCH_HEIGHT = 48;
const SEARCH_SIDE = 27;
const SEARCH_PANEL_MAX_HEIGHT = Math.min(360, SCREEN_HEIGHT * 0.42);
const DEFAULT_MAP_CENTER = getDefaultMapCenter();
const DEFAULT_DELTA = { latitudeDelta: 0.012, longitudeDelta: 0.012 };
const EXPANDED_DELTA = { latitudeDelta: 0.0045, longitudeDelta: 0.0045 };
const RECENT_SEARCHES_STORAGE_KEY = 'ssiren.recentPlaceSearches';
const RECENT_SEARCH_KEYWORDS_STORAGE_KEY = 'ssiren.recentSearchKeywords';
const MAX_RECENT_SEARCHES = 10;
const MIN_SEARCH_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 380;

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
  issueGroupId?: number;
  reportId?: number;
  discomfortCount: number;
  markerTone: ReportMarkerTone;
  source?: PublicReportItem;
};

type ClusterMarker = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  reports: NearbyReport[];
  isCluster: boolean;
  markerTone: ReportMarkerTone;
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
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

function compactAddress(report?: Pick<NearbyReport, 'sigungu' | 'eupmyeondong' | 'address'> | null) {
  if (!report) {
    return '현 위치';
  }

  if (report.sigungu || report.eupmyeondong) {
    return [report.sigungu, report.eupmyeondong].filter(Boolean).join(' ');
  }

  const address = report.address?.trim();
  if (!address) {
    return '현 위치';
  }

  for (const [english, korean] of Object.entries(ENGLISH_ADDRESS_FALLBACKS)) {
    if (address.includes(english)) {
      return korean;
    }
  }

  const koreanTokens = address.match(/[가-힣]+(?:시|군|구|읍|면|동|로|길)/g);
  if (koreanTokens && koreanTokens.length > 0) {
    return koreanTokens.slice(0, 2).join(' ');
  }

  return '내 주변';
}

function mapPublicReport(item: PublicReportItem): NearbyReport {
  const issueGroupId = item.issueGroup.id;
  const reportId = item.report.id;
  const riskScore = Number(item.issueGroup.riskScore ?? item.report.riskScore ?? 0);

  return {
    id: String(issueGroupId),
    latitude: item.report.latitude,
    longitude: item.report.longitude,
    keyword: item.category.categoryName || '제보',
    title: item.issueGroup.title || item.report.title || '주변 제보',
    riskScore,
    createdAt: item.issueGroup.recentReportedAt || item.report.createdAt,
    address: item.report.roadAddress || item.report.jibunAddress,
    sigungu: item.report.sigungu,
    eupmyeondong: item.report.eupmyeondong,
    issueGroupId,
    reportId,
    discomfortCount: getIssueGroupDiscomfortCount(item.issueGroup),
    markerTone: getReportMarkerTone(item.report.status, riskScore),
    source: item,
  };
}

function dedupeReportsByIssueGroup(reports: NearbyReport[]) {
  const reportMap = new Map<string, NearbyReport>();

  reports.forEach((report) => {
    const key = report.issueGroupId != null ? String(report.issueGroupId) : report.id;
    if (!reportMap.has(key)) {
      reportMap.set(key, report);
    }
  });

  return [...reportMap.values()];
}

function isVisibleOnMap(item: PublicReportItem) {
  const reportStatus = item.report.status?.toUpperCase();
  const issueStatus = item.issueGroup.status?.toUpperCase();

  return reportStatus !== 'COMPLETED' && issueStatus !== 'RESOLVED';
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
    markerTone: item.markerTone,
    timeAgo: formatTimeAgo(item.createdAt),
    distance:
      userLocation != null
        ? `${Math.round(distanceMeters(userLocation, item))}m`
        : '-',
    address: item.address || compactAddress(item),
    summary: item.title,
    category: item.keyword,
    yesCount: item.discomfortCount,
    organization: item.keyword,
    status: '접수중',
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

function buildClusters(reports: NearbyReport[], region: KakaoMapRegion): ClusterMarker[] {
  const threshold = clusterThresholdMeters(region);
  if (threshold === 0) {
    return reports.map((report) => ({
      id: `report-${report.id}`,
      latitude: report.latitude,
      longitude: report.longitude,
      count: report.discomfortCount,
      reports: [report],
      isCluster: false,
      markerTone: report.markerTone,
    }));
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
    const count = group.reduce((sum, item) => sum + item.discomfortCount, 0);
    const markerTone = getTopReportMarkerTone(group);

    clusters.push({
      id: group.length === 1 ? `report-${group[0].id}` : `cluster-${clusters.length}`,
      latitude,
      longitude,
      count,
      reports: group,
      isCluster: group.length > 1,
      markerTone,
    });
  });

  return clusters;
}

function buildDensityCircles(clusters: ClusterMarker[], region: KakaoMapRegion): KakaoMapCircle[] {
  const delta = Math.max(region.latitudeDelta, region.longitudeDelta);
  return clusters
    .filter((cluster) => cluster.isCluster && cluster.reports.length > 1)
    .map((cluster) => ({
      id: `density-${cluster.id}`,
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      radiusMeters: Math.min(Math.max(delta * 8200, 170), 390) + cluster.reports.length * 12,
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
  const sheetRef = useRef<NearbyReportsSheetHandle | null>(null);
  const detailRequestIdRef = useRef(0);
  const latestSearchKeywordRef = useRef('');
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [currentRegion, setCurrentRegion] = useState<KakaoMapRegion>({
    ...DEFAULT_MAP_CENTER,
    ...DEFAULT_DELTA,
  });
  const [nearbyReports, setNearbyReports] = useState<NearbyReport[]>([]);
  const [selectedReports, setSelectedReports] = useState<NearbyReport[]>([]);
  const [currentAddressLabel, setCurrentAddressLabel] = useState('현 위치');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<KakaoPlaceSearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearchKeywords, setRecentSearchKeywords] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<KakaoPlaceSearchResult[]>([]);
  const [selectedSearchPlace, setSelectedSearchPlace] = useState<KakaoPlaceSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailSheetReport, setDetailSheetReport] = useState<ReportDetail | null>(null);

  const closeReportDetail = useCallback(() => {
    detailRequestIdRef.current += 1;
    setDetailSheetReport(null);
  }, []);

  const visibleReports = selectedReports.length > 0 ? selectedReports : nearbyReports;
  const sheetReports = useMemo(
    () =>
      visibleReports.map((item) => ({
        id: item.id,
        keyword: item.keyword,
        title: item.title,
        riskScore: item.riskScore,
        createdAt: item.createdAt,
      })),
    [visibleReports]
  );
  const trimmedSearchText = searchText.trim();
  const showSearchPanel = isSearchFocused;
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
        markerTone: cluster.markerTone,
      })),
    [clusters]
  );

  const densityCircles = useMemo(
    () => buildDensityCircles(clusters, currentRegion),
    [clusters, currentRegion]
  );

  const syncMapRegion = useCallback((nextRegion: KakaoMapRegion, duration = 600) => {
    const { centerOffsetYPx: _centerOffset, ...persistedRegion } = nextRegion;
    setCurrentRegion(persistedRegion);
    mapRef.current?.animateToRegion(nextRegion, duration);
  }, []);

  const handleActiveReportChange = useCallback(
    (reportId: string) => {
      const report = visibleReports.find((item) => item.id === reportId);
      if (!report) {
        return;
      }

      syncMapRegion(
        {
          latitude: report.latitude,
          longitude: report.longitude,
          ...EXPANDED_DELTA,
          centerOffsetYPx: BOTTOM_SHEET_HEIGHT / 2,
        },
        420
      );
    },
    [syncMapRegion, visibleReports]
  );

  useEffect(() => {
    SecureStore.getItemAsync(RECENT_SEARCHES_STORAGE_KEY)
      .then((value) => {
        if (!value) {
          return;
        }
        const parsed = JSON.parse(value) as KakaoPlaceSearchResult[];
        if (Array.isArray(parsed)) {
          setRecentSearches(
            parsed.filter(
              (item) =>
                item &&
                typeof item.id === 'string' &&
                typeof item.placeName === 'string' &&
                Number.isFinite(item.latitude) &&
                Number.isFinite(item.longitude)
            )
          );
        }
      })
      .catch((nextError) => {
        console.log('[Search] recent searches load failed', nextError);
      });
  }, []);

  useEffect(() => {
    SecureStore.getItemAsync(RECENT_SEARCH_KEYWORDS_STORAGE_KEY)
      .then((value) => {
        if (!value) {
          return;
        }
        const parsed = JSON.parse(value) as string[];
        if (Array.isArray(parsed)) {
          setRecentSearchKeywords(
            parsed
              .filter((item) => typeof item === 'string' && item.trim().length >= MIN_SEARCH_QUERY_LENGTH)
              .map((item) => item.trim())
              .slice(0, MAX_RECENT_SEARCHES)
          );
        }
      })
      .catch((nextError) => {
        console.log('[Search] recent search keywords load failed', nextError);
      });
  }, []);

  const persistRecentSearches = useCallback((items: KakaoPlaceSearchResult[]) => {
    SecureStore.setItemAsync(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(items)).catch((nextError) => {
      console.log('[Search] recent searches save failed', nextError);
    });
  }, []);

  const persistRecentSearchKeywords = useCallback((items: string[]) => {
    SecureStore.setItemAsync(RECENT_SEARCH_KEYWORDS_STORAGE_KEY, JSON.stringify(items)).catch((nextError) => {
      console.log('[Search] recent search keywords save failed', nextError);
    });
  }, []);

  const saveRecentSearchKeyword = useCallback(
    (keyword: string) => {
      const trimmed = keyword.trim();
      if (trimmed.length < MIN_SEARCH_QUERY_LENGTH) {
        return;
      }

      setRecentSearchKeywords((prev) => {
        const next = [
          trimmed,
          ...prev.filter((item) => item !== trimmed),
        ].slice(0, MAX_RECENT_SEARCHES);
        persistRecentSearchKeywords(next);
        return next;
      });
    },
    [persistRecentSearchKeywords]
  );

  const removeRecentSearchKeyword = useCallback(
    (keyword: string) => {
      setRecentSearchKeywords((prev) => {
        const next = prev.filter((item) => item !== keyword);
        persistRecentSearchKeywords(next);
        return next;
      });
    },
    [persistRecentSearchKeywords]
  );

  const saveRecentSearch = useCallback(
    (place: KakaoPlaceSearchResult) => {
      setRecentSearches((prev) => {
        const next = [
          place,
          ...prev.filter((item) => item.id !== place.id),
        ].slice(0, MAX_RECENT_SEARCHES);
        persistRecentSearches(next);
        return next;
      });
    },
    [persistRecentSearches]
  );

  const removeRecentSearch = useCallback(
    (placeId: string) => {
      setRecentSearches((prev) => {
        const next = prev.filter((item) => item.id !== placeId);
        persistRecentSearches(next);
        return next;
      });
    },
    [persistRecentSearches]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    setRecentSearchKeywords([]);
    SecureStore.deleteItemAsync(RECENT_SEARCHES_STORAGE_KEY).catch((nextError) => {
      console.log('[Search] recent searches clear failed', nextError);
    });
    SecureStore.deleteItemAsync(RECENT_SEARCH_KEYWORDS_STORAGE_KEY).catch((nextError) => {
      console.log('[Search] recent search keywords clear failed', nextError);
    });
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
            .filter(isVisibleOnMap)
            .filter(hasValidReportCoordinate)
            .map(mapPublicReport)
          : [];
        const uniqueReports = dedupeReportsByIssueGroup(reports);
        setNearbyReports(uniqueReports);
        setSelectedReports(uniqueReports);
        setCurrentAddressLabel(
          await resolveAddressLabel(location ?? region, uniqueReports[0] ?? null)
        );
      } catch (nextError) {
        console.log('[Issues] nearby fetch failed', nextError);
        setError('nearby_fetch_failed');
        setNearbyReports([]);
        setSelectedReports([]);
        setCurrentAddressLabel(
          await resolveAddressLabel(location ?? region, null)
        );
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
      const nextRegion = { ...position, ...EXPANDED_DELTA };
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

  const handleRefresh = useCallback(() => {
    void loadNearbyReports(currentRegion, currentLocation);
  }, [currentLocation, currentRegion, loadNearbyReports]);

  const handleMarkerPress = (markerId: string) => {
    const cluster = clusters.find((item) => item.id === markerId);
    if (!cluster) {
      return;
    }

    console.log('[Map] marker press', cluster);

    if (cluster.reports.length === 1) {
      void openReportDetail(cluster.reports[0]);
      return;
    }

    setSelectedReports(dedupeReportsByIssueGroup(cluster.reports));
    sheetRef.current?.expand();
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
    setIsSearchFocused(false);
    sheetRef.current?.collapse();
  };

  const runPlaceSearch = useCallback(
    async (keyword: string, shouldSaveKeyword = false) => {
      const trimmed = keyword.trim();
      if (trimmed.length < MIN_SEARCH_QUERY_LENGTH) {
        setSearchResults([]);
        setSearchError(null);
        setIsSearching(false);
        return;
      }

      if (shouldSaveKeyword) {
        saveRecentSearchKeyword(trimmed);
      }

      latestSearchKeywordRef.current = trimmed;
      setIsSearching(true);
      setSearchError(null);

      try {
        let results: KakaoPlaceSearchResult[] = [];
        try {
          results = await searchLocations(trimmed);
        } catch (apiError) {
          console.warn('[Search] backend location search failed', apiError);
        }

        if (results.length === 0 && mapRef.current) {
          results = (await mapRef.current?.searchPlaces(trimmed)) ?? [];
        }

        if (latestSearchKeywordRef.current !== trimmed) {
          return;
        }

        setSearchResults(results);
      } catch (nextError) {
        if (latestSearchKeywordRef.current !== trimmed) {
          return;
        }
        console.warn('[Search] place search failed', nextError);
        setSearchResults([]);
        setSearchError('검색 중 문제가 발생했습니다.');
      } finally {
        if (latestSearchKeywordRef.current === trimmed) {
          setIsSearching(false);
        }
      }
    },
    [saveRecentSearchKeyword]
  );

  const selectRecentSearchKeyword = useCallback(
    (keyword: string) => {
      setSearchText(keyword);
      setIsSearchFocused(true);
      void runPlaceSearch(keyword, true);
    },
    [runPlaceSearch]
  );

  useEffect(() => {
    if (!isSearchFocused) {
      return;
    }

    if (trimmedSearchText.length < MIN_SEARCH_QUERY_LENGTH) {
      latestSearchKeywordRef.current = trimmedSearchText;
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      void runPlaceSearch(trimmedSearchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isSearchFocused, runPlaceSearch, trimmedSearchText]);

  const selectSearchPlace = useCallback(
    (place: KakaoPlaceSearchResult) => {
      setSearchText(place.placeName);
      setSelectedSearchPlace(place);
      setSearchResults([]);
      setSearchError(null);
      setIsSearchFocused(false);
      saveRecentSearch(place);
      syncMapRegion({ latitude: place.latitude, longitude: place.longitude, ...DEFAULT_DELTA }, 500);
    },
    [saveRecentSearch, syncMapRegion]
  );

  const clearSearch = useCallback(() => {
    latestSearchKeywordRef.current = '';
    setSearchText('');
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);
    setSelectedSearchPlace(null);
    setIsSearchFocused(true);
  }, []);

  const handleSearchPress = () => {
    setIsSearchFocused(true);
    if (trimmedSearchText.length >= MIN_SEARCH_QUERY_LENGTH) {
      void runPlaceSearch(trimmedSearchText, true);
    }
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
        '현재 실행 환경에서는 음성 인식을 바로 사용할 수 없습니다. dev build에서 음성 인식 모듈을 연결하면 이 버튼을 붙일 수 있습니다.'
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
      setIsSearchFocused(true);
      console.log('[VoiceSearch] transcript', transcript);
      void runPlaceSearch(transcript, true);
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

  const handleReportCardPress = useCallback(
    (reportId: string) => {
      const item = visibleReports.find((report) => report.id === reportId);
      if (item) {
        void openReportDetail(item);
      }
    },
    [visibleReports]
  );

  const renderPlaceRow = (
    place: KakaoPlaceSearchResult,
    options: { recent?: boolean } = {}
  ) => {
    const address = place.roadAddressName || place.addressName || '주소 정보 없음';

    return (
      <Pressable
        key={place.id}
        style={styles.placeRow}
        onPress={() => selectSearchPlace(place)}
        accessibilityRole="button"
      >
        <View style={styles.placeIcon}>
          <Icon name={options.recent ? 'clock' : 'pin'} size={18} color={SKY_DARK} strokeWidth={2.1} />
        </View>
        <View style={styles.placeTextBox}>
          <Text style={styles.placeName} numberOfLines={1}>
            {place.placeName}
          </Text>
          <Text style={styles.placeAddress} numberOfLines={1}>
            {address}
          </Text>
          {place.categoryName ? (
            <Text style={styles.placeCategory} numberOfLines={1}>
              {place.categoryName}
            </Text>
          ) : null}
        </View>
        {options.recent ? (
          <Pressable
            style={styles.placeDeleteButton}
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              removeRecentSearch(place.id);
            }}
            accessibilityRole="button"
            accessibilityLabel="최근 검색 삭제"
          >
            <Icon name="x" size={16} color="#A8A8A8" strokeWidth={2.1} />
          </Pressable>
        ) : null}
      </Pressable>
    );
  };

  const renderRecentKeywordRow = (keyword: string) => (
    <Pressable
      key={`keyword-${keyword}`}
      style={styles.placeRow}
      onPress={() => selectRecentSearchKeyword(keyword)}
      accessibilityRole="button"
    >
      <View style={styles.placeIcon}>
        <Icon name="search" size={18} color={SKY_DARK} strokeWidth={2.1} />
      </View>
      <View style={styles.placeTextBox}>
        <Text style={styles.placeName} numberOfLines={1}>
          {keyword}
        </Text>
        <Text style={styles.placeAddress} numberOfLines={1}>
          최근 검색어
        </Text>
      </View>
      <Pressable
        style={styles.placeDeleteButton}
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          removeRecentSearchKeyword(keyword);
        }}
        accessibilityRole="button"
        accessibilityLabel="최근 검색어 삭제"
      >
        <Icon name="x" size={16} color="#A8A8A8" strokeWidth={2.1} />
      </Pressable>
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
          searchMarker={null}
          userLocation={currentLocation}
          showsUserLocation
          onRegionChangeComplete={handleRegionChangeComplete}
          onMarkerPress={handleMarkerPress}
          onMapPress={handleMapPress}
          onMapDragStart={() => {
            setSelectedReports([]);
            setIsSearchFocused(false);
            sheetRef.current?.collapse();
          }}
        />

        <View
          style={[styles.searchWrap, showSearchPanel ? styles.searchWrapExpanded : null]}
          pointerEvents="box-none"
        >
          <View style={styles.searchShadow}>
            <Pressable style={styles.searchBox} onPress={handleSearchPress}>
              <Icon name="search" size={24} color="#6B6B6B" strokeWidth={2.25} />
              <TextInput
                value={searchText}
                onChangeText={(value) => {
                  setSearchText(value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="지역 · 주소로 제보 찾기"
                placeholderTextColor="#666666"
                underlineColorAndroid="transparent"
                selectionColor={SKY}
                cursorColor={SKY}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={handleSearchPress}
              />
              <Pressable
                style={styles.micButton}
                onPress={searchText ? clearSearch : handleMicPress}
                accessibilityRole="button"
                accessibilityLabel={searchText ? '검색어 지우기' : '음성 검색'}
              >
                <Icon
                  name={searchText ? 'x' : 'mic'}
                  size={24}
                  color="#6B6B6B"
                  strokeWidth={2.25}
                />
              </Pressable>
            </Pressable>
          </View>

          {showSearchPanel ? (
            <View style={styles.searchPanel}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                nestedScrollEnabled
                scrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.searchPanelScroller}
                contentContainerStyle={styles.searchPanelContent}
              >
                {trimmedSearchText.length === 0 ? (
                  recentSearchKeywords.length > 0 || recentSearches.length > 0 ? (
                    <>
                      <View style={styles.searchPanelHeader}>
                        <Text style={styles.searchPanelTitle}>최근 검색</Text>
                        <Pressable onPress={clearRecentSearches} hitSlop={8}>
                          <Text style={styles.searchPanelAction}>전체 삭제</Text>
                        </Pressable>
                      </View>
                      {recentSearchKeywords.map(renderRecentKeywordRow)}
                      {recentSearches.map((place) => renderPlaceRow(place, { recent: true }))}
                    </>
                  ) : (
                    <Text style={styles.searchEmptyText}>최근 검색 기록이 없습니다.</Text>
                  )
                ) : trimmedSearchText.length < MIN_SEARCH_QUERY_LENGTH ? (
                  <Text style={styles.searchEmptyText}>두 글자 이상 입력해 주세요.</Text>
                ) : isSearching ? (
                  <View style={styles.searchLoadingRow}>
                    <ActivityIndicator size="small" color={SKY_DARK} />
                    <Text style={styles.searchLoadingText}>장소를 찾는 중입니다.</Text>
                  </View>
                ) : searchError ? (
                  <Text style={styles.searchEmptyText}>{searchError}</Text>
                ) : searchResults.length > 0 ? (
                  searchResults.map((place) => renderPlaceRow(place))
                ) : (
                  <Text style={styles.searchEmptyText}>검색 결과가 없습니다.</Text>
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <NearbyReportsSheet
          ref={sheetRef}
          reports={sheetReports}
          addressLabel={currentAddressLabel}
          error={error}
          isLoading={isLoadingReports}
          isLoadingLocation={isLoadingLocation}
          onCurrentLocationPress={moveToCurrentLocation}
          onRefresh={handleRefresh}
          onReportPress={handleReportCardPress}
          onActiveReportChange={handleActiveReportChange}
        />
      </View>

      {detailSheetReport ? (
        <ReportDetailBottomSheet
          visible
          report={detailSheetReport}
          onClose={closeReportDetail}
        />
      ) : null}
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
  searchWrapExpanded: {
    height: SEARCH_HEIGHT + 10 + SEARCH_PANEL_MAX_HEIGHT,
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
    fontSize: fontSize.base,
    color: TEXT,
    includeFontPadding: false,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  searchPanel: {
    position: 'absolute',
    top: SEARCH_HEIGHT + 10,
    left: 0,
    right: 0,
    maxHeight: SEARCH_PANEL_MAX_HEIGHT,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 12,
    zIndex: 40,
    overflow: 'hidden',
  },
  searchPanelScroller: {
    maxHeight: SEARCH_PANEL_MAX_HEIGHT,
  },
  searchPanelContent: {
    paddingBottom: 8,
  },
  searchPanelHeader: {
    minHeight: 34,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchPanelTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    color: TEXT,
  },
  searchPanelAction: {
    fontFamily: fonts.medium,
    fontSize: fontSize.micro,
    color: SKY_DARK,
  },
  searchEmptyText: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: MUTED,
  },
  searchLoadingRow: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchLoadingText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: MUTED,
  },
  placeRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SKY_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeTextBox: {
    flex: 1,
    minWidth: 0,
  },
  placeName: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: TEXT,
  },
  placeAddress: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: MUTED,
  },
  placeCategory: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.micro,
    color: '#9A9A9A',
  },
  placeDeleteButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 38,
    height: 38,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
