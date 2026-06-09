import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import {
  deactivateStoredPushToken,
  registerDevicePushToken,
} from '../../notifications/services/pushNotificationService';
import { fetchMyProfile, updateMyProfile } from '../../profile/api/userApi';
import { ConfirmBottomSheet } from '../components/ConfirmBottomSheet';
import { SettingsCard } from '../components/SettingsCard';
import { SettingsRow } from '../components/SettingsRow';
import { logoutUser, withdrawUser } from '../services/settingsService';

type SheetType = 'logout' | 'withdraw' | null;

export function SettingsScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [isAlarmLoading, setIsAlarmLoading] = useState(true);
  const [isAlarmSaving, setIsAlarmSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchMyProfile()
      .then((profile) => {
        if (!isMounted) {
          return;
        }
        setIsAlarmEnabled(Boolean(profile.isAlarmEnabled));
      })
      .catch((error: unknown) => {
        console.log('[Settings] profile load error', error);
      })
      .finally(() => {
        if (isMounted) {
          setIsAlarmLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePressNotification = () => {
    console.log('[Settings] notification');
  };

  const handlePressMenu = (menu: 'map') => {
    console.log(`[Settings] open ${menu}`);
  };

  const handleToggleAlarm = async (nextValue: boolean) => {
    if (isAlarmSaving) {
      return;
    }

    const previousValue = isAlarmEnabled;
    setIsAlarmEnabled(nextValue);
    setIsAlarmSaving(true);

    try {
      const updatedProfile = await updateMyProfile({ isAlarmEnabled: nextValue });
      setIsAlarmEnabled(Boolean(updatedProfile.isAlarmEnabled));

      if (nextValue) {
        try {
          await registerDevicePushToken();
        } catch (error) {
          console.log('[Settings] push token registration error', error);
          Alert.alert(
            '알림 설정은 저장됐어요.',
            '다만 이 에뮬레이터에서 FCM 토큰 등록에 실패했어요. Firebase/에뮬레이터 설정을 확인해주세요.'
          );
        }
      } else {
        await deactivateStoredPushToken();
      }
    } catch (error) {
      console.log('[Settings] alarm update error', error);
      setIsAlarmEnabled(previousValue);
      Alert.alert('알림 설정 변경 실패', '다시 시도해주세요.');
    } finally {
      setIsAlarmSaving(false);
    }
  };

  const handleCloseSheet = () => {
    if (isSubmitting) {
      return;
    }
    setActiveSheet(null);
  };

  const handleConfirmLogout = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await logoutUser();
      setActiveSheet(null);
      router.replace('/auth/login');
    } catch (error) {
      console.log('[Settings] logout error', error);
      Alert.alert('로그아웃 중 문제가 발생했어요.', '다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await withdrawUser();
      setActiveSheet(null);
      router.replace('/auth/login');
    } catch (error) {
      console.log('[Settings] withdraw error', error);
      Alert.alert('회원탈퇴 처리 중 문제가 발생했어요.', '다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push('/(tabs)')}
            accessibilityRole="button"
            style={styles.headerIconButton}
          >
            <Ionicons name="chevron-back" size={24} color="#17171F" />
          </Pressable>
          <Text style={styles.headerTitle}>설정</Text>
          <Pressable
            onPress={handlePressNotification}
            accessibilityRole="button"
            style={styles.headerIconButton}
          >
            <Ionicons name="notifications-outline" size={24} color="#17171F" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <SettingsCard>
            <SettingsRow
              label="알림"
              rightElement={
                isAlarmLoading ? (
                  <ActivityIndicator size="small" color="#17171F" />
                ) : (
                  <Switch
                    value={isAlarmEnabled}
                    onValueChange={handleToggleAlarm}
                    disabled={isAlarmSaving}
                  />
                )
              }
            />
            <SettingsRow label="지도" withChevron onPress={() => handlePressMenu('map')} />
          </SettingsCard>

          <SettingsCard>
            <SettingsRow label="버전 정보" rightLabel="1.32" subtle />
            <SettingsRow
              label="로그아웃"
              withChevron
              onPress={() => setActiveSheet('logout')}
            />
            <SettingsRow
              label="회원탈퇴"
              withChevron
              onPress={() => setActiveSheet('withdraw')}
            />
          </SettingsCard>
        </ScrollView>
      </View>

      <ConfirmBottomSheet
        visible={activeSheet === 'logout'}
        title="로그아웃"
        description="정말 로그아웃 하시겠어요?"
        actionLabel="로그아웃"
        onClose={handleCloseSheet}
        onConfirm={handleConfirmLogout}
        isLoading={isSubmitting}
      />

      <ConfirmBottomSheet
        visible={activeSheet === 'withdraw'}
        title="회원탈퇴"
        description={
          '삭제된 데이터는 복구가 불가능합니다.\n등록된 민원 정보는 탈퇴 전에 확인해주세요.'
        }
        actionLabel="탈퇴하기"
        onClose={handleCloseSheet}
        onConfirm={handleConfirmWithdraw}
        isLoading={isSubmitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#17171F',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 26,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24,
  },
});
