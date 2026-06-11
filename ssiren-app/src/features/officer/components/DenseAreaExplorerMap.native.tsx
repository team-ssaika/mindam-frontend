import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
import { OfficerIssueMapMarker } from './OfficerIssueMapMarker';

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
  const mapRef = useRef<MapView>(null);
  const hasAnimatedRef = useRef(false);
  const viewRadiusMeters = resolveDenseAreaViewRadiusMeters(size);
  const selectedArea = denseAreas[selectedIndex] ?? denseAreas[0];

  const initialRegion = useMemo(
    () => denseAreaMiniMapRegion(denseAreas[0], viewRadiusMeters),
    [denseAreas, viewRadiusMeters]
  );

  const { fill, stroke } = getDenseAreaColors(selectedArea.issueGroupCount, maxCount);

  useEffect(() => {
    const area = denseAreas[selectedIndex];
    if (!area) {
      return;
    }

    const region = denseAreaMiniMapRegion(area, viewRadiusMeters);
    const duration = hasAnimatedRef.current ? 400 : 0;
    hasAnimatedRef.current = true;
    mapRef.current?.animateToRegion(region, duration);
  }, [denseAreas, selectedIndex, viewRadiusMeters]);

  const handleMapReady = () => {
    if (!selectedArea) {
      return;
    }
    mapRef.current?.animateToRegion(denseAreaMiniMapRegion(selectedArea, viewRadiusMeters), 0);
  };

  if (!selectedArea) {
    return null;
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        pointerEvents="none"
      >
        <Circle
          center={denseAreaCenter(selectedArea)}
          radius={denseAreaRadiusMeters(selectedArea)}
          fillColor={fill}
          strokeColor={stroke}
          strokeWidth={2}
        />
        {issueGroups.map((issueGroup) => (
          <Marker
            key={issueGroup.id}
            coordinate={{ latitude: issueGroup.latitude, longitude: issueGroup.longitude }}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <OfficerIssueMapMarker reportCount={issueGroup.reportCount} />
          </Marker>
        ))}
        {userLocation ? (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userDotOuter}>
              <View style={styles.userDotInner} />
            </View>
          </Marker>
        ) : null}
      </MapView>
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
    ...StyleSheet.absoluteFillObject,
  },
  userDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(108, 99, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDotInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
