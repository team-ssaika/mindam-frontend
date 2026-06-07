import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';

const CITY_HALL = {
  latitude: 37.5665,
  longitude: 126.978,
};

const DEFAULT_DELTA = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const MOCK_REPORT = {
  id: 'report-mock-1',
  title: '유성구 궁동 도로 파손 의심',
  riskLabel: '위험지수 82',
  timeAgo: '10분 전',
  distance: '70m',
  address: '대전 유성구 궁동 어쩌구 길 10-1 (궁동)',
  summary: '도로 파손으로 차량 통행과 보행자 안전에 주의가 필요해요. 동일 위치에서 반복 제보되고 있어요.',
  category: '도로파손',
  empathyCount: 34,
  organization: '유성구청 도로관리팀',
  status: '접수 전',
};

export default function HomeMapScreen() {
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
  const [isReportSheetVisible, setIsReportSheetVisible] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googlePlacesApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? googleMapsApiKey;
  const sampleReportCoordinate = userLocation
    ? {
        latitude: userLocation.latitude + 0.0009,
        longitude: userLocation.longitude + 0.0007,
      }
    : {
        latitude: CITY_HALL.latitude + 0.0009,
        longitude: CITY_HALL.longitude + 0.0007,
      };

  const moveToCoordinate = (
    latitude: number,
    longitude: number,
    title: string
  ) => {
    const nextRegion: Region = {
      latitude,
      longitude,
      ...DEFAULT_DELTA,
    };

    setSearchMarker({
      latitude,
      longitude,
      title,
    });
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
      setUserLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      const nextRegion: Region = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        ...DEFAULT_DELTA,
      };
      setCurrentRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 700);
    } catch (error) {
      Alert.alert(
        '위치 조회 실패',
        `현재 위치를 가져오지 못했습니다.\n${String(error)}`
      );
    } finally {
      setIsResolvingCurrentLocation(false);
    }
  };

  useEffect(() => {
    moveToCurrentLocation();
  }, []);

  const openReportSheet = () => {
    backdropOpacity.setValue(1);
    sheetTranslateY.setValue(SCREEN_HEIGHT);
    setIsReportSheetVisible(true);
    Animated.timing(sheetTranslateY, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

  const closeReportSheet = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => setIsReportSheetVisible(false));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="주소/장소를 검색하세요"
            minLength={2}
            debounce={200}
            listViewDisplayed="auto"
            fetchDetails
            enablePoweredByContainer={false}
            query={{
              key: googlePlacesApiKey,
              language: 'ko',
              ...(userLocation
                ? {
                    location: `${userLocation.latitude},${userLocation.longitude}`,
                    radius: '5000',
                  }
                : {}),
            }}
            GooglePlacesDetailsQuery={{
              fields: 'geometry',
            }}
            onFail={(error) => {
              const errorMessage =
                typeof error === 'string'
                  ? error
                  : JSON.stringify(error, null, 2);
              Alert.alert(
                '검색 오류',
                `Google Places 요청이 실패했습니다.\n\n${errorMessage}`
              );
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
            <Ionicons name="search" size={18} color="#6b7280" />
          </View>
        </View>

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
          <Marker coordinate={CITY_HALL} title="서울시청" />
          <Marker
            coordinate={{
              latitude: sampleReportCoordinate.latitude,
              longitude: sampleReportCoordinate.longitude,
            }}
            onPress={openReportSheet}
          >
            <View style={styles.reportPinOuter}>
              <View style={styles.reportPinInner} />
            </View>
          </Marker>
          {searchMarker ? (
            <Marker
              coordinate={{
                latitude: searchMarker.latitude,
                longitude: searchMarker.longitude,
              }}
              title={searchMarker.title}
              pinColor="#6C63FF"
            />
          ) : null}
        </MapView>

        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={moveToCurrentLocation}
          disabled={isResolvingCurrentLocation}
        >
          {isResolvingCurrentLocation ? (
            <ActivityIndicator size="small" color="#6257FF" />
          ) : (
            <Ionicons name="locate-outline" size={20} color="#6257FF" />
          )}
        </TouchableOpacity>

        <Modal
          animationType="none"
          transparent
          visible={isReportSheetVisible}
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
              style={[
                styles.sheetContainer,
                { transform: [{ translateY: sheetTranslateY }] },
              ]}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetTitle}>{MOCK_REPORT.title}</Text>
                <Pressable
                  style={styles.sheetCloseButton}
                  onPress={closeReportSheet}
                >
                  <Ionicons name="close" size={22} color="#4b5563" />
                </Pressable>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.riskChip}>
                  <Ionicons name="warning-outline" size={13} color="#dc2626" />
                  <Text style={styles.riskChipText}>{MOCK_REPORT.riskLabel}</Text>
                </View>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{MOCK_REPORT.timeAgo}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{MOCK_REPORT.distance}</Text>
              </View>
              <Text style={styles.addressText}>{MOCK_REPORT.address}</Text>

              <View style={styles.tagRow}>
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{MOCK_REPORT.category}</Text>
                </View>
                <View style={styles.tagChip}>
                  <Text style={styles.tagChipText}>나도 불편해요 {MOCK_REPORT.empathyCount}</Text>
                </View>
                <View style={styles.likeChip}>
                  <Ionicons name="heart-outline" size={14} color="#4b5563" />
                </View>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>AI 요약</Text>
                <Text style={styles.summaryText}>{MOCK_REPORT.summary}</Text>
              </View>

              <View style={styles.organizationRow}>
                <Ionicons name="business-outline" size={16} color="#6b7280" />
                <Text style={styles.organizationText}>{MOCK_REPORT.organization}</Text>
                <View style={styles.statusChip}>
                  <Text style={styles.statusText}>{MOCK_REPORT.status}</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    zIndex: 10,
    elevation: 10,
    maxHeight: 320,
  },
  searchInput: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    color: '#111827',
    fontSize: 14,
    paddingRight: 40,
  },
  searchIconOverlay: {
    position: 'absolute',
    right: 12,
    top: 13,
    height: 18,
    width: 18,
  },
  placeListView: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  placeRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  placeSeparator: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  placeDescription: {
    color: '#111827',
    fontSize: 14,
  },
  currentLocationButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9DBE8',
    backgroundColor: '#F5F6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportPinOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  reportPinInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ef4444',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.22)',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '38%',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  sheetCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  riskChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c',
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: 13,
    color: '#9ca3af',
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  addressText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
  tagRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  likeChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  summaryBox: {
    marginTop: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#374151',
  },
  organizationRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  organizationText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },
  statusChip: {
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
  },
});
