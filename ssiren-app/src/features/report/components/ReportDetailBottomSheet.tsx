import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, useBottomSheetClose } from '../../../components/ui/BottomSheet';
import { Chip } from '../../../components/ui/Chip';
import { SummaryBox } from '../../../components/ui/SummaryBox';
import type { ReportDetail } from '../types/reportDetail';

const PRIMARY_COLOR = '#6257FF';

type ReportDetailBottomSheetProps = {
  visible: boolean;
  report: ReportDetail;
  onClose: () => void;
};

function ReportDetailContent({ report }: { report: ReportDetail }) {
  const requestClose = useBottomSheetClose();
  const [isLiked, setIsLiked] = useState(false);

  const handleClose = () => {
    setIsLiked(false);
    requestClose();
  };

  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{report.title}</Text>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={22} color="#4b5563" />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Chip
          variant="risk"
          label={report.riskLabel}
          icon={<Ionicons name="warning-outline" size={13} color="#dc2626" />}
        />
        <Text style={styles.metaDot}>{'\u2022'}</Text>
        <Text style={styles.metaText}>{report.timeAgo}</Text>
        <Text style={styles.metaDot}>{'\u2022'}</Text>
        <Text style={styles.metaText}>{report.distance}</Text>
      </View>

      <Text style={styles.addressText}>{report.address}</Text>

      <View style={styles.tagRow}>
        <Chip variant="tag" label={report.category} />
        <Chip variant="tag" label={`\uB098\uB3C4 \uBD88\uD3B8\uD574\uC694 ${report.yesCount}`} />
        <Pressable
          style={styles.likeChip}
          onPress={() => setIsLiked((prev) => !prev)}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={14}
            color={isLiked ? PRIMARY_COLOR : '#4b5563'}
          />
        </Pressable>
      </View>

      <SummaryBox title="AI \uC694\uC57D" content={report.summary} />

      <View style={styles.organizationRow}>
        <Ionicons name="business-outline" size={16} color="#6b7280" />
        <Text style={styles.organizationText}>{report.organization}</Text>
        <Chip variant="status" label={report.status} />
      </View>
    </>
  );
}

export function ReportDetailBottomSheet({
  visible,
  report,
  onClose,
}: ReportDetailBottomSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ReportDetailContent report={report} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: 13,
    color: '#9ca3af',
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  addressText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
  tagRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likeChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  organizationRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  organizationText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },
});
