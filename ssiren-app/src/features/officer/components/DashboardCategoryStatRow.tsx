import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { colors, fonts } from '../../../theme';
import type { AdminDashboardCategoryCount } from '../types/adminDashboard';
import { formatCategoryShare } from '../utils/dashboardCategoryDisplay';

const ACCENT_COLOR = colors.brand;

type DashboardCategoryStatRowProps = {
  item: AdminDashboardCategoryCount;
  rank?: number;
  totalCount: number;
};

export function DashboardCategoryStatRow({
  item,
  rank,
  totalCount,
}: DashboardCategoryStatRowProps) {
  const sharePercent =
    totalCount > 0 ? Math.round((item.reportCount / totalCount) * 100) : 0;
  const shareLabel = formatCategoryShare(item.reportCount, totalCount);
  const barWidth = item.reportCount > 0 ? sharePercent : 0;

  return (
    <View style={styles.row}>
      <View style={styles.mainRow}>
        <View style={styles.labelWrap}>
          {rank != null && rank <= 3 ? (
            <AppText style={styles.rank}>{rank}</AppText>
          ) : null}
          <AppText style={styles.label} numberOfLines={1}>
            {item.categoryName}
          </AppText>
        </View>
        <AppText style={styles.stat}>
          <AppText style={styles.count}>{item.reportCount}</AppText>
          <AppText style={styles.share}> · {shareLabel}</AppText>
        </AppText>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${barWidth}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 5,
    gap: 5,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  labelWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rank: {
    width: 14,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: ACCENT_COLOR,
    textAlign: 'center',
  },
  label: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.ink,
  },
  stat: {
    flexShrink: 0,
  },
  count: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: ACCENT_COLOR,
  },
  share: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.muted,
  },
  track: {
    height: 14,
    backgroundColor: colors.soft2,
    borderRadius: 7,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
    backgroundColor: ACCENT_COLOR,
  },
});
