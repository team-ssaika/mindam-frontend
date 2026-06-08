import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '../../../components/ui/Chip';
import type { MyReportItem } from '../types/myReport';
import { formatReportDate, getReportStatusLabel } from '../utils/reportStatus';

type MyReportListItemProps = {
  item: MyReportItem;
};

export function MyReportListItem({ item }: MyReportListItemProps) {
  const { report, category, department } = item;

  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>
        {report.title}
      </Text>

      <View style={styles.chipRow}>
        <Chip variant="tag" label={category.categoryName} />
        <Chip variant="status" label={getReportStatusLabel(report.status)} />
      </View>

      <Text style={styles.address} numberOfLines={1}>
        {report.roadAddress}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{department.name}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{formatReportDate(report.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    color: '#17171F',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  address: {
    fontSize: 14,
    color: '#6D6D78',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#9B9BA6',
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: 13,
    color: '#C4C4CF',
  },
});
