import { ActivityIndicator, Pressable, View } from 'react-native';
import { AppText, Icon } from '../../../../components/ui';
import { colors } from '../../../../theme';
import { transferRequestStyles as styles } from '../styles';

type TransferRequestSummaryCardProps = {
  embedded?: boolean;
  pendingCount: number;
  isLoading: boolean;
  onRefresh: () => void;
};

export function TransferRequestSummaryCard({
  embedded = false,
  pendingCount,
  isLoading,
  onRefresh,
}: TransferRequestSummaryCardProps) {
  return (
    <View style={[styles.summary, embedded && styles.embeddedSummary]}>
      <View style={styles.summaryText}>
        <AppText style={styles.summaryTitle}>부서 간 제보 이관</AppText>
        <AppText style={styles.summarySub}>
          요청받은 이관을 검토하고 승인 또는 거절할 수 있어요.
        </AppText>
      </View>
      <View style={styles.summaryActions}>
        <View style={styles.pendingBadge}>
          <AppText style={styles.pendingCount}>{pendingCount}</AppText>
          <AppText style={styles.pendingLabel}>대기</AppText>
        </View>
        {embedded ? (
          <Pressable onPress={onRefresh} disabled={isLoading} hitSlop={8} style={styles.refreshButton}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : (
              <Icon name="refresh" size={20} color={colors.brand} strokeWidth={2.2} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
