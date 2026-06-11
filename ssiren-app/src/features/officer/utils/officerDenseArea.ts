import { colors } from '../../../theme';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';

export const DENSE_AREA_DEFAULTS = {
  radiusMeters: 5000,
  gridSizeMeters: 300,
  minIssueGroupCount: 2,
} as const;

type LatLng = { latitude: number; longitude: number };
type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };

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

export function denseAreaCenter(item: AdminDashboardDenseAreaItem): LatLng {
  return {
    latitude: item.centerLatitude,
    longitude: item.centerLongitude,
  };
}

export function denseAreaRadiusMeters(item: AdminDashboardDenseAreaItem) {
  const { bounds, centerLatitude } = item;
  const latMeters = (bounds.neLat - bounds.swLat) * 111_320;
  const lngMeters =
    (bounds.neLng - bounds.swLng) * 111_320 * Math.cos((centerLatitude * Math.PI) / 180);
  return Math.max(latMeters, lngMeters) / 2;
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

export function resolveDenseAreaViewRadiusMeters(mapSize: number) {
  return Math.round(Math.max(200, Math.min(280, mapSize * 0.72)));
}

export function denseAreaMiniMapRegion(
  area: AdminDashboardDenseAreaItem,
  viewRadiusMeters = 420
): Region {
  const center = denseAreaCenter(area);
  const spanMeters = viewRadiusMeters * 2;
  const latitudeDelta = spanMeters / 111_320;
  const longitudeDelta =
    spanMeters / (111_320 * Math.cos((center.latitude * Math.PI) / 180));

  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

export type DenseAreaThumbnailPoint = { x: number; y: number };

export type DenseAreaIssueGroupMarker = {
  id: number;
  latitude: number;
  longitude: number;
  reportCount: number;
};

export function isIssueGroupInDenseArea(
  area: AdminDashboardDenseAreaItem,
  latitude: number,
  longitude: number
) {
  const { bounds } = area;
  return (
    latitude >= bounds.swLat &&
    latitude <= bounds.neLat &&
    longitude >= bounds.swLng &&
    longitude <= bounds.neLng
  );
}

export function createDenseAreaProjector(
  area: AdminDashboardDenseAreaItem,
  size: number,
  padding = 10
) {
  const viewRadiusMeters = resolveDenseAreaViewRadiusMeters(size);
  const spanMeters = viewRadiusMeters * 2;
  const latSpan = spanMeters / 111_320;
  const lngSpan =
    spanMeters / (111_320 * Math.cos((area.centerLatitude * Math.PI) / 180));
  const minLat = area.centerLatitude - latSpan / 2;
  const maxLat = area.centerLatitude + latSpan / 2;
  const minLng = area.centerLongitude - lngSpan / 2;
  const maxLng = area.centerLongitude + lngSpan / 2;
  const inner = size - padding * 2;

  const project = (latitude: number, longitude: number): DenseAreaThumbnailPoint => ({
    x: padding + ((longitude - minLng) / lngSpan) * inner,
    y: padding + (1 - (latitude - minLat) / latSpan) * inner,
  });

  return { project };
}

export function denseAreaThumbnailProjection(
  area: AdminDashboardDenseAreaItem,
  userLocation: LatLng | null | undefined,
  size: number,
  padding = 10
) {
  const { project } = createDenseAreaProjector(area, size, padding);
  const center = project(area.centerLatitude, area.centerLongitude);
  const latDelta = denseAreaRadiusMeters(area) / 111_320;
  const north = project(area.centerLatitude + latDelta, area.centerLongitude);
  const pixelRadius = Math.hypot(north.x - center.x, north.y - center.y);

  return {
    circle: { cx: center.x, cy: center.y, r: pixelRadius },
    user: userLocation ? project(userLocation.latitude, userLocation.longitude) : null,
    project,
  };
}
