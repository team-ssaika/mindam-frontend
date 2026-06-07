import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreenWeb() {
  return (
    <View style={styles.container}>
      <View style={styles.messageCard}>
        <Text style={styles.title}>웹에서는 기본 지도를 표시하지 않습니다.</Text>
        <Text style={styles.description}>
          모바일(Expo Go / Android / iOS)에서 구글맵이 표시됩니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  messageCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
