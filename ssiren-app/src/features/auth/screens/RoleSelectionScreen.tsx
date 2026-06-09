import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, Icon } from '../../../components/ui';
import { colors, fonts, layout, radius } from '../../../theme';
import { setSelectedAppRole } from '../services/authService';
import type { AppUserRole } from '../types/auth.types';

type RoleOption = {
  role: AppUserRole;
  title: string;
  description: string;
  icon: 'megaphone' | 'shield';
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'CITIZEN',
    title: '민원인',
    description: '주변 불편 사항을 제보하고 처리 현황을 확인해요',
    icon: 'megaphone',
  },
  {
    role: 'OFFICER',
    title: '관리자',
    description: '접수된 민원을 확인하고 처리 업무를 진행해요',
    icon: 'shield',
  },
];

export function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AppUserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePressContinue = async () => {
    if (!selectedRole || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await setSelectedAppRole(selectedRole);
      router.replace('/(tabs)');
    } catch (error) {
      console.log('[Auth] save selected role error', error);
      Alert.alert('역할 저장에 실패했어요.', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <AppText variant="display" color={colors.ink}>
            어떤 역할로 이용하시나요?
          </AppText>
          <AppText style={styles.subtitle}>
            선택한 역할에 맞는 화면으로 안내해 드릴게요
          </AppText>
        </View>

        <View style={styles.optionList}>
          {ROLE_OPTIONS.map((option) => {
            const isSelected = selectedRole === option.role;

            return (
              <Pressable
                key={option.role}
                onPress={() => setSelectedRole(option.role)}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Icon
                    name={option.icon}
                    size={26}
                    color={isSelected ? colors.brand : colors.muted}
                  />
                </View>

                <View style={styles.optionTextWrap}>
                  <AppText
                    style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}
                  >
                    {option.title}
                  </AppText>
                  <AppText style={styles.optionDescription}>{option.description}</AppText>
                </View>

                <Icon
                  name={isSelected ? 'radioOn' : 'radioOff'}
                  size={22}
                  color={isSelected ? colors.brand : colors.faint}
                />
              </Pressable>
            );
          })}
        </View>

        {isSubmitting ? (
          <View style={styles.loadingButton}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : (
          <Button
            label="시작하기"
            onPress={handlePressContinue}
            disabled={!selectedRole}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  container: {
    flex: 1,
    paddingHorizontal: layout.screenPadding + 4,
    paddingTop: 32,
    paddingBottom: 44,
    justifyContent: 'space-between',
  },
  headerSection: {
    gap: 10,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  optionList: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.soft,
  },
  optionCardSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft2,
  },
  iconWrapSelected: {
    backgroundColor: colors.accentSoft,
  },
  optionTextWrap: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  optionTitleSelected: {
    color: colors.brand,
  },
  optionDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  loadingButton: {
    height: 56,
    borderRadius: radius['2xl'],
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
