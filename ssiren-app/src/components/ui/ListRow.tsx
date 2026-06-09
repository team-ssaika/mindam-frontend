import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, fonts, layout } from '../../theme';
import AppText from './AppText';
import Icon, { IconName } from './Icon';
import Toggle from './Toggle';

type ListRowProps = {
  label: string;
  icon?: IconName;
  sub?: string;
  /** Trailing value text (with chevron). */
  value?: string;
  /** Render a trailing toggle instead of a value. */
  toggle?: boolean;
  on?: boolean;
  onToggle?: (next: boolean) => void;
  /** Destructive styling (e.g. 로그아웃). */
  danger?: boolean;
  /** First row in a group skips the top divider. */
  first?: boolean;
  onPress?: () => void;
  right?: ReactNode;
};

/** Settings / menu row with leading icon tile and trailing value, toggle, or chevron. */
export default function ListRow({
  label,
  icon,
  sub,
  value,
  toggle,
  on = false,
  onToggle,
  danger = false,
  first = false,
  onPress,
  right,
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || toggle}
      style={({ pressed }) => [
        styles.row,
        !first && styles.divider,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={20} color={danger ? colors.danger : colors.ink} />
      ) : null}
      <View style={styles.center}>
        <AppText style={[styles.label, danger && styles.dangerLabel]}>{label}</AppText>
        {sub ? <AppText style={styles.sub}>{sub}</AppText> : null}
      </View>
      {right ??
        (toggle ? (
          <Toggle value={on} onValueChange={onToggle} />
        ) : (
          <View style={styles.trailing}>
            {value ? <AppText style={styles.value}>{value}</AppText> : null}
            {!danger && !value && onPress ? (
              <Icon name="chevR" size={17} color={colors.faint} />
            ) : null}
          </View>
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: layout.screenPadding,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  pressed: {
    backgroundColor: colors.soft,
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  dangerLabel: {
    color: colors.danger,
  },
  sub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  value: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.body,
  },
});
