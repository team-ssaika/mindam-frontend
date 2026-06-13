import * as Location from 'expo-location';

export type AppLatLng = {
  latitude: number;
  longitude: number;
};

const SEOUL_CITY_HALL = {
  latitude: 37.5665,
  longitude: 126.978,
} as const;

export function getDefaultMapCenter(): AppLatLng {
  return SEOUL_CITY_HALL;
}

export async function requestAppLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getAppCurrentPosition(options?: {
  accuracy?: Location.Accuracy;
}): Promise<AppLatLng> {
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
