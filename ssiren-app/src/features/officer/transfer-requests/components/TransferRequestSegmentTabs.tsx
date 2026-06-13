import { Pressable, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { transferRequestStyles as styles } from '../styles';

type TransferRequestSegmentTabsProps = {
  activeTab: 'received' | 'sent';
  showBottomBorder?: boolean;
  onChange: (tab: 'received' | 'sent') => void;
};

function SegmentTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        active ? styles.segmentActive : styles.segmentInactive,
        pressed && !active && styles.segmentPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <AppText style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function TransferRequestSegmentTabs({
  activeTab,
  showBottomBorder = true,
  onChange,
}: TransferRequestSegmentTabsProps) {
  return (
    <View style={[styles.tabWrap, showBottomBorder && styles.tabWrapBorder]}>
      <View style={styles.segmentedControl}>
        <SegmentTab
          label="요청 온 목록"
          active={activeTab === 'received'}
          onPress={() => onChange('received')}
        />
        <SegmentTab
          label="내 신청 목록"
          active={activeTab === 'sent'}
          onPress={() => onChange('sent')}
        />
      </View>
    </View>
  );
}
