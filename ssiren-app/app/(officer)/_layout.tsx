import { Stack } from 'expo-router';

export default function OfficerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(main)" />
      <Stack.Screen name="transfer-requests" />
    </Stack>
  );
}
