import { StyleSheet, View } from 'react-native';
import { colors, fonts } from '../../theme';
import AppText from './AppText';
import Icon, { IconName } from './Icon';

type CatChipProps = {
  label: string;
  icon?: IconName;
  color?: string;
};

/** Inline category label with a leading icon (e.g. 🛑 도로·시설 파손). */
export default function CatChip({ label, icon = 'pin', color = colors.brand }: CatChipProps) {
  return (
    <View style={styles.base}>
      <Icon name={icon} size={14} color={color} />
      <AppText style={[styles.text, { color }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
  },
});
