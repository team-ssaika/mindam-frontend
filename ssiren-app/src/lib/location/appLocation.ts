import * as Location from 'expo-location';

/** 강남역 좌표 — 개발용 현재 위치 mock */
export const GANGNAM_STATION = {
  latitude: 37.497952,
  longitude: 127.027619,
} as const;

const SEOUL_CITY_HALL = {
  latitude: 37.5665,
  longitude: 126.978,
} as const;

/** `__DEV__`에서 실제 GPS 대신 강남역을 현재 위치로 사용 */
export const USE_DEV_MOCK_LOCATION = __DEV__;

export function getDefaultMapCenter() {
  return USE_DEV_MOCK_LOCATION ? GANGNAM_STATION : SEOUL_CITY_HALL;
}

export async function requestAppLocationPermission() {
  if (USE_DEV_MOCK_LOCATION) {
    return true;
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getAppCurrentPosition(options?: {
  accuracy?: Location.Accuracy;
}) {
  if (USE_DEV_MOCK_LOCATION) {
    console.log('[Location] dev mock → 강남역', GANGNAM_STATION);
    return { ...GANGNAM_STATION };
  }

  const granted = await requestAppLocationPermission();
  if (!granted) {
    throw new Error('LOCATION_PERMISSION_DENIED');
  }

  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: options?.accuracy ?? Location.Accuracy.Balanced,
  });

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}
