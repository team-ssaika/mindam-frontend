import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

type ToggleProps = {
  value: boolean;
  onValueChange?: (next: boolean) => void;
  disabled?: boolean;
};

/** iOS-style switch (46×27). Ink when on. */
export default function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      style={[styles.track, { backgroundColor: value ? colors.ink : '#d7d3cc' }, disabled && styles.disabled]}
    >
      <View style={[styles.knob, { left: value ? 22 : 3 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 46,
    height: 27,
    borderRadius: 14,
  },
  knob: {
    position: 'absolute',
    top: 3,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
