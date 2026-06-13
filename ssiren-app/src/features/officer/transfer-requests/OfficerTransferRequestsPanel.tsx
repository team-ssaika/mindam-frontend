import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { AppBar, Icon } from '../../../components/ui';
import { colors } from '../../../theme';
import { TransferRequestListPanel } from './components/TransferRequestListPanel';
import { TransferRequestResponseSheet } from './components/TransferRequestResponseSheet';
import { TransferRequestSummaryCard } from './components/TransferRequestSummaryCard';
import { useOfficerTransferRequests } from './hooks/useOfficerTransferRequests';
import { transferRequestStyles as styles } from './styles';

type OfficerTransferRequestsPanelProps = {
  embedded?: boolean;
};

export function OfficerTransferRequestsPanel({ embedded = false }: OfficerTransferRequestsPanelProps) {
  const router = useRouter();
  const { insets, contentOffset: tabBarOffset } = useTabBarMetrics();
  const {
    activeTab,
    setActiveTab,
    isLoading,
    errorMessage,
    responseSheet,
    responseReason,
    setResponseReason,
    isSubmitting,
    sentStatus,
    setSentStatus,
    activeItems,
    pendingReceivedCount,
    loadRequests,
    openResponseSheet,
    closeResponseSheet,
    handleSubmitResponse,
  } = useOfficerTransferRequests();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(officer)/(main)/profile');
  };

  return (
    <View style={[styles.flex, embedded && styles.embeddedRoot]}>
      {!embedded ? (
        <AppBar
          title="제보 이관"
          logo={false}
          onBack={goBack}
          right={
            <Pressable onPress={loadRequests} disabled={isLoading} hitSlop={8}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.ink} />
              ) : (
                <Icon name="refresh" size={22} color={colors.brand} strokeWidth={2.2} />
              )}
            </Pressable>
          }
        />
      ) : null}

      {embedded ? (
        <>
          <TransferRequestSummaryCard
            embedded
            pendingCount={pendingReceivedCount}
            isLoading={isLoading}
            onRefresh={loadRequests}
          />
          <TransferRequestListPanel
            embedded
            activeTab={activeTab}
            sentStatus={sentStatus}
            isLoading={isLoading}
            errorMessage={errorMessage}
            activeItems={activeItems}
            tabBarOffset={tabBarOffset}
            bottomInset={insets.bottom}
            onTabChange={setActiveTab}
            onSentStatusChange={setSentStatus}
            onRetry={loadRequests}
            onApprove={(item) => openResponseSheet(item, 'ACCEPTED')}
            onReject={(item) => openResponseSheet(item, 'REJECTED')}
          />
        </>
      ) : (
        <>
          <TransferRequestSummaryCard
            pendingCount={pendingReceivedCount}
            isLoading={isLoading}
            onRefresh={loadRequests}
          />
          <TransferRequestListPanel
            activeTab={activeTab}
            sentStatus={sentStatus}
            isLoading={isLoading}
            errorMessage={errorMessage}
            activeItems={activeItems}
            tabBarOffset={tabBarOffset}
            bottomInset={insets.bottom}
            onTabChange={setActiveTab}
            onSentStatusChange={setSentStatus}
            onRetry={loadRequests}
            onApprove={(item) => openResponseSheet(item, 'ACCEPTED')}
            onReject={(item) => openResponseSheet(item, 'REJECTED')}
          />
        </>
      )}

      <TransferRequestResponseSheet
        sheet={responseSheet}
        responseReason={responseReason}
        isSubmitting={isSubmitting}
        onChangeReason={setResponseReason}
        onClose={closeResponseSheet}
        onSubmit={handleSubmitResponse}
      />
    </View>
  );
}
