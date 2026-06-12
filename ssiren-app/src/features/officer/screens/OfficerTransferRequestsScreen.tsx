import axios from 'axios';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, AppText, BottomSheet, Button, Card, Icon } from '../../../components/ui';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { colors, fontSize, fonts, layout, radius, statusColors } from '../../../theme';
import {
  fetchReceivedTransferRequests,
  fetchSentTransferRequests,
  respondTransferRequest,
} from '../api/officerTransferRequestApi';
import type {
  OfficerTransferDirection,
  OfficerTransferRequest,
  OfficerTransferResponseDecision,
  OfficerTransferRequestStatus,
} from '../types/officerTransferRequest';

type ActiveTab = 'received' | 'sent';

type ResponseSheetState = {
  request: OfficerTransferRequest;
  decision: OfficerTransferResponseDecision;
} | null;

const RESPONSE_LABELS: Record<OfficerTransferResponseDecision, string> = {
  ACCEPTED: '승인',
  REJECTED: '거절',
};

const SENT_STATUS_OPTIONS: { label: string; value: OfficerTransferRequestStatus | null }[] = [
  { label: '전체', value: null },
  { label: '대기', value: 'REQUESTED' },
  { label: '승인', value: 'ACCEPTED' },
  { label: '거절', value: 'REJECTED' },
  { label: '취소', value: 'CANCELED' },
];

function getStatusDisplay(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === 'REQUESTED') {
    return { label: '응답 대기', bg: '#FEF3C7', fg: '#92400E', dot: '#D97706' };
  }
  if (normalized === 'ACCEPTED') {
    return { ...statusColors.done, label: '승인됨' };
  }
  if (normalized === 'REJECTED') {
    return { label: '거절됨', bg: '#FEE2E2', fg: colors.danger, dot: colors.danger };
  }
  if (normalized === 'CANCELED') {
    return { label: '취소됨', bg: colors.hairline, fg: colors.muted, dot: colors.faint };
  }

  return { label: status, bg: colors.soft2, fg: colors.body, dot: colors.faint };
}

function isPending(status: string) {
  const normalized = status.toUpperCase();
  return normalized === 'REQUESTED';
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    const message = typeof apiMessage === 'string' ? apiMessage : error.message || fallback;
    if (!error.response) {
      return `${message}\n\n요청 주소: ${resolveApiBaseUrl()}`;
    }
    return message;
  }

  return error instanceof Error ? error.message : fallback;
}

