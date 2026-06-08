import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { fetchMyReports } from '../api/reportApi';
import { MyReportListItem } from '../components/MyReportListItem';
import type { MyReportItem } from '../types/myReport';

export function MyReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<MyReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await fetchMyReports({ page: 0, size: 20, sort: 'createdAt,desc' });
      setReports(Array.isArray(data.contents) ? data.contents : []);
    } catch (error) {
      let message = '내 제보 목록을 불러오지 못했습니다.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        message =
          typeof apiMessage === 'string'
            ? apiMessage
            : error.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      if (axios.isAxiosError(error) && !error.response) {
        message = `${message}\n\n요청 주소: ${resolveApiBaseUrl()}\nPC와 폰이 같은 Wi‑Fi인지 확인해주세요.`;
      }
      setErrorMessage(message);
      setReports([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E1E25" />
        </Pressable>
        <Text style={styles.headerTitle}>내 민원함</Text>
        <View style={styles.headerButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6257FF" />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadReports()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={reports}
          keyExtractor={(item) => String(item.report.id)}
          renderItem={({ item }) => <MyReportListItem item={item} />}
          contentContainerStyle={[
            styles.listContent,
            reports.length === 0 ? styles.emptyListContent : null,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadReports(true)}
              tintColor="#6257FF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color="#B1B1BC" />
              <Text style={styles.emptyTitle}>등록한 민원이 없어요</Text>
              <Text style={styles.emptyDescription}>
                민원을 신고하면 이곳에서 처리 현황을 확인할 수 있어요.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111119',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6D6D78',
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#6257FF',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17171F',
  },
  emptyDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6D6D78',
    textAlign: 'center',
  },
});
