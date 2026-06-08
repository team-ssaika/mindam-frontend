import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TermsAgreementItemProps = {
  checked: boolean;
  label: string;
  onToggle: () => void;
  onPressLabel: () => void;
  isAll?: boolean;
};

export function TermsAgreementItem({
  checked,
  label,
  onToggle,
  onPressLabel,
  isAll = false,
}: TermsAgreementItemProps) {
  return (
    <View style={[styles.row, isAll && styles.allRow]}>
      <Pressable onPress={onToggle} style={styles.checkboxButton}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
        </View>
      </Pressable>
      <Pressable onPress={onPressLabel} style={styles.labelButton}>
        <Text style={[styles.label, isAll && styles.allLabel]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allRow: {
    paddingBottom: 18,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F5',
  },
  checkboxButton: {
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D3D6DE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#6257FF',
    backgroundColor: '#6257FF',
  },
  labelButton: {
    flex: 1,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4E5361',
  },
  allLabel: {
    fontWeight: '700',
    color: '#17171F',
  },
});
