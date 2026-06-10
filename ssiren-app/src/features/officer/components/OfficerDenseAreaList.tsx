import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Icon } from '../../../components/ui';
import { colors, fonts, radius } from '../../../theme';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';
import { getDenseAreaColors, getMaxDenseAreaCount } from '../utils/officerDenseArea';

type OfficerDenseAreaListProps = {
  denseAreas: AdminDashboardDenseAreaItem[];
  isLoading?: boolean;
  emptyText?: string;
  formatDistance?: (meters: number) => string;
  getDistanceMeters?: (area: AdminDashboardDenseAreaItem) => number | null;
  onPressArea?: (area: AdminDashboardDenseAreaItem) => void;
};

export function OfficerDenseAreaList({
  denseAreas,
  isLoading = false,
  emptyText = '주변에 밀집 구역이 없습니다.',
  formatDistance,
  getDistanceMeters,
  onPressArea,
}: OfficerDenseAreaListProps) {
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

  const maxCount = getMaxDenseAreaCount(denseAreas);

  return (
    <View style={styles.list}>
      {denseAreas.map((area, index) => {
        const { stroke } = getDenseAreaColors(area.issueGroupCount, maxCount);
        const distanceMeters = getDistanceMeters?.(area) ?? null;
        const distanceLabel =
          distanceMeters != null && formatDistance ? formatDistance(distanceMeters) : null;

        return (
          <Pressable
            key={`${area.centerLatitude}-${area.centerLongitude}-${index}`}
            style={({ pressed }) => [styles.row, pressed && onPressArea ? styles.rowPressed : null]}
            disabled={!onPressArea}
            onPress={() => onPressArea?.(area)}
          >
            <View style={[styles.badge, { backgroundColor: stroke }]}>
              <AppText style={styles.badgeText}>{area.issueGroupCount}</AppText>
            </View>
            <View style={styles.textWrap}>
              <AppText style={styles.title}>이슈그룹 {area.issueGroupCount}건 밀집</AppText>
              <AppText style={styles.meta}>
                {distanceLabel ? `${distanceLabel} · ` : ''}
                {area.centerLatitude.toFixed(4)}, {area.centerLongitude.toFixed(4)}
              </AppText>
            </View>
            {onPressArea ? <Icon name="chevR" size={16} color={colors.faint} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.soft,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowPressed: { opacity: 0.92 },
  badge: {
    minWidth: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  textWrap: { flex: 1, minWidth: 0, gap: 2 },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13.5,
    color: colors.muted,
    textAlign: 'center',
  },
});
