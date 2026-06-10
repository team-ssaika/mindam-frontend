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
          {checked ? <Icon name="check" size={13} color={colors.white} strokeWidth={2.6} /> : null}
        </View>
      </Pressable>
      <Pressable onPress={onPressLabel} style={styles.labelButton}>
        <AppText style={[styles.label, isAll && styles.allLabel]}>{label}</AppText>
      </Pressable>
      {!isAll ? <Icon name="chevR" size={18} color="#000000" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allRow: {
    paddingBottom: 22,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  checkboxButton: {
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C6C6C6',
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
    fontFamily: fonts.medium,
    fontSize: 15.5,
    lineHeight: 23,
    color: '#5F5F5F',
  },
  allLabel: {
    fontFamily: fonts.medium,
    color: '#6C6C6C',
  },
});
