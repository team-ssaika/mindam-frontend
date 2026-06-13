import { TextInput, View } from 'react-native';
import { AppText, BottomSheet, Button } from '../../../../components/ui';
import { colors } from '../../../../theme';
import { TRANSFER_RESPONSE_LABELS } from '../constants';
import type { OfficerTransferResponseSheetState } from '../types';
import { transferRequestStyles as styles } from '../styles';

type TransferRequestResponseSheetProps = {
  sheet: OfficerTransferResponseSheetState;
  responseReason: string;
  isSubmitting: boolean;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function TransferRequestResponseSheet({
  sheet,
  responseReason,
  isSubmitting,
  onChangeReason,
  onClose,
  onSubmit,
}: TransferRequestResponseSheetProps) {
  return (
    <BottomSheet visible={sheet != null} onClose={onClose} minHeight="42%">
      {sheet ? (
        <View style={styles.sheetBody}>
          <View>
            <AppText style={styles.sheetEyebrow}>
              이관 요청 {TRANSFER_RESPONSE_LABELS[sheet.decision]}
            </AppText>
            <AppText style={styles.sheetTitle} numberOfLines={2}>
              {sheet.request.issueTitle}
            </AppText>
          </View>
          <View>
            <AppText style={styles.inputLabel}>응답 사유</AppText>
            <TextInput
              value={responseReason}
              onChangeText={onChangeReason}
              placeholder="응답 사유를 입력하세요"
              placeholderTextColor={colors.faint}
              multiline
              maxLength={500}
              textAlignVertical="top"
              style={styles.reasonInput}
            />
            <AppText
              style={[
                styles.reasonCounter,
                responseReason.length >= 500 && styles.reasonCounterLimit,
              ]}
            >
              {responseReason.length}/500
            </AppText>
          </View>
          <View style={styles.sheetActions}>
            <View style={styles.sheetButton}>
              <Button
                label="취소"
                variant="secondary"
                color={colors.muted}
                onPress={onClose}
                disabled={isSubmitting}
              />
            </View>
            <View style={styles.sheetButton}>
              <Button
                label={`${TRANSFER_RESPONSE_LABELS[sheet.decision]}하기`}
                bg={sheet.decision === 'REJECTED' ? colors.danger : colors.brand}
                onPress={onSubmit}
                loading={isSubmitting}
                disabled={isSubmitting || responseReason.trim().length > 500}
              />
            </View>
          </View>
        </View>
      ) : null}
    </BottomSheet>
  );
}
