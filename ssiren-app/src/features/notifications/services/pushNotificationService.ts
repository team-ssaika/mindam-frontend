import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { fetchMyProfile, updateMyProfile } from '../../profile/api/userApi';
import { deactivateFcmToken, registerFcmToken } from '../api/notificationApi';

const FCM_TOKEN_STORAGE_KEY = 'ssiren.fcmToken';
const PENDING_NOTIFICATION_PROMPT_KEY = 'ssiren.pendingNotificationPrompt';

let isNotificationHandlerConfigured = false;

export function configureNotificationBehavior() {
  if (isNotificationHandlerConfigured || Platform.OS === 'web') {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  isNotificationHandlerConfigured = true;
}

async function getGrantedNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    console.log('[Notifications] permission already granted');
    return true;
  }

  if (current.ios?.status === Notifications.IosAuthorizationStatus.DENIED) {
    console.log('[Notifications] permission denied on iOS');
    return false;
  }

  if (!current.canAskAgain) {
    console.log('[Notifications] permission cannot be requested again');
    return false;
  }

  const requested = await Notifications.requestPermissionsAsync();
  console.log('[Notifications] permission request result', requested);
  return requested.granted;
}

export async function getStoredFcmToken() {
  return SecureStore.getItemAsync(FCM_TOKEN_STORAGE_KEY);
}

export async function registerDevicePushToken() {
  if (Platform.OS === 'web') {
    return null;
  }

  const isGranted = await getGrantedNotificationPermission();
  if (!isGranted) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const tokenResult = await Notifications.getDevicePushTokenAsync();
  const fcmToken = tokenResult.data;

  if (!fcmToken) {
    return null;
  }

  await registerFcmToken(fcmToken);
  await SecureStore.setItemAsync(FCM_TOKEN_STORAGE_KEY, fcmToken);

  return fcmToken;
}

export async function deactivateStoredPushToken() {
  const fcmToken = await getStoredFcmToken();
  if (!fcmToken) {
    return;
  }

  try {
    await deactivateFcmToken(fcmToken);
  } catch (error) {
    console.log('[Notifications] push token deactivation skipped', error);
  } finally {
    await SecureStore.deleteItemAsync(FCM_TOKEN_STORAGE_KEY);
  }
}

async function syncAlarmEnabledSetting(enabled: boolean) {
  const profile = await fetchMyProfile();
  if (Boolean(profile.isAlarmEnabled) === enabled) {
    return profile;
  }

  return updateMyProfile({ isAlarmEnabled: enabled });
}

export async function enablePushNotificationsWithProfile() {
  await syncAlarmEnabledSetting(true);

  try {
    const fcmToken = await registerDevicePushToken();
    return Boolean(fcmToken);
  } catch (error) {
    console.log('[Notifications] push token registration failed', error);
    return false;
  }
}

export async function disablePushNotificationsWithProfile() {
  const profile = await syncAlarmEnabledSetting(false);
  await SecureStore.deleteItemAsync(PENDING_NOTIFICATION_PROMPT_KEY).catch(() => undefined);

  try {
    await deactivateStoredPushToken();
  } catch (error) {
    console.log('[Notifications] push token deactivation error', error);
  }

  return profile;
}

export async function restorePushTokenIfEnabled() {
  try {
    const profile = await fetchMyProfile();
    if (!profile.isAlarmEnabled) {
      return;
    }

    await registerDevicePushToken();
  } catch (error) {
    console.log('[Notifications] push token restore skipped', error);
  }
}

export async function markPendingNotificationPrompt() {
  await SecureStore.setItemAsync(PENDING_NOTIFICATION_PROMPT_KEY, '1');
}

export async function peekPendingNotificationPrompt() {
  const value = await SecureStore.getItemAsync(PENDING_NOTIFICATION_PROMPT_KEY);
  return value === '1';
}

export async function clearPendingNotificationPrompt() {
  await SecureStore.deleteItemAsync(PENDING_NOTIFICATION_PROMPT_KEY).catch(() => undefined);
}

export async function applyPendingPushNotificationConsentIfNeeded() {
  const pending = await peekPendingNotificationPrompt();
  if (!pending) {
    return false;
  }

  const profile = await fetchMyProfile();
  if (!profile.roleSelected) {
    return false;
  }

  await clearPendingNotificationPrompt();
  await syncAlarmEnabledSetting(true);

  try {
    await registerDevicePushToken();
  } catch (error) {
    console.log('[Notifications] push token registration after terms consent failed', error);
  }

  return true;
}
