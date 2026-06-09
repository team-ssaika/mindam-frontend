import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Icon } from '../../../components/ui';
import { colors, fonts } from '../../../theme';

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
          {checked ? <Icon name="check" size={14} color={colors.white} strokeWidth={2.6} /> : null}
        </View>
      </Pressable>
      <Pressable onPress={onPressLabel} style={styles.labelButton}>
        <AppText style={[styles.label, isAll && styles.allLabel]}>{label}</AppText>
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
    borderBottomColor: colors.hairline,
  },
  checkboxButton: {
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.faint,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.brand,
    backgroundColor: colors.brand,
  },
  labelButton: {
    flex: 1,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.body,
  },
  allLabel: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
});
