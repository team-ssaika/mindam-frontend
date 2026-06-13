import { Pressable, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { SENT_STATUS_FILTER_OPTIONS } from '../constants';
import type { OfficerTransferRequestStatus } from '../types';
import { transferRequestStyles as styles } from '../styles';

type TransferRequestFilterChipsProps = {
  selectedStatus: OfficerTransferRequestStatus | null;
  onChange: (status: OfficerTransferRequestStatus | null) => void;
};

export function TransferRequestFilterChips({
  selectedStatus,
  onChange,
}: TransferRequestFilterChipsProps) {
  return (
    <View style={styles.filterSection}>
      <View style={styles.filterDivider} />
      <View style={styles.filterInner}>
        <View style={styles.filterRowWrap}>
          {SENT_STATUS_FILTER_OPTIONS.map((option) => {
            const isActive = selectedStatus === option.value;
            return (
              <Pressable
                key={option.label}
                onPress={() => onChange(option.value)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <AppText style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.filterDivider} />
    </View>
  );
}
