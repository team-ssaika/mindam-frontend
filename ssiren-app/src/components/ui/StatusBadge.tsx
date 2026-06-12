import { StyleSheet, View } from 'react-native';
import { fontSize, fonts, radius, statusColors, StatusKey } from '../../theme';
import AppText from './AppText';

type StatusBadgeProps = {
  status: StatusKey;
  size?: 'sm' | 'md';
  /** Override the default Korean label (접수 대기 / 처리중 / 처리 완료). */
  label?: string;
};

/** Pill badge for report status, with a leading dot. */
export default function StatusBadge({ status, size = 'md', label }: StatusBadgeProps) {
  const st = statusColors[status];
  const small = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: st.bg },
        small ? styles.padSm : styles.padMd,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: st.dot }]} />
      <AppText
        style={[styles.text, { color: st.fg, fontSize: small ? fontSize.micro : fontSize.sm }]}
      >
        {label ?? st.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  padSm: { paddingVertical: 3, paddingLeft: 7, paddingRight: 9 },
  padMd: { paddingVertical: 5, paddingLeft: 9, paddingRight: 11 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: fonts.semibold },
});