export function OfficerTransferRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ActiveTab>('received');
  const [received, setReceived] = useState<OfficerTransferRequest[]>([]);
  const [sent, setSent] = useState<OfficerTransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [responseSheet, setResponseSheet] = useState<ResponseSheetState>(null);
  const [responseReason, setResponseReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentStatus, setSentStatus] = useState<OfficerTransferRequestStatus | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [receivedData, sentData] = await Promise.all([
        fetchReceivedTransferRequests(),
        fetchSentTransferRequests(sentStatus ? { status: sentStatus } : undefined),
      ]);
      setReceived(receivedData.transferRequests);
      setSent(sentData.transferRequests);
    } catch (error) {
      setReceived([]);
      setSent([]);
      setErrorMessage(getApiErrorMessage(error, '이관 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [sentStatus]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const activeItems = activeTab === 'received' ? received : sent;
  const pendingReceivedCount = useMemo(
    () => received.filter((item) => isPending(item.status)).length,
    [received]
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(officer)/profile');
  };

  const openResponseSheet = (
    request: OfficerTransferRequest,
    decision: OfficerTransferResponseDecision
  ) => {
    setResponseReason('');
    setResponseSheet({ request, decision });
  };

  const handleSubmitResponse = async () => {
    if (!responseSheet || isSubmitting) {
      return;
    }

    const trimmedReason = responseReason.trim();
    if (!trimmedReason) {
      Alert.alert('응답 사유 필요', '이관 요청에 대한 응답 사유를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await respondTransferRequest(responseSheet.request.id, {
        status: responseSheet.decision,
        responseReason: trimmedReason,
      });
      setResponseSheet(null);
      setResponseReason('');
      await loadRequests();
    } catch (error) {
      Alert.alert('응답 실패', getApiErrorMessage(error, '이관 요청 응답에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <AppBar
        title="제보 이관"
        logo={false}
        onBack={goBack}
        right={
          <Pressable onPress={loadRequests} disabled={isLoading} hitSlop={8}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : (
              <Icon name="refresh" size={22} color={colors.brand} strokeWidth={2.2} />
            )}
          </Pressable>
        }
      />

      <View style={styles.summary}>
        <View style={styles.summaryText}>
          <AppText style={styles.summaryTitle}>부서 간 제보 이관</AppText>
          <AppText style={styles.summarySub}>
            요청받은 이관을 검토하고 승인 또는 거절할 수 있어요.
          </AppText>
        </View>
        <View style={styles.pendingBadge}>
          <AppText style={styles.pendingCount}>{pendingReceivedCount}</AppText>
          <AppText style={styles.pendingLabel}>대기</AppText>
        </View>
      </View>

      <View style={styles.tabWrap}>
        <SegmentTab
          label={`요청 온 목록 ${received.length}`}
          active={activeTab === 'received'}
          onPress={() => setActiveTab('received')}
        />
        <SegmentTab
          label={`내 신청 목록 ${sent.length}`}
          active={activeTab === 'sent'}
          onPress={() => setActiveTab('sent')}
        />
      </View>

      {activeTab === 'sent' ? (
        <ScrollView
          horizontal
          style={styles.filterScroller}
          contentContainerStyle={styles.filterRow}
          showsHorizontalScrollIndicator={false}
        >
          {SENT_STATUS_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              onPress={() => setSentStatus(option.value)}
              style={[styles.filterChip, sentStatus === option.value && styles.filterChipActive]}
            >
              <AppText
                style={[
                  styles.filterChipText,
                  sentStatus === option.value && styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.filterPlaceholder} />
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{errorMessage}</AppText>
          <View style={styles.retryWrap}>
            <Button label="다시 시도" icon="refresh" onPress={loadRequests} />
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
            activeItems.length === 0 && styles.emptyContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {activeItems.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            activeItems.map((item) => (
              <TransferRequestCard
                key={`${activeTab}-${item.id}`}
                item={item}
                direction={activeTab}
                onApprove={() => openResponseSheet(item, 'ACCEPTED')}
                onReject={() => openResponseSheet(item, 'REJECTED')}
              />
            ))
          )}
        </ScrollView>
      )}

      <BottomSheet
        visible={responseSheet != null}
        onClose={() => {
          if (!isSubmitting) {
            setResponseSheet(null);
          }
        }}
        minHeight="42%"
      >
        {responseSheet ? (
          <View style={styles.sheetBody}>
            <View>
              <AppText style={styles.sheetEyebrow}>
                이관 요청 {RESPONSE_LABELS[responseSheet.decision]}
              </AppText>
              <AppText style={styles.sheetTitle} numberOfLines={2}>
                {responseSheet.request.issueTitle}
              </AppText>
            </View>
            <View>
              <AppText style={styles.inputLabel}>응답 사유</AppText>
              <TextInput
                value={responseReason}
                onChangeText={setResponseReason}
                placeholder="응답 사유를 입력하세요"
                placeholderTextColor={colors.faint}
                multiline
                maxLength={500}
                textAlignVertical="top"
                style={styles.reasonInput}
              />
              <AppText
                style={[
                  styles.reasonCounter,
                  responseReason.length >= 500 && styles.reasonCounterLimit,
                ]}
              >
                {responseReason.length}/500
              </AppText>
            </View>
            <View style={styles.sheetActions}>
              <View style={styles.sheetButton}>
                <Button
                  label="취소"
                  variant="secondary"
                  color={colors.muted}
                  onPress={() => setResponseSheet(null)}
                  disabled={isSubmitting}
                />
              </View>
              <View style={styles.sheetButton}>
                <Button
                  label={`${RESPONSE_LABELS[responseSheet.decision]}하기`}
                  bg={responseSheet.decision === 'REJECTED' ? colors.danger : colors.brand}
                  onPress={handleSubmitResponse}
                  loading={isSubmitting}
                  disabled={isSubmitting || responseReason.trim().length > 500}
                />
              </View>
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function SegmentTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segment, active && styles.segmentActive]}>
      <AppText style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </AppText>
    </Pressable>
  );
}

function EmptyState({ tab }: { tab: ActiveTab }) {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIcon}>
        <Icon name="layers" size={24} color={colors.faint} />
      </View>
      <AppText style={styles.emptyTitle}>
        {tab === 'received' ? '요청 온 이관이 없어요' : '신청한 이관이 없어요'}
      </AppText>
      <AppText style={styles.emptyText}>
        {tab === 'received'
          ? '다른 부서에서 이관을 요청하면 이곳에 표시됩니다.'
          : '내가 다른 부서로 이관을 신청한 내역이 표시됩니다.'}
      </AppText>
    </View>
  );
}

function TransferRequestCard({
  item,
  direction,
  onApprove,
  onReject,
}: {
  item: OfficerTransferRequest;
  direction: OfficerTransferDirection;
  onApprove: () => void;
  onReject: () => void;
}) {
  const status = getStatusDisplay(item.status);
  const canRespond = direction === 'received' && isPending(item.status);

  return (
    <Card bordered={false} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
          <AppText style={[styles.statusText, { color: status.fg }]}>{status.label}</AppText>
        </View>
        <AppText style={styles.dateText}>{formatDateTime(item.requestedAt)}</AppText>
      </View>

      <AppText style={styles.cardTitle} numberOfLines={2}>
        {item.issueTitle}
      </AppText>

      <View style={styles.departmentFlow}>
        <DepartmentPill label={item.fromDepartmentName} />
        <Icon name="chevR" size={16} color={colors.faint} />
        <DepartmentPill label={item.targetDepartmentName} active />
      </View>

      {item.requestReason ? (
        <View style={styles.reasonBox}>
          <AppText style={styles.reasonLabel}>요청 사유</AppText>
          <AppText style={styles.reasonText}>{item.requestReason}</AppText>
        </View>
      ) : null}

      {item.responseReason ? (
        <View style={styles.responseReasonBox}>
          <AppText style={styles.reasonLabel}>응답 사유</AppText>
          <AppText style={styles.reasonText}>{item.responseReason}</AppText>
        </View>
      ) : null}

      <View style={styles.metaRows}>
        <MetaRow label="신청자 ID" value={String(item.requestUserId)} />
        {item.responseUserId != null ? (
          <MetaRow label="응답자 ID" value={String(item.responseUserId)} />
        ) : null}
        {item.responseAt ? (
          <MetaRow label="응답일" value={formatDateTime(item.responseAt)} />
        ) : null}
        {item.transferredReportCount != null ? (
          <MetaRow label="이관 제보" value={`${item.transferredReportCount}건`} />
        ) : null}
      </View>

      {canRespond ? (
        <View style={styles.responseActions}>
          <View style={styles.actionButton}>
            <Button label="거절" variant="secondary" color={colors.danger} onPress={onReject} />
          </View>
          <View style={styles.actionButton}>
            <Button label="승인" icon="check" onPress={onApprove} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function DepartmentPill({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.departmentPill, active && styles.departmentPillActive]}>
      <Icon name="building" size={14} color={active ? colors.brand : colors.muted} />
      <AppText
        style={[styles.departmentText, active && styles.departmentTextActive]}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <AppText style={styles.metaLabel}>{label}</AppText>
      <AppText style={styles.metaValue} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  errorText: { fontSize: fontSize.mdLg, color: colors.muted, textAlign: 'center', lineHeight: 23 },
  retryWrap: { width: '100%', maxWidth: 220 },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  summaryText: { flex: 1, gap: 4 },
  summaryTitle: { fontFamily: fonts.bold, fontSize: fontSize['2xl'], color: colors.ink },
  summarySub: { fontSize: fontSize.md, lineHeight: 21, color: colors.muted },
  pendingBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCount: { fontFamily: fonts.bold, fontSize: fontSize['2xl'], color: colors.brand },
  pendingLabel: { fontFamily: fonts.semibold, fontSize: fontSize.micro, color: colors.brand },

  tabWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.soft,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  segmentActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  segmentText: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.muted },
  segmentTextActive: { color: colors.white },
  filterScroller: {
    flexGrow: 0,
    backgroundColor: colors.soft,
    marginTop: -4,
  },
  filterPlaceholder: {
    height: 47,
    backgroundColor: colors.soft,
    marginTop: -4,
  },
  filterRow: {
    gap: 7,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  filterChipText: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.muted },
  filterChipTextActive: { color: colors.white },

  content: { paddingHorizontal: 16, paddingTop: 2, gap: 10 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  emptyBox: { alignItems: 'center', paddingHorizontal: 20, gap: 8 },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: fontSize.mdLg, color: colors.ink },
  emptyText: { fontSize: fontSize.md, color: colors.muted, textAlign: 'center', lineHeight: 22 },

  card: { padding: 15, gap: 11 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: fonts.semibold, fontSize: fontSize.xs },
  dateText: { fontSize: fontSize.xs, color: colors.faint, flexShrink: 0 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: fontSize.base, color: colors.ink, lineHeight: 23 },
  departmentFlow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  departmentPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  departmentPillActive: { backgroundColor: colors.brandSoft, borderColor: colors.brandSoft },
  departmentText: { flex: 1, fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.muted },
  departmentTextActive: { color: colors.brand },
  reasonBox: {
    backgroundColor: colors.soft,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  responseReasonBox: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  reasonLabel: { fontFamily: fonts.semibold, fontSize: fontSize.xs, color: colors.muted },
  reasonText: { fontSize: fontSize.md, color: colors.body, lineHeight: 22 },
  metaRows: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  metaLabel: { fontSize: fontSize.sm, color: colors.muted },
  metaValue: { flex: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.body },
  responseActions: { flexDirection: 'row', gap: 10, paddingTop: 2 },
  actionButton: { flex: 1 },

  sheetBody: { gap: 18 },
  sheetEyebrow: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.brand },
  sheetTitle: { fontFamily: fonts.bold, fontSize: fontSize.xl, lineHeight: 26, color: colors.ink, marginTop: 4 },
  inputLabel: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.muted, marginBottom: 8 },
  reasonInput: {
    minHeight: 104,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.soft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  reasonCounter: {
    marginTop: 6,
    textAlign: 'right',
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.faint,
  },
  reasonCounterLimit: {
    color: colors.danger,
  },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetButton: { flex: 1 },
});
