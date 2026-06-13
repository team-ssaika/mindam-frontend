import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Icon } from '../../../components/ui';
import { colors, fonts, fontSize } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';

type TextSizeOption = 'small' | 'medium' | 'large' | 'xlarge';
type BuildingHeightOption = 'none' | 'medium' | 'high';

const TEXT_SIZE_OPTIONS: Array<{ label: string; value: TextSizeOption }> = [
  { label: '작게', value: 'small' },
  { label: '중간', value: 'medium' },
  { label: '크게', value: 'large' },
  { label: '더크게', value: 'xlarge' },
];

const BUILDING_HEIGHT_OPTIONS: Array<{ label: string; value: BuildingHeightOption }> = [
  { label: '없음', value: 'none' },
  { label: '중간', value: 'medium' },
  { label: '높게', value: 'high' },
];

type OptionButtonProps<T extends string> = {
  label: string;
  value: T;
  selectedValue: T;
  onSelect: (value: T) => void;
};

function OptionButton<T extends string>({ label, value, selectedValue, onSelect }: OptionButtonProps<T>) {
  const selected = value === selectedValue;

  return (
    <Pressable
      onPress={() => onSelect(value)}
      style={({ pressed }) => [
        styles.optionButton,
        selected ? styles.optionButtonSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <AppText style={[styles.optionText, selected ? styles.optionTextSelected : null]}>{label}</AppText>
    </Pressable>
  );
}

type OptionRowProps<T extends string> = {
  label: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
  first?: boolean;
};

function OptionRow<T extends string>({ label, options, value, onChange, first = false }: OptionRowProps<T>) {
  return (
    <View style={[styles.row, !first ? styles.rowDivider : null]}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <View style={styles.optionGroup}>
        {options.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            value={option.value}
            selectedValue={value}
            onSelect={onChange}
          />
        ))}
      </View>
    </View>
  );
}

function RotationToggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [
        styles.toggleTrack,
        value ? styles.toggleTrackOn : styles.toggleTrackOff,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={[styles.toggleKnob, value ? styles.toggleKnobOn : styles.toggleKnobOff]} />
    </Pressable>
  );
}

export function MapSettingsScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const [textSize, setTextSize] = useState<TextSizeOption>('medium');
  const [buildingHeight, setBuildingHeight] = useState<BuildingHeightOption>('high');
  const [rotationEnabled, setRotationEnabled] = useState(true);

  return (
    <View style={styles.flex}>
      <AppBar
        title="지도"
        logo={false}
        border={false}
        backgroundColor="#F4F5F8"
        onBack={() => router.back()}
        right={<Icon name="bell" size={26} color="#111111" strokeWidth={1.9} />}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <OptionRow
            label="글자 크기"
            options={TEXT_SIZE_OPTIONS}
            value={textSize}
            onChange={setTextSize}
            first
          />
          <OptionRow
            label="건물 높이"
            options={BUILDING_HEIGHT_OPTIONS}
            value={buildingHeight}
            onChange={setBuildingHeight}
          />
          <View style={[styles.row, styles.rowDivider]}>
            <AppText style={styles.rowLabel}>회전 기능</AppText>
            <RotationToggle value={rotationEnabled} onChange={setRotationEnabled} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F4F5F8',
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 18,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 2,
    shadowColor: '#AAB2C0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#EDEDED',
  },
  rowLabel: {
    flexShrink: 0,
    fontFamily: fonts.medium,
    fontSize: fontSize.mdLg,
    lineHeight: 20,
    color: '#111111',
  },
  optionGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  optionButton: {
    minHeight: 32,
    minWidth: 46,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.white,
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    lineHeight: 18,
    color: '#686868',
  },
  optionTextSelected: {
    color: colors.brandActive,
  },
  toggleTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: colors.brand,
  },
  toggleTrackOff: {
    backgroundColor: '#D8D8D8',
  },
  toggleKnob: {
    position: 'absolute',
    top: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleKnobOn: {
    right: 3,
  },
  toggleKnobOff: {
    left: 3,
  },
  pressed: {
    opacity: 0.72,
  },
});
