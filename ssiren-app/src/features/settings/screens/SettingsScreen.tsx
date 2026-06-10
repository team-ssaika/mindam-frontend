import { useRouter, useSegments } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { AppBar, AppText, ListRow } from '../../../components/ui';
import { colors, fonts, layout } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import {
  deactivateStoredPushToken,
  registerDevicePushToken,
} from '../../notifications/services/pushNotificationService';
import { fetchMyProfile, updateMyProfile } from '../../profile/api/userApi';
import { ConfirmBottomSheet } from '../components/ConfirmBottomSheet';
import { logoutUser, withdrawUser } from '../services/settingsService';
import { hasStoredAuthSession } from '../../auth/services/authService';

type SheetType = 'logout' | 'withdraw' | null;

function SGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText style={styles.groupTitle}>{title}</AppText>
      <View style={styles.groupList}>{children}</View>
    </View>
  );
}

function isOfficerAccountRole(role: string | null | undefined) {
  return role === 'OFFICER' || role === 'ADMIN';
}

export function SettingsScreen() {
  const router = useRouter();
  const segments = useSegments();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const isOfficerMode = segments[0] === '(officer)';
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [isAlarmLoading, setIsAlarmLoading] = useState(true);
  const [isAlarmSaving, setIsAlarmSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    hasStoredAuthSession()
      .then((hasSession) => {
        if (!isMounted) return null;
        setIsAuthenticated(hasSession);

        if (!hasSession) {
          setIsAlarmLoading(false);
          return null;
        }

        return fetchMyProfile()
          .then((profile) => {
            if (!isMounted) return;
            setIsAlarmEnabled(Boolean(profile.isAlarmEnabled));
            setUserRole(profile.role);
          })
          .catch((error: unknown) => {
            console.log('[Settings] profile load error', error);
          })
          .finally(() => {
            if (isMounted) setIsAlarmLoading(false);
          });
      })
      .catch((error: unknown) => {
        console.log('[Settings] auth session check error', error);
        if (isMounted) setIsAlarmLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleAlarm = async (nextValue: boolean) => {
    if (isAlarmSaving) return;
    if (!isAuthenticated) {
      Alert.alert('로그인이 필요해요.', '푸시 알림을 받으려면 먼저 로그인해주세요.');
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

  const canSwitchToOfficerMode = isAuthenticated && isOfficerAccountRole(userRole);

  const handleSwitchToCitizenMode = () => {
    router.replace('/(tabs)');
  };

  const handleSwitchToOfficerMode = () => {
    router.replace('/(officer)');
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
            size="lg"
            toggle
            on={isAlarmEnabled}
            onToggle={handleToggleAlarm}
            right={
              isAlarmLoading ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : undefined
            }
          />
          <ListRow icon="pin" label="지도" size="lg" onPress={() => console.log('[Settings] open map')} />
        </SGroup>

        <SGroup title="기타">
          <ListRow icon="info" label="버전 정보" value="1.32" first size="lg" />
          <ListRow icon="headset" label="고객센터" size="lg" onPress={() => console.log('[Settings] support')} />
          {isOfficerMode ? (
            <ListRow
              icon="megaphone"
              label="민원인 모드"
              sub="시민 제보 화면으로 이동"
              size="lg"
              onPress={handleSwitchToCitizenMode}
            />
          ) : canSwitchToOfficerMode ? (
            <ListRow
              icon="building"
              label="담당자 모드"
              sub="관할 제보 처리 화면으로 이동"
              size="lg"
              onPress={handleSwitchToOfficerMode}
            />
          ) : null}
        </SGroup>

        <SGroup title="계정">
          {isAuthenticated ? (
            <>
              <ListRow icon="arrowL" label="로그아웃" danger first size="lg" onPress={() => setActiveSheet('logout')} />
              <ListRow icon="x" label="회원탈퇴" danger size="lg" onPress={() => setActiveSheet('withdraw')} />
            </>
          ) : (
            <ListRow icon="arrowL" label="로그인하기" first size="lg" onPress={() => router.replace('/auth/login')} />
          )}
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
  flex: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingTop: 8, gap: 28 },
  group: { gap: 8 },
  groupTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.muted,
    paddingHorizontal: layout.screenPadding,
  },
  groupList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  footer: { alignItems: 'center', paddingTop: 4, gap: 8 },
  footerLinks: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.medium },
  footerVersion: { fontSize: 11.5, color: colors.faint },
});
