import type { Region } from 'react-native-maps';
import { colors } from '../../../theme';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';

export const DENSE_AREA_DEFAULTS = {
  radiusMeters: 5000,
  gridSizeMeters: 300,
  minIssueGroupCount: 2,
} as const;

type LatLng = { latitude: number; longitude: number };

export function regionRadiusMeters(region: Region) {
  const latMeters = region.latitudeDelta * 111_320;
  const lngMeters =
    region.longitudeDelta * 111_320 * Math.cos((region.latitude * Math.PI) / 180);
  return Math.max(800, Math.round(Math.hypot(latMeters, lngMeters) / 2));
}

export function resolveDenseAreaCenter(region: Region, userLocation: LatLng | null): LatLng {
  if (userLocation) {
    return userLocation;
  }
  return { latitude: region.latitude, longitude: region.longitude };
}

export function resolveDenseAreaRadius(region: Region, userLocation: LatLng | null) {
  if (userLocation) {
    return DENSE_AREA_DEFAULTS.radiusMeters;
  }
  return regionRadiusMeters(region);
}

export function denseAreaPolygonCoordinates(item: AdminDashboardDenseAreaItem) {
  const { bounds } = item;
  return [
    { latitude: bounds.swLat, longitude: bounds.swLng },
    { latitude: bounds.swLat, longitude: bounds.neLng },
    { latitude: bounds.neLat, longitude: bounds.neLng },
    { latitude: bounds.neLat, longitude: bounds.swLng },
  ];
}

export function getDenseAreaColors(issueGroupCount: number, maxCount: number) {
  const ratio = maxCount > 0 ? issueGroupCount / maxCount : 0;
  if (ratio >= 0.66) {
    return { fill: 'rgba(108, 99, 255, 0.32)', stroke: colors.brand };
  }
  if (ratio >= 0.33) {
    return { fill: 'rgba(139, 131, 240, 0.26)', stroke: colors.mustard };
  }
  return { fill: 'rgba(212, 204, 255, 0.24)', stroke: colors.peach };
}

export function getMaxDenseAreaCount(areas: AdminDashboardDenseAreaItem[]) {
  return Math.max(1, ...areas.map((area) => area.issueGroupCount));
}

export function denseAreaKey(area: AdminDashboardDenseAreaItem, index: number) {
  return `${area.centerLatitude}-${area.centerLongitude}-${area.issueGroupCount}-${index}`;
}
