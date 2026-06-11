import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, radius } from '../../../theme';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';
import {
  denseAreaCenter,
  denseAreaMiniMapRegion,
  denseAreaRadiusMeters,
  getDenseAreaColors,
  resolveDenseAreaViewRadiusMeters,
} from '../utils/officerDenseArea';

type DenseAreaMiniMapProps = {
  area: AdminDashboardDenseAreaItem;
  maxCount: number;
  userLocation?: { latitude: number; longitude: number } | null;
  size?: number;
};

export function DenseAreaMiniMap({
  area,
  maxCount,
  userLocation = null,
  size = 76,
}: DenseAreaMiniMapProps) {
  const mapRef = useRef<MapView>(null);
  const { fill, stroke } = getDenseAreaColors(area.issueGroupCount, maxCount);
  const viewRadiusMeters = resolveDenseAreaViewRadiusMeters(size);
  const region = useMemo(
    () => denseAreaMiniMapRegion(area, viewRadiusMeters),
    [area, viewRadiusMeters]
  );
  const useLiteMode = Platform.OS === 'android' && size <= 120;

  const isFirstRegion = useRef(true);

  useEffect(() => {
    const duration = isFirstRegion.current ? 0 : 350;
    isFirstRegion.current = false;
    mapRef.current?.animateToRegion(region, duration);
  }, [region]);

  const handleMapReady = () => {
    mapRef.current?.animateToRegion(region, 0);
  };

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onMapReady={handleMapReady}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        pointerEvents="none"
        liteMode={useLiteMode}
        cacheEnabled={useLiteMode}
      >
        <Circle
          center={denseAreaCenter(area)}
          radius={denseAreaRadiusMeters(area)}
          fillColor={fill}
          strokeColor={stroke}
          strokeWidth={2}
        />
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
