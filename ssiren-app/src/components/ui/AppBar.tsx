import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import AppText from './AppText';
import Icon from './Icon';

type AppBarProps = {
  title?: string;
  /** Show the brand logo (marker + 시민제보) when there is no title. */
  logo?: boolean;
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
      <AppText variant="heading" color={colors.brand}>시민제보</AppText>
    </View>
  );
}

/** Top app bar: optional back, logo or title left, action slot right. */
export default function AppBar({
  title,
  logo = true,
  onBack,
  right,
  border = true,
}: AppBarProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={[styles.bar, border && styles.border]}>
        <View style={styles.left}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button">
              <Icon name="arrowL" size={22} color={colors.ink} />
            </Pressable>
          ) : null}
          {title ? (
            <AppText variant="heading" color={colors.ink} numberOfLines={1}>
              {title}
            </AppText>
          ) : logo ? (
            <Logo />
          ) : null}
        </View>
        <View style={styles.right}>{right}</View>
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
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.canvas,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
