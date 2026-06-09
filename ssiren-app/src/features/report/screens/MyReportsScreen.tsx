import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AppBar, AppText, Button, Icon } from '../../../components/ui';
import { colors } from '../../../theme';
import { getApiErrorMessage } from '../../../lib/api/errorMessage';
import { useRefetchOnFocus } from '../../../lib/api/useRefetchOnFocus';
import { useMyReports } from '../api/reportQueries';
import { MyReportListItem } from '../components/MyReportListItem';

export function MyReportsScreen() {
  const router = useRouter();
  const { data, isPending, isError, error, isRefetching, refetch } = useMyReports({
    page: 0,
    size: 20,
    sort: 'createdAt,desc',
  });

  const reports = data?.contents ?? [];
  const errorMessage =
    isError && !data ? getApiErrorMessage(error, '내 제보 목록을 불러오지 못했습니다.', { withBaseUrl: true }) : null;

  useRefetchOnFocus(refetch);

  return (
    <View style={styles.flex}>
      <AppBar title="내 민원함" logo={false} onBack={() => router.replace('/(tabs)/profile')} />

      {isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{errorMessage}</AppText>
          <View style={styles.retryWrap}>
            <Button label="다시 시도" icon="refresh" onPress={() => refetch()} />
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.brand} />
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
  separator: { height: 12 },
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
