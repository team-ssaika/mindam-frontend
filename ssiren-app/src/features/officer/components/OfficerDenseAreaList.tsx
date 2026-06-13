import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText } from '../../../components/ui';
import { colors, fonts, layout, radius, shadow, fontSize } from '../../../theme';
import { fetchAdminIssues } from '../api/adminIssueApi';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';
import type { AdminIssueItem } from '../types/adminIssue';
import { hasValidAdminIssueCoordinate } from '../utils/adminIssueMap';
import {
  DENSE_AREA_DEFAULTS,
  denseAreaKey,
  getMaxDenseAreaCount,
  isIssueGroupInDenseArea,
} from '../utils/officerDenseArea';
import { DenseAreaExplorerMap } from './DenseAreaExplorerMap';

const CHIP_GAP = 8;

type OfficerDenseAreaListProps = {
  denseAreas: AdminDashboardDenseAreaItem[];
  isLoading?: boolean;
  emptyText?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  formatDistance?: (meters: number) => string;
  getDistanceMeters?: (area: AdminDashboardDenseAreaItem) => number | null;
  contentInset?: number;
  edgePadding?: number;
};

export function OfficerDenseAreaList({
  denseAreas,
  isLoading = false,
  emptyText = '주변에 밀집 구역이 없습니다.',
  userLocation = null,
  formatDistance,
  getDistanceMeters,
  contentInset = layout.screenPadding,
  edgePadding = layout.screenPadding,
}: OfficerDenseAreaListProps) {
  const { width: screenWidth } = useWindowDimensions();
  const mapSize = screenWidth - contentInset * 2;
  const viewportWidth = mapSize;
  const chipWidth = denseAreas.length <= 2 ? (mapSize - CHIP_GAP) / 2 : 148;
  const chipScrollRef = useRef<ScrollView>(null);
  const shouldAnimateChipScrollRef = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [issues, setIssues] = useState<AdminIssueItem[]>([]);
  const maxCount = getMaxDenseAreaCount(denseAreas);
  const selectedArea = denseAreas[selectedIndex];

  const scrollChipToCenter = useCallback(
    (index: number, animated = true) => {
      const chipStart = edgePadding + index * (chipWidth + CHIP_GAP);
      const chipCenter = chipStart + chipWidth / 2;
      const targetX = chipCenter - viewportWidth / 2;
      const contentWidth =
        edgePadding * 2 +
        denseAreas.length * chipWidth +
        Math.max(0, denseAreas.length - 1) * CHIP_GAP;
      const maxX = Math.max(0, contentWidth - viewportWidth);

      chipScrollRef.current?.scrollTo({
        x: Math.min(maxX, Math.max(0, targetX)),
        animated,
      });
    },
    [chipWidth, denseAreas.length, edgePadding, viewportWidth]
  );

  const handleSelectChip = useCallback((index: number) => {
    shouldAnimateChipScrollRef.current = true;
    setSelectedIndex(index);
  }, []);

  useEffect(() => {
    if (selectedIndex >= denseAreas.length) {
      setSelectedIndex(0);
    }
  }, [denseAreas.length, selectedIndex]);

  useEffect(() => {
    if (denseAreas.length === 0) {
      return;
    }
    const animated = shouldAnimateChipScrollRef.current;
    shouldAnimateChipScrollRef.current = false;
    const timer = setTimeout(() => scrollChipToCenter(selectedIndex, animated), 0);
    return () => clearTimeout(timer);
  }, [denseAreas.length, chipWidth, scrollChipToCenter, selectedIndex]);

  useEffect(() => {
    if (!userLocation) {
      setIssues([]);
      return;
    }

    let cancelled = false;

    fetchAdminIssues({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radiusMeters: DENSE_AREA_DEFAULTS.radiusMeters,
      myDepartmentOnly: true,
    })
      .then((data) => {
        if (!cancelled) {
          setIssues(Array.isArray(data.issues) ? data.issues : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIssues([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  const issueGroups = useMemo(() => {
    if (!selectedArea) {
      return [];
    }

    return issues
      .filter(hasValidAdminIssueCoordinate)
      .filter((item) =>
        isIssueGroupInDenseArea(
          selectedArea,
          item.issueGroup.groupLatitude,
          item.issueGroup.groupLongitude
        )
      )
      .map((item) => ({
        id: item.issueGroup.id,
        latitude: item.issueGroup.groupLatitude,
        longitude: item.issueGroup.groupLongitude,
        reportCount: item.issueGroup.reportCount,
      }));
  }, [issues, selectedArea]);

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  if (denseAreas.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <AppText style={styles.emptyText}>{emptyText}</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrap, { paddingHorizontal: edgePadding }]}>
        <DenseAreaExplorerMap
          denseAreas={denseAreas}
          selectedIndex={selectedIndex}
          maxCount={maxCount}
          issueGroups={issueGroups}
          userLocation={userLocation}
          size={mapSize}
        />
      </View>

      <ScrollView
        ref={chipScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipScroll, { paddingHorizontal: edgePadding }]}
        style={styles.chipScroller}
      >
        {denseAreas.map((area, index) => {
          const isSelected = index === selectedIndex;
          const distanceMeters = getDistanceMeters?.(area) ?? null;
          const distanceLabel =
            distanceMeters != null && formatDistance ? formatDistance(distanceMeters) : null;
          return (
            <Pressable
              key={denseAreaKey(area, index)}
              style={({ pressed }) => [
                styles.chip,
                { width: chipWidth },
                isSelected ? styles.chipSelected : null,
                pressed ? styles.chipPressed : null,
              ]}
              onPress={() => handleSelectChip(index)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`이슈그룹 ${area.issueGroupCount}건 밀집 구역`}
            >
              <View style={styles.chipContent}>
                <View style={styles.countRow}>
                  <AppText style={[styles.chipCount, isSelected ? styles.chipCountSelected : null]}>
                    {area.issueGroupCount}
                  </AppText>
                  <AppText style={[styles.chipUnit, isSelected ? styles.chipUnitSelected : null]}>
                    건
                  </AppText>
                </View>
                {distanceLabel ? (
                  <AppText style={[styles.chipDistance, isSelected ? styles.chipDistanceSelected : null]}>
                    내 위치로부터 {distanceLabel}
                  </AppText>
                ) : null}
              </View>
              {isSelected ? <View style={styles.chipIndicator} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  mapWrap: {},
  chipScroller: {
    flexGrow: 0,
  },
  chipScroll: {
    gap: 8,
  },
  chip: {
    minHeight: 64,
    backgroundColor: colors.soft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingTop: 11,
    paddingBottom: 13,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  chipSelected: {
    backgroundColor: colors.canvas,
    borderColor: 'rgba(126, 200, 247, 0.35)',
    ...shadow.card,
  },
  chipPressed: { opacity: 0.94 },
  chipContent: {
    gap: 4,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  chipCount: {
    fontFamily: fonts.bold,
    fontSize: fontSize['3xl'],
    lineHeight: 26,
    letterSpacing: -0.6,
    color: colors.body,
  },
  chipCountSelected: {
    color: colors.brand,
  },
  chipUnit: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.muted,
    marginBottom: 1,
  },
  chipUnitSelected: {
    color: colors.brand,
  },
  chipDistance: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    color: colors.muted,
  },
  chipDistanceSelected: {
    color: colors.body,
  },
  chipIndicator: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.brand,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.muted,
    textAlign: 'center',
  },
});
