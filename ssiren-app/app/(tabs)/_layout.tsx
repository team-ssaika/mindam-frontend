import { Tabs, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '../../src/components/ui';
import { colors } from '../../src/theme';
import { TAB_BAR_TOP_PADDING } from '../../src/constants/layout';
import { useTabBarMetrics } from '../../src/hooks/useTabBarMetrics';
import { hasStoredAuthSession } from '../../src/features/auth/services/authService';
import { RoleOnboardingBottomSheet } from '../../src/features/auth/components/RoleOnboardingBottomSheet';
import type { UserRole } from '../../src/features/auth/types/auth.types';
import { fetchMyProfile, updateUserRole } from '../../src/features/profile/api/userApi';

function PlusButton() {
  const router = useRouter();
  const handlePress = async () => {
    const hasSession = await hasStoredAuthSession();

    if (!hasSession) {
      Alert.alert('로그인이 필요해요.', '제보하려면 먼저 로그인해주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인하기', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    router.push('/(tabs)/plus');
  };

  return (
    <TouchableOpacity
      style={styles.plusButtonWrapper}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="제보하기"
    >
      <View style={styles.plusButton}>
        <Icon name="plus" size={28} color={colors.white} strokeWidth={2.4} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const isReportFlow = pathname === '/plus' || pathname === '/(tabs)/plus';
  const { height: tabBarHeight, insets } = useTabBarMetrics();
  const [isRoleSheetVisible, setIsRoleSheetVisible] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleErrorMessage, setRoleErrorMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkRoleSelection() {
      try {
        const hasSession = await hasStoredAuthSession();
        if (!hasSession) {
          return;
        }

        const profile = await fetchMyProfile();
        if (!isMounted) {
          return;
        }

        setCurrentUserId(profile.id);
        setIsRoleSheetVisible(profile.roleSelected === false);

        if (profile.roleSelected && profile.role === 'OFFICER') {
          router.replace('/(officer)');
        }
      } catch (error) {
        console.log('[Auth] role onboarding check skipped', error);
      }
    }

    checkRoleSelection();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSelectRole = async (role: UserRole, departmentId?: number) => {
    if (isSubmittingRole) {
      return;
    }

    setIsSubmittingRole(true);
    setRoleErrorMessage(null);

    try {
      if (currentUserId == null) {
        throw new Error('current_user_missing');
      }

      await updateUserRole(currentUserId, { role, departmentId });
      setIsRoleSheetVisible(false);

      if (role === 'OFFICER') {
        router.replace('/(officer)');
      }
    } catch (error) {
      console.log('[Auth] role onboarding submit failed', error);
      setRoleErrorMessage('사용자 유형 설정 중 문제가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Every screen renders its own AppBar / floating bar, so no global header.
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.faint,
          tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: TAB_BAR_TOP_PADDING,
            paddingBottom: insets.bottom,
            borderTopColor: colors.hairline,
            display: isReportFlow ? 'none' : 'flex',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <Icon name="home" size={23} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            title: '챗봇',
            tabBarHideOnKeyboard: true,
            tabBarIcon: ({ color }) => <Icon name="chat" size={23} color={color} />,
          }}
        />
        <Tabs.Screen
          name="plus"
          options={{
            title: '',
            tabBarButton: () => <PlusButton />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '내 정보',
            tabBarIcon: ({ color }) => <Icon name="user" size={23} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ color }) => <Icon name="gear" size={23} color={color} />,
          }}
        />
      </Tabs>
      <RoleOnboardingBottomSheet
        visible={isRoleSheetVisible}
        isSubmitting={isSubmittingRole}
        errorMessage={roleErrorMessage}
        onSelectRole={handleSelectRole}
      />
    </>
  );
}

const styles = StyleSheet.create({
  plusButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 56,
    height: 56,
    bottom: 12,
    borderRadius: 28,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.33,
    shadowRadius: 18,
    elevation: 8,
  },
});
