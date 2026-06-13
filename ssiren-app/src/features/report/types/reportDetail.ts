import type { ReportStatusHistory } from './myReportDetail';
import type { ReportMarkerTone } from '../utils/publicReportMap';

export type ReportDetail = {
  id: string;
  issueGroupId?: number;
  title: string;
  riskLabel: string;
  markerTone?: ReportMarkerTone;
  timeAgo: string;
  distance: string;
  address: string;
  summary: string;
  category: string;
  yesCount: number;
  organization: string;
  status: string;
  statusHistories?: ReportStatusHistory[];
};
