import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, fonts } from '../../theme';
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
        <View style={[styles.iconTile, danger && styles.iconTileDanger]}>
          <Icon name={icon} size={18} color={danger ? colors.coral : colors.ink} />
        </View>
      ) : null}
      <View style={styles.center}>
        <AppText style={[styles.label, danger && { color: colors.coral }]}>{label}</AppText>
        {sub ? <AppText style={styles.sub}>{sub}</AppText> : null}
      </View>
      {right ??
        (toggle ? (
          <Toggle value={on} onValueChange={onToggle} />
        ) : (
          <View style={styles.trailing}>
            {value ? <AppText style={styles.value}>{value}</AppText> : null}
            {!danger ? <Icon name="chevR" size={17} color={colors.faint} /> : null}
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
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  pressed: {
    backgroundColor: colors.soft,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileDanger: {
    backgroundColor: '#fdeceb',
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
