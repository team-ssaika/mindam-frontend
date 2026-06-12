import { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Icon } from '../../../components/ui';
import { colors, fonts, radius, fontSize } from '../../../theme';

const SIREN_LOGIN_IMAGE = require('../../../assets/ssiren-login.png');

type AuthScreenProps = {
  children: ReactNode;
  bottom?: ReactNode;
  devAction?: ReactNode;
  onBack?: () => void;
};

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'kakao' | 'muted';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

type AuthInputProps = TextInputProps & {
  label: string;
  helpText?: string;
};

export function SirenMark({ size = 76 }: { size?: number }) {
  return (
    <Image
      source={SIREN_LOGIN_IMAGE}
      defaultSource={SIREN_LOGIN_IMAGE}
      fadeDuration={0}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
}

export function AuthScreen({ children, bottom, devAction, onBack }: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="이전으로"
        >
          <Icon name="arrowL" size={23} color="#000000" />
        </Pressable>
      ) : null}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.screenContent}>
          {children}
          {bottom ? <View style={styles.bottomSlot}>{bottom}</View> : null}
        </View>
      </KeyboardAvoidingView>
      {devAction}
    </SafeAreaView>
  );
}

export function AuthHero({
  title,
  subtitle,
  align = 'center',
  markSize = 78,
  topPadding,
}: {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  markSize?: number;
  topPadding?: number;
}) {
  return (
    <View
      style={[
        styles.hero,
        align === 'left' && styles.heroLeft,
        topPadding != null && { paddingTop: topPadding },
      ]}
    >
      <SirenMark size={markSize} />
      <View style={styles.heroTextWrap}>
        <AppText style={[styles.title, align === 'left' && styles.titleLeft]}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={[styles.subtitle, align === 'left' && styles.subtitleLeft]}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export function AuthButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
}: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'dark' && styles.buttonDark,
        variant === 'kakao' && styles.buttonKakao,
        variant === 'muted' && styles.buttonMuted,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'kakao' ? '#111111' : colors.white} />
      ) : (
        <>
          {icon}
          <AppText
            style={[
              styles.buttonText,
              variant === 'kakao' && styles.buttonTextDark,
              variant === 'muted' && styles.buttonTextMuted,
            ]}
          >
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

export function KakaoGlyph() {
  return (
    <View style={styles.kakaoGlyphWrap}>
      <View style={styles.kakaoGlyph} />
      <View style={styles.kakaoGlyphTail} />
    </View>
  );
}

export function AuthInput({ label, helpText, style, ...props }: AuthInputProps) {
  return (
    <View style={styles.inputGroup}>
      <AppText style={styles.inputLabel}>{label}</AppText>
      <TextInput
        {...props}
        placeholderTextColor="#8C8C8C"
        style={[styles.input, style]}
      />
      {helpText ? <AppText style={styles.helpText}>{helpText}</AppText> : null}
    </View>
  );
}

export function DevButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.devButton} hitSlop={10}>
      <AppText style={styles.devText}>S</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 58,
    left: 24,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  screenContent: {
    flex: 1,
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 42,
    paddingBottom: 28,
  },
  bottomSlot: {
    marginTop: 'auto',
    paddingTop: 34,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 70,
  },
  heroLeft: {
    alignItems: 'flex-start',
    paddingTop: 104,
  },
  heroTextWrap: {
    gap: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontWeight: '900',
    fontSize: 35,
    lineHeight: 41,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -1.2,
  },
  titleLeft: {
    textAlign: 'left',
    fontSize: 30,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.mdLg,
    lineHeight: 23,
    color: '#8B8B8B',
    textAlign: 'center',
  },
  subtitleLeft: {
    textAlign: 'left',
  },
  button: {
    height: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonPrimary: {
    backgroundColor: colors.brand,
  },
  buttonDark: {
    backgroundColor: '#000000',
  },
  buttonKakao: {
    backgroundColor: '#F6E248',
  },
  buttonMuted: {
    backgroundColor: '#B4B4B4',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
  buttonTextDark: {
    color: '#111111',
  },
  buttonTextMuted: {
    color: colors.white,
  },
  kakaoGlyphWrap: {
    width: 26,
    height: 20,
    position: 'relative',
  },
  kakaoGlyph: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 24,
    height: 17,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  kakaoGlyphTail: {
    position: 'absolute',
    left: 7,
    bottom: 0,
    width: 8,
    height: 8,
    backgroundColor: '#000000',
    transform: [{ rotate: '45deg' }],
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000000',
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    backgroundColor: colors.canvas,
    paddingHorizontal: 18,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: '#111111',
  },
  helpText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 22,
    color: '#8B8B8B',
  },
  devButton: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#8A8A8A',
  },
});
