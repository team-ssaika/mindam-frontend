import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
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

export default function HomeScreen() {
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
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googlePlacesApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? googleMapsApiKey;

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
            renderRightButton={() => (
              <View style={styles.searchIconWrapper}>
                <Ionicons name="search" size={18} color="#6b7280" />
              </View>
            )}
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

              // Some responses can miss details; fetch by place_id as fallback.
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
        </View>

        <MapView
          ref={(ref) => {
            mapRef.current = ref;
          }}
          provider={PROVIDER_GOOGLE}
          style={styles.mapContainer}
          initialRegion={currentRegion}
          showsUserLocation
          showsMyLocationButton
        >
          <Marker coordinate={CITY_HALL} title="서울시청" />
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
    left: 16,
    right: 16,
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
  searchIconWrapper: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    right: 16,
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
});
