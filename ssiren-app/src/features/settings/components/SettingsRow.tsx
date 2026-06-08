import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type SettingsRowProps = {
  label: string;
  onPress?: () => void;
  rightLabel?: string;
  withChevron?: boolean;
  subtle?: boolean;
};

export function SettingsRow({
  label,
  onPress,
  rightLabel,
  withChevron = false,
  subtle = false,
}: SettingsRowProps) {
  const content = (
    <View style={styles.row}>
      <Text style={[styles.label, subtle && styles.subtleLabel]}>{label}</Text>
      <View style={styles.rightArea}>
        {rightLabel ? (
          <Text style={[styles.rightLabel, subtle && styles.subtleLabel]}>{rightLabel}</Text>
        ) : null}
        {withChevron ? (
          <Ionicons name="chevron-forward" size={22} color="#C5CAD4" />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 18,
    color: '#17171F',
  },
  subtleLabel: {
    color: '#A4A9B3',
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightLabel: {
    fontSize: 18,
    color: '#17171F',
  },
  pressed: {
    opacity: 0.72,
  },
});
