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

function getAccentStyle(rank: number | undefined) {
  if (rank === 1) return { backgroundColor: colors.brandActive };
  if (rank === 2) return { backgroundColor: colors.brand };
  if (rank === 3) return { backgroundColor: colors.yellow };
  return { backgroundColor: colors.hairline };
}

function getRankChipStyle(rank: number) {
  if (rank === 1) return { chip: styles.rankChipFirst, text: styles.rankChipTextOn };
  if (rank === 2) return { chip: styles.rankChipSecond, text: styles.rankChipTextOn };
  if (rank === 3) return { chip: styles.rankChipThird, text: styles.rankChipTextThird };
  return { chip: styles.rankChipDefault, text: styles.rankChipTextDefault };
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
  const rankChip = rank != null ? getRankChipStyle(rank) : null;

  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={[styles.accent, getAccentStyle(rank)]} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <View style={styles.titleGroup}>
            {rank != null && rankChip ? (
              <View style={[styles.rankChip, rankChip.chip]}>
                <AppText style={[styles.rankChipText, rankChip.text]}>
                  {isTopRank ? `${rank}위` : rank}
                </AppText>
              </View>
            ) : null}
            <AppText
              style={[styles.label, isTopRank && styles.labelTop]}
              numberOfLines={1}
            >
              {item.categoryName}
            </AppText>
          </View>
          <View style={[styles.countPill, isTopRank && styles.countPillTop]}>
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
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    paddingVertical: 13,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  accent: {
    width: 4,
    borderRadius: 4,
    marginVertical: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
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
  rankChip: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  rankChipFirst: {
    backgroundColor: colors.brandActive,
  },
  rankChipSecond: {
    backgroundColor: colors.brand,
  },
  rankChipThird: {
    backgroundColor: colors.brandSoft,
  },
  rankChipDefault: {
    backgroundColor: colors.soft2,
    minWidth: 26,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  rankChipText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.micro,
    letterSpacing: -0.2,
  },
  rankChipTextOn: {
    color: colors.white,
  },
  rankChipTextThird: {
    color: colors.brandActive,
  },
  rankChipTextDefault: {
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
    backgroundColor: colors.soft2,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  countPillTop: {
    backgroundColor: colors.brandSoft,
  },
  count: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.muted,
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
