import { Tabs, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
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
        <Svg width={62} height={62} viewBox="0 0 62 62" style={styles.plusGradient}>
          <Defs>
            <LinearGradient id="plusGradient" x1="6" y1="6" x2="54" y2="58">
              <Stop offset="0" stopColor="#70B9F5" />
              <Stop offset="0.5" stopColor="#8FD0FA" />
              <Stop offset="1" stopColor="#B8E1F6" />
            </LinearGradient>
          </Defs>
          <Circle cx={31} cy={31} r={31} fill="url(#plusGradient)" />
        </Svg>
        <Image source={ssirenWhiteLogo} style={styles.plusIcon} resizeMode="contain" />
      </View>
      <Text style={styles.plusLabel}>제보하기</Text>
    </TouchableOpacity>
  );
}

function ChatbotTabIcon({ color }: { color: string }) {
  return (
    <View style={[styles.chatBubbleIcon, { borderColor: color }]}>
      <View style={styles.chatFaceRow}>
        <View style={styles.chatEye} />
        <View style={styles.chatEye} />
      </View>
      <View style={styles.chatMouth} />
      <View style={[styles.chatTailOuter, { borderTopColor: color }]} />
      <View style={styles.chatTailInner} />
    </View>
  );
}

function CitizenHomeTabIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M4 10.5 12 4l8 6.5v8.4A2.1 2.1 0 0 1 17.9 21H6.1A2.1 2.1 0 0 1 4 18.9v-8.4Z"
        fill="none"
        stroke={color}
        strokeWidth={2.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.2 21v-7h5.6v7"
        fill="none"
        stroke={color}
        strokeWidth={2.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CitizenUserTabIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Circle cx={12} cy={7.2} r={3.15} fill="none" stroke={color} strokeWidth={2.45} />
      <Path
        d="M5 20v-1.4c0-3 3.1-5 7-5s7 2 7 5V20H5Z"
        fill="none"
        stroke={color}
        strokeWidth={2.45}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CitizenGearTabIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3.05} fill="none" stroke={color} strokeWidth={2.15} />
      <Path
        d="M19.2 13.7c.1-.55.15-1.1.15-1.7s-.05-1.15-.15-1.7l2-1.5-2-3.45-2.4.95a7.7 7.7 0 0 0-2.75-1.6L13.7 2h-3.4l-.35 2.7a7.7 7.7 0 0 0-2.75 1.6l-2.4-.95-2 3.45 2 1.5c-.1.55-.15 1.1-.15 1.7s.05 1.15.15 1.7l-2 1.5 2 3.45 2.4-.95a7.7 7.7 0 0 0 2.75 1.6l.35 2.7h3.4l.35-2.7a7.7 7.7 0 0 0 2.75-1.6l2.4.95 2-3.45-2-1.5Z"
        fill="none"
        stroke={color}
        strokeWidth={2.15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
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
            tabBarIcon: ({ color }) => <CitizenHomeTabIcon color={color} />,
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
            tabBarIcon: ({ color }) => <CitizenUserTabIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ color }) => <CitizenGearTabIcon color={color} />,
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: SKY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 7,
  },
  plusGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  plusIcon: {
    width: 57,
    height: 57,
    zIndex: 1,
  },
  plusLabel: {
    marginTop: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: SKY,
  },
  chatBubbleIcon: {
    width: 29,
    height: 23,
    borderRadius: 9,
    borderWidth: 2.3,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTailOuter: {
    position: 'absolute',
    left: 4,
    bottom: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  chatTailInner: {
    position: 'absolute',
    left: 6,
    bottom: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  chatFaceRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chatEye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8D8D8D',
  },
  chatMouth: {
    marginTop: 4,
    width: 11,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#8D8D8D',
  },
});
