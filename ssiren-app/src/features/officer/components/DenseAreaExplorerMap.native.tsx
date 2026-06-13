import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  KakaoMapView,
  type KakaoMapCircle,
  type KakaoMapRegion,
  type KakaoMapViewHandle,
} from '../../../components/map/KakaoMapView';
import { colors, radius } from '../../../theme';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';
import {
  denseAreaCenter,
  denseAreaMiniMapRegion,
  denseAreaRadiusMeters,
  getDenseAreaColors,
  resolveDenseAreaViewRadiusMeters,
  type DenseAreaIssueGroupMarker,
} from '../utils/officerDenseArea';
import { MARKER_LOGO_DATA_URI } from '../../../constants/markerLogo';

const markerIconUri = MARKER_LOGO_DATA_URI;

type DenseAreaExplorerMapProps = {
  denseAreas: AdminDashboardDenseAreaItem[];
  selectedIndex: number;
  maxCount: number;
  issueGroups?: DenseAreaIssueGroupMarker[];
  userLocation?: { latitude: number; longitude: number } | null;
  size: number;
};

export function DenseAreaExplorerMap({
  denseAreas,
  selectedIndex,
  maxCount,
  issueGroups = [],
  userLocation = null,
  size,
}: DenseAreaExplorerMapProps) {
  const mapRef = useRef<KakaoMapViewHandle | null>(null);
  const hasAnimatedRef = useRef(false);
  const viewRadiusMeters = resolveDenseAreaViewRadiusMeters(size);
  const selectedArea = denseAreas[selectedIndex] ?? denseAreas[0];

  const initialRegion = useMemo(
    () => denseAreaMiniMapRegion(denseAreas[0], viewRadiusMeters),
    [denseAreas, viewRadiusMeters]
  );
  const initialRegionRef = useRef<KakaoMapRegion>(initialRegion);
  const [region, setRegion] = useState<KakaoMapRegion>(initialRegion);

  const markers = useMemo(
    () =>
      issueGroups.map((issueGroup) => ({
        id: String(issueGroup.id),
        latitude: issueGroup.latitude,
        longitude: issueGroup.longitude,
        kind: 'report' as const,
        reportCount: issueGroup.reportCount,
        markerTone: issueGroup.markerTone,
        iconUri: markerIconUri,
      })),
    [issueGroups]
  );

  const circles = useMemo((): KakaoMapCircle[] => {
    if (!selectedArea) {
      return [];
    }
    const { fill, stroke } = getDenseAreaColors(selectedArea.issueGroupCount, maxCount);
    const center = denseAreaCenter(selectedArea);
    return [
      {
        id: 'dense-area',
        latitude: center.latitude,
        longitude: center.longitude,
        radiusMeters: denseAreaRadiusMeters(selectedArea),
        fillColor: fill,
        strokeColor: stroke,
      },
    ];
  }, [maxCount, selectedArea]);

  useEffect(() => {
    const area = denseAreas[selectedIndex];
    if (!area) {
      return;
    }

    const nextRegion = denseAreaMiniMapRegion(area, viewRadiusMeters);
    const duration = hasAnimatedRef.current ? 400 : 0;
    hasAnimatedRef.current = true;
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, duration);
  }, [denseAreas, selectedIndex, viewRadiusMeters]);

  if (!selectedArea) {
    return null;
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]} pointerEvents="none">
      <KakaoMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegionRef.current}
        region={region}
        markers={markers}
        circles={circles}
        userLocation={userLocation}
        showsUserLocation={!!userLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.soft2,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  map: {
    flex: 1,
  },
});
