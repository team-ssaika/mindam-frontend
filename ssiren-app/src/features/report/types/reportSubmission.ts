import type { MyReportItem, ReportContents } from './myReport';
import type { ReportCategory } from './myReportDetail';

export type ReportImageFile = {
  uri: string;
  name?: string | null;
  type?: string | null;
};

export type ReportDraftRequest = {
  images: ReportImageFile[];
  content: string;
  latitude: number;
  longitude: number;
  occurredAt?: string;
};

export type ReportDraft = Omit<
  MyReportItem['report'],
  'id' | 'issueGroupId' | 'createdAt' | 'updatedAt'
> & {
  id: null;
  contents: ReportContents;
  embedding: number[];
  issueGroupId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ReportDepartment = {
  id: number;
  name: string;
  agencyTypeId: number;
};

export type ReportAgencyType = {
  id: number;
  name: string;
};

export type ReportAnalysis = {
  detectedObjects: string[];
  falseReport: {
    isSuspicious: boolean;
    score: number;
    reason: string;
  };
  emergencyGuide: {
    isEmergency: boolean;
    message: string | null;
  };
};

export type ReportDraftResponse = {
  reportDraft: ReportDraft;
  category: ReportCategory;
  parentCategory: ReportCategory | null;
  department: ReportDepartment;
  agencyType: ReportAgencyType;
  analysis: ReportAnalysis;
};

export type CreateReportRequest = {
  title: string;
  contents: ReportContents;
  latitude: number;
  longitude: number;
  roadAddress: string;
  jibunAddress: string;
  sido: string;
  sigungu: string;
  eupmyeondong: string;
  occurredAt: string;
  riskScore: number;
  visibility: string;
  categoryId: number;
  departmentId: number;
  issueGroupId: number | null;
  embedding: number[];
};

export type CreateReportPayload = {
  images: ReportImageFile[];
  request: CreateReportRequest;
};

export type ReportImageResponse = {
  id: number;
  imageUrl: string;
  sortOrder: number;
  reportId: number;
};

export type CreateReportResponse = {
  report: MyReportItem['report'];
  reportImages: ReportImageResponse[];
  category: ReportCategory;
  parentCategory: ReportCategory | null;
  issueGroup: MyReportItem['issueGroup'];
  department: ReportDepartment;
  agencyType: ReportAgencyType;
};
