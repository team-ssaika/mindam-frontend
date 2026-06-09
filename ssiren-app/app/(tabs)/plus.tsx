import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { ReportCreateFlowScreen } from '../../src/features/report/screens/ReportCreateFlowScreen';
import { hasStoredAuthSession } from '../../src/features/auth/services/authService';

export default function Plus() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    hasStoredAuthSession()
      .then((hasSession) => {
        if (!isMounted) return;

        setIsAuthenticated(hasSession);

        if (!hasSession) {
          Alert.alert('로그인이 필요해요.', '제보하려면 먼저 로그인해주세요.', [
            { text: '확인', onPress: () => router.replace('/auth/login') },
          ]);
        }
      })
      .catch((error: unknown) => {
        console.log('[ReportFlow] auth session check error', error);
        if (!isMounted) return;

        Alert.alert('로그인이 필요해요.', '다시 로그인한 뒤 제보해주세요.', [
          { text: '확인', onPress: () => router.replace('/auth/login') },
        ]);
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isCheckingSession || !isAuthenticated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <ReportCreateFlowScreen />;
}
