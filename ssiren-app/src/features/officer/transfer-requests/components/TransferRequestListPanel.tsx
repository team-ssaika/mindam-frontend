import { View } from 'react-native';
import type {
  OfficerTransferActiveTab,
  OfficerTransferRequest,
  OfficerTransferRequestStatus,
} from '../types';
import { TransferRequestFilterChips } from './TransferRequestFilterChips';
import { TransferRequestListBody } from './TransferRequestListBody';
import { TransferRequestSegmentTabs } from './TransferRequestSegmentTabs';
import { transferRequestStyles as styles } from '../styles';

type TransferRequestListPanelProps = {
  embedded?: boolean;
  activeTab: OfficerTransferActiveTab;
  sentStatus: OfficerTransferRequestStatus | null;
  isLoading: boolean;
  errorMessage: string | null;
  activeItems: OfficerTransferRequest[];
  tabBarOffset: number;
  bottomInset: number;
  onTabChange: (tab: OfficerTransferActiveTab) => void;
  onSentStatusChange: (status: OfficerTransferRequestStatus | null) => void;
  onRetry: () => void;
  onApprove: (item: OfficerTransferRequest) => void;
  onReject: (item: OfficerTransferRequest) => void;
};

export function TransferRequestListPanel({
  embedded = false,
  activeTab,
  sentStatus,
  isLoading,
  errorMessage,
  activeItems,
  tabBarOffset,
  bottomInset,
  onTabChange,
  onSentStatusChange,
  onRetry,
  onApprove,
  onReject,
}: TransferRequestListPanelProps) {
  return (
    <View style={[styles.listPanel, embedded && styles.listPanelEmbedded]}>
      <TransferRequestSegmentTabs
        activeTab={activeTab}
        showBottomBorder={activeTab !== 'sent'}
        onChange={onTabChange}
      />

      {activeTab === 'sent' ? (
        <TransferRequestFilterChips selectedStatus={sentStatus} onChange={onSentStatusChange} />
      ) : null}

      <TransferRequestListBody
        embedded={embedded}
        activeTab={activeTab}
        isLoading={isLoading}
        errorMessage={errorMessage}
        activeItems={activeItems}
        tabBarOffset={tabBarOffset}
        bottomInset={bottomInset}
        onRetry={onRetry}
        onApprove={onApprove}
        onReject={onReject}
      />
    </View>
  );
}
