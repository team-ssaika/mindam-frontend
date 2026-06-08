import type { MyReportItem, ReportContents, ReportStatus } from './myReport';

export type ReportCategory = MyReportItem['category'];

export type ReportStatusHistory = {
  id: number;
  previousStatus: ReportStatus | null;
  newStatus: ReportStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
  reportId: number;
  userId: number;
};

export type ReportReactionLog = {
  id: number;
  reactionType: 'YES' | 'NO' | 'UNKNOWN';
  createdAt: string;
  updatedAt: string;
  reportId: number;
  userId: number;
};

export type MyReportDetail = {
  report: MyReportItem['report'];
  reportImages: MyReportItem['reportImages'];
  category: ReportCategory;
  parentCategory: ReportCategory | null;
  issueGroup: MyReportItem['issueGroup'];
  department: MyReportItem['department'];
  agencyType: {
    id: number;
    name: string;
  };
  statusHistories: ReportStatusHistory[];
  reactionLogs: ReportReactionLog[];
};

export type ReportDetailContents = ReportContents;
