import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { colors, fonts, radius, fontSize } from '../../../theme';
import type { AdminDashboardCategoryCount } from '../types/adminDashboard';
import { formatCategoryShare } from '../utils/dashboardCategoryDisplay';

type DashboardCategoryStatRowProps = {
  item: AdminDashboardCategoryCount;
  rank?: number;
  totalCount: number;
  isLast?: boolean;
};

function getRankTextStyle(rank: number | undefined) {
  if (rank === 1) return styles.rankTextFirst;
  if (rank === 2) return styles.rankTextSecond;
  if (rank === 3) return styles.rankTextThird;
  return styles.rankTextDefault;
}

export function DashboardCategoryStatRow({
  item,
  rank,
  totalCount,
  isLast = false,
}: DashboardCategoryStatRowProps) {
  const sharePercent =
    totalCount > 0 ? Math.round((item.reportCount / totalCount) * 100) : 0;
  const shareLabel = formatCategoryShare(item.reportCount, totalCount);
  const barWidth = item.reportCount > 0 ? sharePercent : 0;
  const isTopRank = rank != null && rank <= 3;

  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={styles.body}>
        <View style={styles.topLine}>
          <View style={styles.titleGroup}>
            {rank != null ? (
              <AppText style={[styles.rankText, getRankTextStyle(rank)]}>
                {isTopRank ? `${rank}위` : rank}
              </AppText>
            ) : null}
            <AppText
              style={[styles.label, isTopRank && styles.labelTop]}
              numberOfLines={1}
            >
              {item.categoryName}
            </AppText>
          </View>
          <View style={styles.countPill}>
            <AppText style={[styles.count, isTopRank && styles.countTop]}>
              {item.reportCount}건
            </AppText>
          </View>
        </View>

        <View style={styles.barRow}>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                isTopRank ? styles.fillTop : styles.fillDefault,
                { width: `${barWidth}%` },
              ]}
            />
          </View>
          <AppText style={[styles.share, isTopRank && styles.shareTop]}>{shareLabel}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  body: {
    gap: 9,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  rankText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    letterSpacing: -0.2,
    flexShrink: 0,
    minWidth: 30,
  },
  rankTextFirst: {
    color: colors.brandActive,
  },
  rankTextSecond: {
    color: colors.brand,
  },
  rankTextThird: {
    color: colors.brandActive,
  },
  rankTextDefault: {
    color: colors.muted,
  },
  label: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSize.mdLg,
    color: colors.body,
  },
  labelTop: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  countPill: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
    shadowColor: '#9AA3B2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  count: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.body,
  },
  countTop: {
    color: colors.brandActive,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: colors.soft2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  fillTop: {
    backgroundColor: colors.brand,
  },
  fillDefault: {
    backgroundColor: colors.faint,
  },
  share: {
    width: 38,
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.faint,
    textAlign: 'right',
  },
  shareTop: {
    color: colors.brandActive,
  },
});
