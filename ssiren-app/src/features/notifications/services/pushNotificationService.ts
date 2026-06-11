import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { deactivateFcmToken, registerFcmToken } from '../api/notificationApi';

const FCM_TOKEN_STORAGE_KEY = 'ssiren.fcmToken';

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
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
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
