import { clearStoredAuthSession, logout } from '../../auth/services/authService';
import { deactivateStoredPushToken } from '../../notifications/services/pushNotificationService';
import { deactivateMyAccount } from '../../profile/api/userApi';

export async function logoutUser(): Promise<void> {
  await logout();
}

export async function withdrawUser(): Promise<void> {
  try {
    await deactivateStoredPushToken();
  } catch (error) {
    console.log('[Settings] push token deactivate skipped', error);
  }
  await deactivateMyAccount();
  await clearStoredAuthSession();
}
