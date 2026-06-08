import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { myPageMenuItems, myPageMock } from '../mocks/myPageMock';
import { fetchMyProfile } from '../api/userApi';

const STATUS_ITEMS = [
  { key: 'pending', label: '접수 대기', count: myPageMock.statusSummary.pending },
  { key: 'inProgress', label: '처리 중', count: myPageMock.statusSummary.inProgress },
  { key: 'completed', label: '처리 완료', count: myPageMock.statusSummary.completed },
] as const;

const QUICK_ACTIONS = [
  { id: 'my-reports', label: '내 민원함' },
  { id: 'results', label: '결과 조회' },
] as const;

export function MyPageScreen() {
  const router = useRouter();
  const [name, setName] = useState(myPageMock.name);
  const [email, setEmail] = useState(myPageMock.email);

  useEffect(() => {
    let isMounted = true;

    fetchMyProfile()
      .then((data) => {
        if (!isMounted) return;
        setName(data.nickname || name);
        setEmail(data.email || email);
      })
      .catch(() => {
        // 무시: 목데이터 유지
      });

    return () => {
      isMounted = false;
    };
    // 초기 진입 시 한 번만 조회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActionPress = (id: string) => {
    if (id === 'my-reports') {
      if (Platform.OS === 'web') {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
      router.push('/my-reports');
      return;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={42} color="#B1B1BC" />
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <Pressable
              style={styles.editButton}
              onPress={() => {}}
            >
              <Text style={styles.editButtonText}>수정</Text>
            </Pressable>
          </View>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statusRow}>
        {STATUS_ITEMS.map((item, index) => (
          <View key={item.key} style={styles.statusColumn}>
            {index > 0 ? <View style={styles.statusSeparator} /> : null}
            <Text style={styles.statusCount}>{item.count}건</Text>
            <Text style={styles.statusLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.quickActionRow}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            style={styles.quickActionButton}
            onPress={() => handleActionPress(action.id)}
          >
            <Text style={styles.quickActionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.menuSection}>
        {myPageMenuItems.map((item, index) => (
          <View key={item.id}>
            {index > 0 ? <View style={styles.menuDivider} /> : null}
            <Pressable
              style={styles.menuItem}
              onPress={() => {}}
            >
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9B9BA6" />
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#E3E4EB',
    backgroundColor: '#F9F9FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  name: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#17171F',
  },
  editButton: {
    minWidth: 52,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555568',
  },
  email: {
    fontSize: 15,
    color: '#6D6D78',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7EAF0',
    marginVertical: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statusColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  statusSeparator: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 1,
    backgroundColor: '#E7EAF0',
  },
  statusCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#17171F',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6D6D78',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  quickActionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#242433',
  },
  menuSection: {
    borderTopWidth: 1,
    borderTopColor: '#E7EAF0',
  },
  menuItem: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#17171F',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E7EAF0',
  },
});
