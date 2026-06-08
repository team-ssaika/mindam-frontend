import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Image, Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
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
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="my-reports" />
    </Stack>
  );
}
