import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteMyReport,
  fetchMyReportDetail,
  fetchMyReports,
  fetchPublicReports,
  updateMyReport,
} from './reportApi';
import type { MyReportsQuery } from '../types/myReport';
import type { MyReportUpdateRequest } from '../types/myReportUpdate';
import type { PublicReportsQuery } from '../types/publicReport';

export const reportKeys = {
  all: ['reports'] as const,
  public: (params?: PublicReportsQuery) => ['reports', 'public', params ?? {}] as const,
  mine: (params?: MyReportsQuery) => ['reports', 'me', 'list', params ?? {}] as const,
  detail: (reportId: number) => ['reports', 'me', 'detail', reportId] as const,
};

export function usePublicReports(params?: PublicReportsQuery) {
  return useQuery({
    queryKey: reportKeys.public(params),
    queryFn: () => fetchPublicReports(params),
  });
}

export function useMyReports(params?: MyReportsQuery) {
  return useQuery({
    queryKey: reportKeys.mine(params),
    queryFn: () => fetchMyReports(params),
  });
}

export function useMyReportDetail(reportId: number) {
  return useQuery({
    queryKey: reportKeys.detail(reportId),
    queryFn: () => fetchMyReportDetail(reportId),
    enabled: Number.isFinite(reportId),
  });
}

export function useUpdateMyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: number; body: MyReportUpdateRequest }) =>
      updateMyReport(reportId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useDeleteMyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: number) => deleteMyReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}
