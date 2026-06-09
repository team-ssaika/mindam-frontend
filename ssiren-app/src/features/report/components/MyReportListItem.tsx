import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Card, CatChip, Icon, StatusBadge } from '../../../components/ui';
import { colors, fonts } from '../../../theme';
import type { MyReportItem } from '../types/myReport';
import { formatReportDate, getReportStatusTone } from '../utils/reportStatus';

type MyReportListItemProps = {
  item: MyReportItem;
  onPress?: (reportId: number) => void;
};

export function MyReportListItem({ item, onPress }: MyReportListItemProps) {
  const { report, category, department } = item;

  return (
    <Pressable onPress={() => onPress?.(report.id)}>
      <Card bordered={false} style={styles.card}>
        <View style={styles.topRow}>
          <CatChip icon="alert" label={category.categoryName} color={colors.coral} />
          <StatusBadge status={getReportStatusTone(report.status)} size="sm" />
        </View>

        <AppText variant="section" color={colors.ink} numberOfLines={2} style={styles.title}>
          {report.title}
        </AppText>

        <View style={styles.addressRow}>
          <Icon name="location" size={15} color={colors.faint} />
          <AppText style={styles.address} numberOfLines={1}>
            {report.roadAddress}
          </AppText>
        </View>

        <View style={styles.metaRow}>
          <AppText style={styles.metaText}>{department.name}</AppText>
          <AppText style={styles.metaDot}>·</AppText>
          <AppText style={styles.metaText}>{formatReportDate(report.createdAt)}</AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, marginBottom: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { lineHeight: 22 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  address: { flex: 1, fontSize: 13.5, color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.faint },
  metaDot: { marginHorizontal: 6, fontSize: 12.5, color: colors.faint },
});
