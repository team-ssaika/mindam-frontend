import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ReactNode, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Icon, Toggle } from '../../../components/ui';
import type { IconName } from '../../../components/ui';
import { colors, fonts, fontSize } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import {
  disablePushNotificationsWithProfile,
  registerDevicePushToken,
} from '../../notifications/services/pushNotificationService';
import { fetchMyProfile, updateMyProfile } from '../../profile/api/userApi';
import { ConfirmBottomSheet } from '../components/ConfirmBottomSheet';
import { logoutUser, withdrawUser } from '../services/settingsService';
import { hasStoredAuthSession } from '../../auth/services/authService';

type SheetType = 'logout' | 'withdraw' | null;

function SettingCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.card}>{children}</View>
  );
}

type SettingRowProps = {
  icon: IconName;
  label: string;
  sub?: string;
  value?: string;
  danger?: boolean;
  showChevron?: boolean;
  first?: boolean;
  right?: ReactNode;
  onPress?: () => void;
};

function SettingRow({
  icon,
  label,
  sub,
  value,
  danger = false,
  showChevron,
  first = false,
  right,
  onPress,
}: SettingRowProps) {
  const tint = danger ? '#EF5A5A' : '#111111';
  const shouldShowChevron = showChevron ?? Boolean(onPress);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        !first ? styles.rowDivider : null,
        pressed && onPress ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.iconSlot}>
        <Icon name={icon} size={25} color={tint} strokeWidth={1.9} />
      </View>

      <View style={styles.rowTextBox}>
        <AppText style={[styles.rowLabel, danger ? styles.dangerText : null]}>{label}</AppText>
        {sub ? <AppText style={styles.rowSub}>{sub}</AppText> : null}
      </View>

      {right ?? (
        <View style={styles.rowRight}>
          {value ? <AppText style={styles.rowValue}>{value}</AppText> : null}
          {shouldShowChevron ? <Icon name="chevR" size={20} color="#B8B5C2" strokeWidth={2.2} /> : null}
        </View>
      )}
    </Pressable>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [isAlarmLoading, setIsAlarmLoading] = useState(true);
  const [isAlarmSaving, setIsAlarmSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isAlarmSavingRef = useRef(false);

  const goToStartSelection = () => {
    router.replace('/auth/role-select');
  };

  const loadSettings = useCallback(async () => {
    if (isAlarmSavingRef.current) {
      return;
    }

    setIsAlarmLoading(true);

    try {
      const hasSession = await hasStoredAuthSession();
      setIsAuthenticated(hasSession);

      if (!hasSession) {
        return;
      }

      const profile = await fetchMyProfile();
      setIsAlarmEnabled(Boolean(profile.isAlarmEnabled));
    } catch (error) {
      console.log('[Settings] profile load error', error);
    } finally {
      setIsAlarmLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleToggleAlarm = async (nextValue: boolean) => {
    if (isAlarmSaving) return;
    if (!isAuthenticated) {
      Alert.alert('로그인이 필요해요.', '푸시 알림을 받으려면 먼저 로그인해주세요.');
      return;
    }

    const previousValue = isAlarmEnabled;
    isAlarmSavingRef.current = true;
    setIsAlarmSaving(true);

    try {
      if (nextValue) {
        setIsAlarmEnabled(true);
        const updatedProfile = await updateMyProfile({ isAlarmEnabled: true });
        setIsAlarmEnabled(Boolean(updatedProfile.isAlarmEnabled));

        try {
          await registerDevicePushToken();
        } catch (error) {
          console.log('[Settings] push token registration error', error);
          Alert.alert(
            '알림 설정은 저장됐어요.',
            '다만 이 에뮬레이터에서 FCM 토큰 등록에 실패했어요. Firebase/에뮬레이터 설정을 확인해주세요.'
          );
        }
        return;
      }

      setIsAlarmEnabled(false);
      const updatedProfile = await disablePushNotificationsWithProfile();
      setIsAlarmEnabled(Boolean(updatedProfile.isAlarmEnabled));
    } catch (error) {
      console.log('[Settings] alarm update error', error);
      setIsAlarmEnabled(previousValue);
      Alert.alert('알림 설정 변경 실패', '다시 시도해주세요.');
    } finally {
      isAlarmSavingRef.current = false;
      setIsAlarmSaving(false);
    }
  };

  const handleCloseSheet = () => {
    if (isSubmitting) return;
    setActiveSheet(null);
  };

  const handleConfirmLogout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await logoutUser();
      setActiveSheet(null);
      goToStartSelection();
    } catch (error) {
      console.log('[Settings] logout error', error);
      Alert.alert('로그아웃 중 문제가 발생했어요.', '다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await withdrawUser();
      setActiveSheet(null);
      goToStartSelection();
    } catch (error) {
      console.log('[Settings] withdraw error', error);
      Alert.alert('회원탈퇴 처리 중 문제가 발생했어요.', '다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToOfficerMode = () => {
    router.replace('/(officer)');
  };

  return (
    <View style={styles.flex}>
      <AppBar
        title="설정"
        logo={false}
        border={false}
        backgroundColor="#F4F5F8"
        onBack={() => router.back()}
        right={<Icon name="bell" size={26} color="#111111" strokeWidth={1.9} />}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <SettingCard>
          <SettingRow
            icon="bell"
            label="푸시 알림"
            sub="제보 상태 변경·주변 제보 소식"
            first
            right={
              isAlarmLoading ? (
                <ActivityIndicator size="small" color="#111111" />
              ) : (
                <Toggle
                  value={isAlarmEnabled}
                  onValueChange={handleToggleAlarm}
                  disabled={isAlarmSaving}
                />
              )
            }
          />
          <SettingRow icon="pin" label="지도" onPress={() => router.push('/(tabs)/map-settings')} />
        </SettingCard>

        <SettingCard>
          <SettingRow icon="headset" label="고객센터" first onPress={() => console.log('[Settings] support')} />
          <SettingRow
            icon="building"
            label="담당자 모드"
            sub="관할 제보 처리 화면으로 이동"
            onPress={handleSwitchToOfficerMode}
          />
        </SettingCard>

        <SettingCard>
          {isAuthenticated ? (
            <>
              <SettingRow icon="arrowL" label="로그아웃" danger first onPress={() => setActiveSheet('logout')} />
              <SettingRow icon="x" label="회원탈퇴" danger onPress={() => setActiveSheet('withdraw')} />
            </>
          ) : (
            <SettingRow icon="arrowL" label="로그인하기" first onPress={goToStartSelection} />
          )}
        </SettingCard>

        <AppText style={styles.versionText}>버전 정보 1.0.0</AppText>

      </ScrollView>

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
        description={'삭제된 데이터는 복구가 불가능합니다.\n등록된 민원 정보는 탈퇴 전에 확인해주세요.'}
        actionLabel="탈퇴하기"
        onClose={handleCloseSheet}
        onConfirm={handleConfirmWithdraw}
        isLoading={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F4F5F8' },
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 22,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 4,
    shadowColor: '#AAB2C0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
    overflow: 'hidden',
  },
  row: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 13,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#EDEDED',
  },
  rowPressed: {
    opacity: 0.72,
  },
  iconSlot: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextBox: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.lg,
    lineHeight: 23,
    color: '#111111',
  },
  dangerText: {
    color: '#EF5A5A',
  },
  rowSub: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: '#8A8A8A',
  },
  rowRight: {
    minWidth: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: '#8A8A8A',
  },
  versionText: {
    alignSelf: 'center',
    marginTop: -6,
    marginBottom: 6,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: '#9A9A9A',
  },
});
