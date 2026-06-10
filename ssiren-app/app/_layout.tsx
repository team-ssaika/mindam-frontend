import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Image, Platform } from 'react-native';
import { restoreAuthSession } from '../src/features/auth/services/authService';
import { configureNotificationBehavior } from '../src/features/notifications/services/pushNotificationService';
import { fontAssets } from '../src/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);

  useEffect(() => {
    configureNotificationBehavior();

    if (Platform.OS === 'web' || typeof Image.resolveAssetSource !== 'function') {
      return;
    }

    const loginLogoUri = Image.resolveAssetSource(
      require('../src/assets/ssiren-login.png')
    ).uri;
    const fullLogoUri = Image.resolveAssetSource(
      require('../src/assets/ssiren.png')
    ).uri;

    Promise.all([Image.prefetch(loginLogoUri), Image.prefetch(fullLogoUri)]).catch(
      (error: unknown) => {
        console.log('[App] logo preload skipped', error);
      }
    );

    restoreAuthSession().catch((error: unknown) => {
      console.log('[App] auth session restore skipped', error);
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(officer)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="my-reports" />
      <Stack.Screen name="officer-report" />
    </Stack>
  );
}
