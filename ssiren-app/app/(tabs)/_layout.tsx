import { Tabs, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../src/components/ui';
import { colors, fonts } from '../../src/theme';
import { TAB_BAR_TOP_PADDING } from '../../src/constants/layout';
import { useTabBarMetrics } from '../../src/hooks/useTabBarMetrics';
import { hasStoredAuthSession } from '../../src/features/auth/services/authService';
import { RoleOnboardingBottomSheet } from '../../src/features/auth/components/RoleOnboardingBottomSheet';
import type { UserRole } from '../../src/features/auth/types/auth.types';
import { fetchMyProfile, updateUserRole } from '../../src/features/profile/api/userApi';

const SKY = '#7EC8F7';
const INACTIVE = '#8D8D8D';
const ssirenWhiteLogo = require('../../src/assets/ssiren-w.png');

function PlusButton() {
  const router = useRouter();

  const handlePress = async () => {
    const hasSession = await hasStoredAuthSession();

    if (!hasSession) {
      Alert.alert('로그인이 필요해요.', '제보하려면 먼저 로그인해 주세요.', [
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
        <Image source={ssirenWhiteLogo} style={styles.plusIcon} resizeMode="contain" />
      </View>
      <Text style={styles.plusLabel}>제보하기</Text>
    </TouchableOpacity>
  );
}

function ChatbotTabIcon({ color }: { color: string }) {
  return (
    <View style={[styles.chatBubbleIcon, { backgroundColor: color }]}>
      <View style={styles.chatFaceRow}>
        <View style={styles.chatEye} />
        <View style={styles.chatEye} />
      </View>
      <View style={styles.chatMouth} />
      <View style={[styles.chatTail, { borderTopColor: color }]} />
    </View>
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

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: SKY,
          tabBarInactiveTintColor: INACTIVE,
          tabBarLabelStyle: {
            fontFamily: fonts.semibold,
            fontSize: 12,
            marginTop: 3,
          },
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: TAB_BAR_TOP_PADDING,
            paddingBottom: insets.bottom,
            borderTopWidth: 1,
            borderTopColor: '#F1F1F1',
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            display: isReportFlow ? 'none' : 'flex',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => (
              <Icon name="home" size={29} color={color} strokeWidth={2.1} />
            ),
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            title: '챗봇',
            tabBarHideOnKeyboard: true,
            tabBarIcon: ({ color }) => <ChatbotTabIcon color={color} />,
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
            tabBarIcon: ({ color }) => (
              <Icon name="user" size={29} color={color} strokeWidth={2.1} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ color }) => (
              <Icon name="gear" size={31} color={color} strokeWidth={2.1} />
            ),
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
    justifyContent: 'flex-start',
  },
  plusButton: {
    width: 62,
    height: 62,
    marginTop: -24,
    borderRadius: 31,
    backgroundColor: SKY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: SKY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 7,
  },
  plusIcon: {
    width: 42,
    height: 42,
  },
  plusLabel: {
    marginTop: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: SKY,
  },
  chatBubbleIcon: {
    width: 32,
    height: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTail: {
    position: 'absolute',
    left: 4,
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  chatFaceRow: {
    flexDirection: 'row',
    gap: 7,
  },
  chatEye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  chatMouth: {
    marginTop: 5,
    width: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
});
