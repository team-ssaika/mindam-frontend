import * as Location from 'expo-location';

export type AppLatLng = {
  latitude: number;
  longitude: number;
};

/** 명시적으로 켰을 때만 사용하는 개발용 대체 좌표 */
export const GANGNAM_STATION = {
  latitude: 37.497952,
  longitude: 127.027619,
} as const;

const SEOUL_CITY_HALL = {
  latitude: 37.5665,
  longitude: 126.978,
} as const;

export const USE_DEV_MOCK_LOCATION = true;

export function getDefaultMapCenter(): AppLatLng {
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
}): Promise<AppLatLng> {
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
