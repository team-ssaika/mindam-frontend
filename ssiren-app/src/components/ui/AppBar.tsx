import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout } from '../../theme';
import AppText from './AppText';
import Icon from './Icon';

type AppBarProps = {
  title?: string;
  logo?: boolean;
  centerTitle?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  border?: boolean;
};

function Logo() {
  return (
    <View style={styles.logoRow}>
      <View style={styles.logoMark}>
        <Icon name="marker" size={16} color={colors.white} fill />
      </View>
      <AppText variant="heading" color={colors.ink}>시민제보</AppText>
    </View>
  );
}

export default function AppBar({
  title,
  logo = true,
  centerTitle,
  onBack,
  right,
  border = true,
}: AppBarProps) {
  const shouldCenter = centerTitle ?? Boolean(title);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={[styles.bar, border && styles.border]}>
        <View style={styles.side}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button">
              <Icon name="arrowL" size={22} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.sidePlaceholder} />
          )}
        </View>

        <View style={[styles.center, shouldCenter && styles.centerAbsolute]}>
          {title ? (
            <AppText variant="heading" color={colors.ink} numberOfLines={1} style={styles.title}>
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
  safe: {
    backgroundColor: colors.canvas,
  },
  bar: {
    height: 52,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
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
  title: {
    textAlign: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
