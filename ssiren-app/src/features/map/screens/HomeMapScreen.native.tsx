import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { fetchPublicReports } from '../../report/api/reportApi';
import { ReportMapMarker } from '../../report/components/ReportMapMarker';
import type { PublicReportItem } from '../../report/types/publicReport';
import type { ReportDetail } from '../../report/types/reportDetail';
import {
  hasValidReportCoordinate,
  toMapReportDetail,
} from '../../report/utils/publicReportMap';
import { AppText, CatChip, Icon, Tag } from '../../../components/ui';
import { colors, fonts, radius, shadow } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';

const CITY_HALL = {
  latitude: 37.5665,
  longitude: 126.978,
};

const DEFAULT_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HomeMapScreen() {
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const mapRef = useRef<MapView | null>(null);
  const [isResolvingCurrentLocation, setIsResolvingCurrentLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>({
    ...CITY_HALL,
    ...DEFAULT_DELTA,
  });
  const [searchMarker, setSearchMarker] = useState<{
    latitude: number;
    longitude: number;
    title: string;
  } | null>(null);
  const [publicReports, setPublicReports] = useState<PublicReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<PublicReportItem | null>(null);
  const [isReportSheetVisible, setIsReportSheetVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? googleMapsApiKey;
  const selectedReportDetail: ReportDetail | null = selectedReport
    ? toMapReportDetail(selectedReport, userLocation)
    : null;

  const moveToCoordinate = (latitude: number, longitude: number, title: string) => {
    const nextRegion: Region = { latitude, longitude, ...DEFAULT_DELTA };
    setSearchMarker({ latitude, longitude, title });
    setCurrentRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 700);
  };

  const moveToCurrentLocation = async () => {
    try {
      setIsResolvingCurrentLocation(true);
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert('위치 서비스 꺼짐', '기기 위치 서비스를 먼저 켜주세요.');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한 필요', '위치 권한을 허용해야 현재 위치를 표시할 수 있습니다.');
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
      const nextRegion: Region = { latitude: coords.latitude, longitude: coords.longitude, ...DEFAULT_DELTA };
      setCurrentRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 700);
    } catch (error) {
      Alert.alert('위치 조회 실패', `현재 위치를 가져오지 못했습니다.\n${String(error)}`);
    } finally {
      setIsResolvingCurrentLocation(false);
    }
  };

  useEffect(() => {
    moveToCurrentLocation();
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchPublicReports({ page: 0, size: 50, sort: 'createdAt,desc' })
      .then((data) => {
        if (!isMounted) return;
        setPublicReports(
          Array.isArray(data.contents) ? data.contents.filter(hasValidReportCoordinate) : []
        );
      })
      .catch(() => {
        if (!isMounted) return;
        setPublicReports([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openReportSheet = (item: PublicReportItem) => {
    setSelectedReport(item);
    backdropOpacity.setValue(1);
    sheetTranslateY.setValue(SCREEN_HEIGHT);
    setIsReportSheetVisible(true);
    Animated.timing(sheetTranslateY, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  };

  const closeReportSheet = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: SCREEN_HEIGHT, duration: 240, useNativeDriver: true }),
    ]).start(() => {
      setIsReportSheetVisible(false);
      setIsLiked(false);
      setSelectedReport(null);
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <MapView
          ref={(ref) => {
            mapRef.current = ref;
          }}
          provider={PROVIDER_GOOGLE}
          style={styles.mapContainer}
          initialRegion={currentRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {publicReports.map((item) => (
            <Marker
              key={item.report.id}
              coordinate={{ latitude: item.report.latitude, longitude: item.report.longitude }}
              onPress={() => openReportSheet(item)}
            >
              <ReportMapMarker />
            </Marker>
          ))}
          {searchMarker ? (
            <Marker
              coordinate={{ latitude: searchMarker.latitude, longitude: searchMarker.longitude }}
              title={searchMarker.title}
              pinColor={colors.accent}
            />
          ) : null}
        </MapView>

        {/* floating top: logo + bell */}
        <SafeAreaView edges={['top']} style={styles.topSafe} pointerEvents="box-none">
          <View style={styles.topBar} pointerEvents="box-none">
            <View style={styles.logoCard}>
              <View style={styles.logoMark}>
                <Icon name="marker" size={15} color={colors.white} fill />
              </View>
              <AppText variant="heading" color={colors.brand}>시민제보</AppText>
            </View>
            <Pressable style={styles.bellButton} accessibilityLabel="알림">
              <Icon name="bell" size={22} color={colors.ink} />
              <View style={styles.bellDot} />
            </Pressable>
          </View>

          {/* search pill */}
          <View style={styles.searchContainer} pointerEvents="box-none">
            <GooglePlacesAutocomplete
              placeholder="지역·주소로 제보 찾기"
              minLength={2}
              debounce={200}
              listViewDisplayed="auto"
              fetchDetails
              enablePoweredByContainer={false}
              query={{
                key: googlePlacesApiKey,
                language: 'ko',
                ...(userLocation
                  ? { location: `${userLocation.latitude},${userLocation.longitude}`, radius: '5000' }
                  : {}),
              }}
              GooglePlacesDetailsQuery={{ fields: 'geometry' }}
              onFail={(error) => {
                const errorMessage =
                  typeof error === 'string' ? error : JSON.stringify(error, null, 2);
                Alert.alert('검색 오류', `Google Places 요청이 실패했습니다.\n\n${errorMessage}`);
              }}
              onNotFound={() => {
                Alert.alert('검색 결과 없음', '입력한 키워드에 해당하는 장소가 없습니다.');
              }}
              onPress={async (data, details) => {
                const location = details?.geometry?.location;
                if (location) {
                  moveToCoordinate(location.lat, location.lng, data.description);
                  return;
                }

                if (!data.place_id) {
                  Alert.alert('검색 오류', '장소 좌표를 가져오지 못했습니다.');
                  return;
                }

                try {
                  const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${data.place_id}&fields=geometry,name&language=ko&key=${googlePlacesApiKey}`
                  );
                  const result = await response.json();
                  const detailLocation = result?.result?.geometry?.location;
                  if (!detailLocation) {
                    Alert.alert('검색 오류', '장소 상세 좌표를 가져오지 못했습니다.');
                    return;
                  }
                  moveToCoordinate(
                    detailLocation.lat,
                    detailLocation.lng,
                    result?.result?.name ?? data.description
                  );
                } catch {
                  Alert.alert('검색 오류', '장소 상세 조회 중 오류가 발생했습니다.');
                }
              }}
              styles={{
                textInput: styles.searchInput,
                listView: styles.placeListView,
                row: styles.placeRow,
                separator: styles.placeSeparator,
                description: styles.placeDescription,
              }}
            />
            <View pointerEvents="none" style={styles.searchIconOverlay}>
              <Icon name="search" size={19} color={colors.muted} />
            </View>
          </View>

          {/* density legend */}
          <View style={styles.legendChip} pointerEvents="none">
            <LinearGradient
              colors={[colors.yellow, colors.mustard, colors.coral]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.legendGradient}
            />
            <AppText style={styles.legendText}>제보 밀집도</AppText>
          </View>
        </SafeAreaView>

        {/* map controls */}
        <View style={[styles.fabColumn, { bottom: tabBarOffset + 96 }]} pointerEvents="box-none">
          <View style={styles.fab}>
            <Icon name="layers" size={22} color={colors.ink} />
          </View>
          <TouchableOpacity
            style={[styles.fab, styles.fabPrimary]}
            onPress={moveToCurrentLocation}
            disabled={isResolvingCurrentLocation}
          >
            {isResolvingCurrentLocation ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="location" size={22} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* peek summary */}
        <View style={[styles.peekSheet, { paddingBottom: tabBarOffset + 14 }]} pointerEvents="box-none">
          <View style={styles.peekHandle} />
          <View style={styles.peekRow}>
            <View>
              <AppText variant="section" color={colors.ink}>내 주변 제보</AppText>
              <AppText style={styles.peekMeta}>
                지도에 표시된 제보 <AppText style={styles.peekCount}>{publicReports.length}건</AppText>
              </AppText>
            </View>
          </View>
        </View>

        <Modal
          animationType="none"
          transparent
          visible={isReportSheetVisible && selectedReportDetail != null}
          onRequestClose={closeReportSheet}
        >
          <View style={styles.sheetOverlay}>
            <Animated.View
              pointerEvents="box-none"
              style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}
            >
              <Pressable style={StyleSheet.absoluteFillObject} onPress={closeReportSheet} />
            </Animated.View>
            <Animated.View
              style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeaderRow}>
                <CatChip icon="alert" label={selectedReportDetail?.category ?? '제보'} color={colors.coral} />
                <Pressable style={styles.sheetCloseButton} onPress={closeReportSheet}>
                  <Icon name="x" size={20} color={colors.muted} />
                </Pressable>
              </View>

              <AppText variant="title" color={colors.ink} style={styles.sheetTitle}>
                {selectedReportDetail?.title}
              </AppText>

              <View style={styles.metaRow}>
                <View style={styles.riskChip}>
                  <Icon name="alert" size={12} color={colors.accent} />
                  <AppText style={styles.riskChipText}>{selectedReportDetail?.riskLabel}</AppText>
                </View>
                <AppText style={styles.metaDot}>·</AppText>
                <AppText style={styles.metaText}>{selectedReportDetail?.timeAgo}</AppText>
                <AppText style={styles.metaDot}>·</AppText>
                <AppText style={styles.metaText}>{selectedReportDetail?.distance}</AppText>
              </View>

              <View style={styles.addressRow}>
                <Icon name="location" size={16} color={colors.faint} />
                <AppText style={styles.addressText}>{selectedReportDetail?.address}</AppText>
              </View>

              <View style={styles.summaryBox}>
                <AppText style={styles.summaryTitle}>AI 요약</AppText>
                <AppText style={styles.summaryText}>{selectedReportDetail?.summary}</AppText>
              </View>

              <View style={styles.sheetFooterRow}>
                <Tag label={`나도 불편해요 ${selectedReportDetail?.yesCount ?? 0}`} bg={colors.brandSoft} color={colors.brand} />
                <Pressable
                  style={[styles.likeChip, isLiked && styles.likeChipOn]}
                  onPress={() => setIsLiked((prev) => !prev)}
                >
                  <Icon name="alert" size={14} color={isLiked ? colors.white : colors.muted} fill={isLiked} />
                </Pressable>
                <View style={styles.flexSpacer} />
                <AppText style={styles.organizationText}>{selectedReportDetail?.organization}</AppText>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  mapContainer: { flex: 1 },

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
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  bellDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.canvas,
  },

  searchContainer: { marginTop: 12, marginHorizontal: 16, maxHeight: 320 },
  searchInput: {
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    paddingHorizontal: 14,
    paddingRight: 40,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    ...shadow.float,
  },
  searchIconOverlay: { position: 'absolute', right: 14, top: 14, height: 19, width: 19 },
  placeListView: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  placeRow: { paddingHorizontal: 14, paddingVertical: 11 },
  placeSeparator: { height: 1, backgroundColor: colors.soft2 },
  placeDescription: { color: colors.ink, fontFamily: fonts.regular, fontSize: 14 },

  legendChip: {
    marginTop: 12,
    marginHorizontal: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    ...shadow.float,
  },
  legendGradient: { width: 14, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.body },

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

  peekSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    ...shadow.sheet,
  },
  peekHandle: { width: 38, height: 5, borderRadius: 3, backgroundColor: '#d8dbe1', alignSelf: 'center', marginBottom: 12 },
  peekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  peekMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  peekCount: { fontFamily: fonts.bold, color: colors.coral },

  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24,29,38,0.28)' },
  sheetContainer: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 26,
    ...shadow.sheet,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#d8dbe1', marginBottom: 16 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { marginTop: 8, lineHeight: 26 },
  sheetCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.soft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  riskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  riskChipText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.accent },
  metaDot: { marginHorizontal: 6, fontSize: 13, color: colors.faint },
  metaText: { fontSize: 13, color: colors.muted },
  addressRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  addressText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: colors.body },
  summaryBox: {
    marginTop: 14,
    backgroundColor: colors.soft,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.ink },
  summaryText: { fontSize: 13.5, lineHeight: 20, color: colors.body },
  sheetFooterRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  likeChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.canvas,
  },
  likeChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  flexSpacer: { flex: 1 },
  organizationText: { fontSize: 12.5, color: colors.muted, flexShrink: 1, textAlign: 'right' },
});
