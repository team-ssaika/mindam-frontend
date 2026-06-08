import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Settings() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>
      <Text style={styles.subtitle}>알림설정 / 지도설정 / 기타</Text>

      <Pressable style={styles.previewButton} onPress={() => router.push('/auth/login')}>
        <Text style={styles.previewButtonText}>로그인 화면 보기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#17171F',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#6D6D78',
  },
  previewButton: {
    marginTop: 28,
    minWidth: 180,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#6257FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
