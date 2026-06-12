import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { colors, fonts, shadow, fontSize } from '../../../theme';

type OfficerDenseAreaLegendProps = {
  areaCount?: number;
};

export function OfficerDenseAreaLegend({ areaCount }: OfficerDenseAreaLegendProps) {
  return (
    <View style={styles.chip} pointerEvents="none">
      <LinearGradient
        colors={[colors.yellow, colors.mustard, colors.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
      <AppText style={styles.text}>
        이슈 밀집 구역{typeof areaCount === 'number' ? ` ${areaCount}곳` : ''}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.canvas,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    ...shadow.float,
  },
  gradient: {
    width: 42,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.body,
  },
});
