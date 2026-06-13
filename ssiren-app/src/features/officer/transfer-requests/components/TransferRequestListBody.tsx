import { ActivityIndicator, ScrollView, View } from 'react-native';
import { AppText, Button } from '../../../../components/ui';
import { colors } from '../../../../theme';
import type {
  OfficerTransferActiveTab,
  OfficerTransferRequest,
} from '../types';
import { transferRequestStyles as styles } from '../styles';
import { TransferRequestCard } from './TransferRequestCard';
import { TransferRequestEmptyState } from './TransferRequestEmptyState';

type TransferRequestListBodyProps = {
  embedded?: boolean;
  activeTab: OfficerTransferActiveTab;
  isLoading: boolean;
  errorMessage: string | null;
  activeItems: OfficerTransferRequest[];
  tabBarOffset: number;
  bottomInset: number;
  onRetry: () => void;
  onApprove: (item: OfficerTransferRequest) => void;
  onReject: (item: OfficerTransferRequest) => void;
};

export function TransferRequestListBody({
  embedded = false,
  activeTab,
  isLoading,
  errorMessage,
  activeItems,
  tabBarOffset,
  bottomInset,
  onRetry,
  onApprove,
  onReject,
}: TransferRequestListBodyProps) {
  if (isLoading) {
    return (
      <View style={styles.listAreaCentered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.listAreaCentered}>
        <AppText style={styles.errorText}>{errorMessage}</AppText>
        <View style={styles.retryWrap}>
          <Button label="다시 시도" icon="refresh" onPress={onRetry} />
        </View>
      </View>
    );
  }

  if (activeItems.length === 0) {
    return (
      <View style={[styles.listArea, styles.listAreaEmpty]}>
        <TransferRequestEmptyState tab={activeTab} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.listArea}
      contentContainerStyle={[
        styles.listContent,
        activeTab === 'received' && styles.listContentReceived,
        { paddingBottom: embedded ? tabBarOffset + 16 : bottomInset + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {activeItems.map((item, index) => (
        <TransferRequestCard
          key={`${activeTab}-${item.id}`}
          item={item}
          direction={activeTab}
          showDivider={index > 0}
          onApprove={() => onApprove(item)}
          onReject={() => onReject(item)}
        />
      ))}
    </ScrollView>
  );
}
