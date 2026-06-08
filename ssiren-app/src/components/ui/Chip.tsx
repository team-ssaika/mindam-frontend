import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type ChipVariant = 'tag' | 'risk' | 'status';

type ChipProps = {
  variant: ChipVariant;
  label: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function Chip({ variant, label, icon, style, onPress }: ChipProps) {
  const content = (
    <View style={[styles.base, styles[variant], style]}>
      {icon}
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  risk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  status: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagText: {
    color: '#111827',
  },
  riskText: {
    color: '#b91c1c',
  },
  statusText: {
    color: '#4f46e5',
  },
});
