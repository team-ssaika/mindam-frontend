import { View } from 'react-native';
import { AppText, Button, Icon } from '../../../../components/ui';
import { colors } from '../../../../theme';
import type { OfficerTransferDirection, OfficerTransferRequest } from '../types';
import {
  formatTransferDateTime,
  getTransferStatusDisplay,
  isTransferPending,
} from '../utils';
import { transferRequestStyles as styles } from '../styles';

type TransferRequestCardProps = {
  item: OfficerTransferRequest;
  direction: OfficerTransferDirection;
  showDivider?: boolean;
  onApprove: () => void;
  onReject: () => void;
};

export function TransferRequestCard({
  item,
  direction,
  showDivider = false,
  onApprove,
  onReject,
}: TransferRequestCardProps) {
  const status = getTransferStatusDisplay(item.status);
  const canRespond = direction === 'received' && isTransferPending(item.status);
  const metaParts = [
    item.transferredReportCount != null ? `이관 제보 ${item.transferredReportCount}건` : null,
    item.responseAt ? `응답 ${formatTransferDateTime(item.responseAt)}` : null,
  ].filter(Boolean);

  return (
    <View style={[styles.requestCard, showDivider && styles.requestCardDivider]}>
      <View style={styles.cardTopRow}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusBadgeDot, { backgroundColor: status.dot }]} />
          <AppText style={styles.statusBadgeText}>{status.label}</AppText>
        </View>
        <AppText style={styles.dateText}>{formatTransferDateTime(item.requestedAt)}</AppText>
      </View>

      <AppText style={styles.cardTitle} numberOfLines={2}>
        {item.issueTitle}
      </AppText>

      <View style={styles.deptRow}>
        <AppText style={styles.deptFrom} numberOfLines={1}>
          {item.fromDepartmentName}
        </AppText>
        <Icon name="chevR" size={14} color="#B8B8B8" />
        <AppText style={styles.deptTo} numberOfLines={1}>
          {item.targetDepartmentName}
        </AppText>
      </View>

      {item.requestReason ? (
        <View style={styles.reasonBox}>
          <AppText style={styles.reasonLabel}>요청 사유</AppText>
          <AppText style={styles.reasonText}>{item.requestReason}</AppText>
        </View>
      ) : null}

      {item.responseReason ? (
        <View style={styles.reasonBox}>
          <AppText style={styles.reasonLabel}>응답 사유</AppText>
          <AppText style={styles.reasonText}>{item.responseReason}</AppText>
        </View>
      ) : null}

      {metaParts.length > 0 ? (
        <AppText style={styles.metaLine} numberOfLines={2}>
          {metaParts.join(' · ')}
        </AppText>
      ) : null}

      {canRespond ? (
        <View style={styles.responseActions}>
          <View style={styles.actionButton}>
            <Button label="거절" variant="secondary" color={colors.danger} onPress={onReject} />
          </View>
          <View style={styles.actionButton}>
            <Button label="승인" icon="check" onPress={onApprove} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
