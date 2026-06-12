import { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, fonts, layout } from '../../theme';
import AppText from './AppText';
import Icon from './Icon';

const ssirenNameLogo = require('../../assets/SSIREN-name.png');

type AppBarProps = {
  title?: string;
  logo?: boolean;
  centerTitle?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  border?: boolean;
  backgroundColor?: string;
};

function Logo() {
  return <Image source={ssirenNameLogo} style={styles.nameLogo} resizeMode="contain" />;
}

export default function AppBar({
  title,
  logo = true,
  centerTitle,
  onBack,
  right,
  border = false,
  backgroundColor = colors.canvas,
}: AppBarProps) {
  const shouldCenter = centerTitle ?? Boolean(title);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor }]}>
      <View style={[styles.bar, { backgroundColor }, border && styles.border]}>
        <View style={styles.side}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button">
              <Icon name="arrowL" size={22} color={colors.ink} strokeWidth={2.2} />
            </Pressable>
          ) : (
            <View style={styles.sidePlaceholder} />
          )}
        </View>

        <View style={[styles.center, shouldCenter && styles.centerAbsolute]}>
          {title ? (
            <AppText style={styles.titleText} numberOfLines={1}>
              {title}
            </AppText>
          ) : logo ? (
            <Logo />
          ) : null}
        </View>

        <View style={[styles.side, styles.sideRight]}>{right ?? <View style={styles.sidePlaceholder} />}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {},
  bar: {
    height: 52,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  side: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  sidePlaceholder: {
    width: 22,
    height: 22,
  },
  center: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerAbsolute: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
  },
  titleText: {
    fontFamily: fonts.black,
    fontSize: fontSize['2xl'],
    color: colors.ink,
    textAlign: 'center',
  },
  nameLogo: {
    width: 96,
    height: 30,
  },
});
