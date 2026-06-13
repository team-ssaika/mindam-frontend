import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  fetchReceivedTransferRequests,
  fetchSentTransferRequests,
  respondTransferRequest,
} from '../api';
import type {
  OfficerTransferActiveTab,
  OfficerTransferRequest,
  OfficerTransferRequestStatus,
  OfficerTransferResponseDecision,
  OfficerTransferResponseSheetState,
} from '../types';
import { getTransferApiErrorMessage, isTransferPending } from '../utils';

export function useOfficerTransferRequests() {
  const [activeTab, setActiveTab] = useState<OfficerTransferActiveTab>('received');
  const [received, setReceived] = useState<OfficerTransferRequest[]>([]);
  const [sent, setSent] = useState<OfficerTransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [responseSheet, setResponseSheet] = useState<OfficerTransferResponseSheetState>(null);
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
      setErrorMessage(getTransferApiErrorMessage(error, '이관 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [sentStatus]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const activeItems = activeTab === 'received' ? received : sent;
  const pendingReceivedCount = useMemo(
    () => received.filter((item) => isTransferPending(item.status)).length,
    [received]
  );

  const openResponseSheet = useCallback(
    (request: OfficerTransferRequest, decision: OfficerTransferResponseDecision) => {
      setResponseReason('');
      setResponseSheet({ request, decision });
    },
    []
  );

  const closeResponseSheet = useCallback(() => {
    if (!isSubmitting) {
      setResponseSheet(null);
    }
  }, [isSubmitting]);

  const handleSubmitResponse = useCallback(async () => {
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
      Alert.alert('응답 실패', getTransferApiErrorMessage(error, '이관 요청 응답에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, loadRequests, responseReason, responseSheet]);

  return {
    activeTab,
    setActiveTab,
    received,
    sent,
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
  };
}
