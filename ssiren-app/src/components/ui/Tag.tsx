import { StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '../../theme';
import AppText from './AppText';

type TagProps = {
  label: string;
  /** Background / foreground override; defaults to accent-soft + accent. */
  bg?: string;
  color?: string;
};

/** Small keyword pill (e.g. #보도블록 #긴급). */
export default function Tag({ label, bg, color }: TagProps) {
  return (
    <View style={[styles.base, { backgroundColor: bg ?? colors.accentSoft }]}>
      <AppText style={[styles.text, { color: color ?? colors.accent }]}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
