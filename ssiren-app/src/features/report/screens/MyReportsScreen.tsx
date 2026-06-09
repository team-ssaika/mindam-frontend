import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Button, Icon } from '../../../components/ui';
import { colors } from '../../../theme';
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

  const loadReports = useCallback(async (options?: { refresh?: boolean; silent?: boolean }) => {
    const isRefresh = options?.refresh ?? false;
    const silent = options?.silent ?? false;

    if (isRefresh && !silent) {
      setIsRefreshing(true);
    } else if (!silent) {
      setIsLoading(true);
    }
    if (!silent) {
      setErrorMessage(null);
    }

    try {
      const data = await fetchMyReports({ page: 0, size: 20, sort: 'createdAt,desc' });
      setReports(Array.isArray(data.contents) ? data.contents : []);
    } catch (error) {
      if (silent) {
        return;
      }

      let message = '내 제보 목록을 불러오지 못했습니다.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        message = typeof apiMessage === 'string' ? apiMessage : error.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      if (axios.isAxiosError(error) && !error.response) {
        message = `${message}\n\n요청 주소: ${resolveApiBaseUrl()}\nPC와 폰이 같은 Wi‑Fi인지 확인해주세요.`;
      }
      setErrorMessage(message);
      setReports([]);
    } finally {
      if (!silent) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const isFirstFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        loadReports();
        return;
      }

      loadReports({ refresh: true, silent: true });
    }, [loadReports])
  );

  return (
    <View style={styles.flex}>
      <AppBar title="내 민원함" logo={false} onBack={() => router.replace('/(tabs)/profile')} />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{errorMessage}</AppText>
          <View style={styles.retryWrap}>
            <Button label="다시 시도" icon="refresh" onPress={() => loadReports({ refresh: true })} />
          </View>
        </View>
      ) : (
        <FlatList
          style={styles.flex}
          data={reports}
          keyExtractor={(item) => String(item.report.id)}
          renderItem={({ item }) => (
            <MyReportListItem item={item} onPress={(reportId) => router.push(`/my-reports/${reportId}`)} />
          )}
          contentContainerStyle={[
            styles.listContent,
            reports.length === 0 ? styles.emptyListContent : null,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadReports({ refresh: true })}
              tintColor={colors.brand}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Icon name="doc" size={32} color={colors.faint} />
              </View>
              <AppText variant="heading" color={colors.ink}>등록한 민원이 없어요</AppText>
              <AppText style={styles.emptyDescription}>
                민원을 신고하면 이곳에서 처리 현황을 확인할 수 있어요.
              </AppText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  listContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  errorText: { fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' },
  retryWrap: { alignSelf: 'stretch', paddingHorizontal: 24 },
  emptyState: { alignItems: 'center', gap: 10, paddingHorizontal: 20 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.soft2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyDescription: { fontSize: 14.5, lineHeight: 22, color: colors.muted, textAlign: 'center' },
});
