import { View } from 'react-native';
import { AppText, Icon } from '../../../../components/ui';
import { colors } from '../../../../theme';
import type { OfficerTransferActiveTab } from '../types';
import { transferRequestStyles as styles } from '../styles';

const EMPTY_COPY: Record<
  OfficerTransferActiveTab,
  { title: string; description: string }
> = {
  received: {
    title: '요청 온 이관이 없어요',
    description: '다른 부서에서 이관을 요청하면\n이곳에 표시됩니다.',
  },
  sent: {
    title: '신청한 이관이 없어요',
    description: '다른 부서로 이관을 신청하면\n이곳에 표시됩니다.',
  },
};

type TransferRequestEmptyStateProps = {
  tab: OfficerTransferActiveTab;
};

export function TransferRequestEmptyState({ tab }: TransferRequestEmptyStateProps) {
  const copy = EMPTY_COPY[tab];

  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <Icon name="layers" size={22} color={colors.faint} />
      </View>
      <AppText style={styles.emptyTitle}>{copy.title}</AppText>
      <AppText style={styles.emptyText}>{copy.description}</AppText>
    </View>
  );
}
