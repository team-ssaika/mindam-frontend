import { useRouter } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Card, ListRow } from '../../../components/ui';
import { colors, fonts } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import {
  deactivateStoredPushToken,
  registerDevicePushToken,
} from '../../notifications/services/pushNotificationService';
import { fetchMyProfile, updateMyProfile } from '../../profile/api/userApi';
import { ConfirmBottomSheet } from '../components/ConfirmBottomSheet';
import { logoutUser, withdrawUser } from '../services/settingsService';

type SheetType = 'logout' | 'withdraw' | null;

function SGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText style={styles.groupTitle}>{title}</AppText>
      <Card padded={false}>{children}</Card>
    </View>
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

  useEffect(() => {
    let isMounted = true;

    fetchMyProfile()
      .then((profile) => {
        if (!isMounted) return;
        setIsAlarmEnabled(Boolean(profile.isAlarmEnabled));
      })
      .catch((error: unknown) => {
        console.log('[Settings] profile load error', error);
      })
      .finally(() => {
        if (isMounted) setIsAlarmLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleAlarm = async (nextValue: boolean) => {
    if (isAlarmSaving) return;

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
    if (isSubmitting) return;
    setActiveSheet(null);
  };

  const handleConfirmLogout = async () => {
    if (isSubmitting) return;
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
    if (isSubmitting) return;
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
    <View style={styles.flex}>
      <AppBar title="설정" logo={false} border={false} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarOffset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <SGroup title="알림">
          <ListRow
            icon="bell"
            label="푸시 알림"
            sub="제보 상태 변경·주변 제보 소식"
            first
            toggle
            on={isAlarmEnabled}
            onToggle={handleToggleAlarm}
            right={
              isAlarmLoading ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : undefined
            }
          />
          <ListRow icon="pin" label="지도" onPress={() => console.log('[Settings] open map')} />
        </SGroup>

        <SGroup title="기타">
          <ListRow icon="info" label="버전 정보" value="1.32" first />
          <ListRow icon="headset" label="고객센터" onPress={() => console.log('[Settings] support')} />
        </SGroup>

        <SGroup title="계정">
          <ListRow icon="arrowL" label="로그아웃" danger first onPress={() => setActiveSheet('logout')} />
          <ListRow icon="x" label="회원탈퇴" danger onPress={() => setActiveSheet('withdraw')} />
        </SGroup>

        <View style={styles.footer}>
          <AppText style={styles.footerLinks}>이용약관 · 개인정보 처리방침</AppText>
          <AppText style={styles.footerVersion}>시민제보 v1.0.0</AppText>
        </View>
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
  flex: { flex: 1, backgroundColor: colors.soft },
  content: { paddingTop: 18, paddingHorizontal: 18, gap: 18 },
  group: { gap: 8 },
  groupTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted, marginLeft: 4 },
  footer: { alignItems: 'center', paddingTop: 6, gap: 8 },
  footerLinks: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.medium },
  footerVersion: { fontSize: 11.5, color: colors.faint },
});
