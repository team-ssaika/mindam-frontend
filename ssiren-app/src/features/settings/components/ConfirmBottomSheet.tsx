import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '../../../components/ui/BottomSheet';

type ConfirmBottomSheetProps = {
  actionLabel: string;
  description: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export function ConfirmBottomSheet({
  actionLabel,
  description,
  isLoading = false,
  onClose,
  onConfirm,
  title,
  visible,
}: ConfirmBottomSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      minHeight="31%"
      backdropOpacity={0.56}
      showHandle={false}
      containerStyle={styles.sheetContainer}
    >
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconMark}>!</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={onClose}
            disabled={isLoading}
            style={[styles.button, styles.secondaryButton]}
          >
            <Text style={styles.secondaryButtonText}>닫기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConfirm}
            disabled={isLoading}
            style={[styles.button, styles.primaryButton, isLoading && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? '처리 중...' : actionLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 36,
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D8DCE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMark: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
  },
  title: {
    marginTop: 14,
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
  },
  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#B4B5BB',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 34,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DCE4',
  },
  primaryButton: {
    backgroundColor: '#1E1E20',
  },
  disabledButton: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E20',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
