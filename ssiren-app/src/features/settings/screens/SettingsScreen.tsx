import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
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

  const handlePressNotification = () => {
    // TODO: connect notification route when available
    console.log('[Settings] notification');
  };

  const handlePressMenu = (menu: 'notification' | 'map') => {
    // TODO: connect settings detail routes when available
    console.log(`[Settings] open ${menu}`);
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
              withChevron
              onPress={() => handlePressMenu('notification')}
            />
            <SettingsRow
              label="지도"
              withChevron
              onPress={() => handlePressMenu('map')}
            />
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
          '삭제된 데이터는 복구가 불가능 합니다.\n등록된 민원 제보는 탈퇴 후에도 유지되니\n필요에 따라 삭제 후 탈퇴하시길 바랍니다.'
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
