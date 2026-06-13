import type { PublicReportItem } from '../types/publicReport';
import type { IssueDetail, IssueItem, IssueRepresentativeReportLike } from '../types/issue';
import type { ReportDetail } from '../types/reportDetail';
import type { MyReportItem } from '../types/myReport';
import type { ReportDepartment } from '../types/reportSubmission';
import { formatAiSummary } from './reportAiSummary';
import { getReportStatusLabel } from './reportStatus';

function formatTimeAgo(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60_000), 0);

  if (diffMinutes < 1) {
    return '방금 전';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}일 전`;
  }

  return date.toLocaleDateString('ko-KR');
}

function formatDistanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latDiff = toRadians(to.latitude - from.latitude);
  const lngDiff = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDiff / 2) ** 2;
  const distance = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }

  return `${(distance / 1000).toFixed(1)}km`;
}

export function toMapReportDetail(
  item: PublicReportItem,
  userLocation?: { latitude: number; longitude: number } | null
): ReportDetail {
  const { report, category, issueGroup } = item;

  return {
    id: String(report.id),
    title: report.title || issueGroup.title,
    riskLabel: `위험지수 ${report.riskScore}`,
    timeAgo: formatTimeAgo(report.createdAt),
    distance:
      userLocation != null
        ? formatDistanceMeters(userLocation, {
            latitude: report.latitude,
            longitude: report.longitude,
          })
        : '-',
    address: report.roadAddress || report.jibunAddress,
    summary: formatAiSummary(report.contents),
    category: category.categoryName,
    yesCount: issueGroup.yesCount ?? 0,
    organization: formatDepartmentName(item.department) || issueGroup.title,
    status: getReportStatusLabel(report.status),
    statusHistories: item.statusHistories,
  };
}

export function hasValidReportCoordinate(item: PublicReportItem) {
  return (
    Number.isFinite(item.report.latitude) &&
    Number.isFinite(item.report.longitude)
  );
}

function departmentFromReport(report: MyReportItem['report']) {
  return {
    id: report.departmentId,
    name: report.departmentName,
    agencyTypeId: report.agencyTypeId,
    agencyTypeName: report.agencyTypeName,
  };
}

function isRepresentativeBundle(
  representativeReport: IssueRepresentativeReportLike
): representativeReport is Extract<IssueRepresentativeReportLike, { report: MyReportItem['report'] }> {
  return 'report' in representativeReport;
}

function getRepresentativeReport(representativeReport: IssueRepresentativeReportLike) {
  return isRepresentativeBundle(representativeReport)
    ? representativeReport.report
    : representativeReport;
}

function getRepresentativeReportImages(representativeReport: IssueRepresentativeReportLike) {
  return isRepresentativeBundle(representativeReport)
    ? representativeReport.reportImages ?? []
    : [];
}

function getRepresentativeStatusHistories(representativeReport: IssueRepresentativeReportLike) {
  return isRepresentativeBundle(representativeReport)
    ? representativeReport.statusHistories ?? []
    : [];
}

function normalizeDepartment(
  department: ReportDepartment | ({ id: number; name: string; agencyType?: { id: number; name: string } } & Record<string, unknown>) | null | undefined,
  fallbackReport: MyReportItem['report']
): ReportDepartment {
  if (!department) {
    return departmentFromReport(fallbackReport);
  }

  if ('agencyTypeName' in department && 'agencyTypeId' in department) {
    return department as ReportDepartment;
  }

  return {
    id: department.id,
    name: department.name,
    agencyTypeId: department.agencyType?.id ?? fallbackReport.agencyTypeId,
    agencyTypeName: department.agencyType?.name ?? fallbackReport.agencyTypeName,
  };
}

function agencyTypeFromReport(report: MyReportItem['report']) {
  return {
    id: report.agencyTypeId,
    name: report.agencyTypeName,
  };
}

function formatDepartmentName(department: ReportDepartment | null | undefined) {
  if (!department) {
    return '';
  }

  return [department.agencyTypeName, department.name].filter(Boolean).join(' · ');
}

export function issueToPublicReportItem(item: IssueItem): PublicReportItem | null {
  const { issueGroup, representativeReport, category } = item;
  if (!representativeReport || !category) {
    return null;
  }
  const report = getRepresentativeReport(representativeReport);
  const department = normalizeDepartment(item.department, report);

  return {
    report: {
      ...report,
      latitude: issueGroup.groupLatitude,
      longitude: issueGroup.groupLongitude,
    },
    reportImages: getRepresentativeReportImages(representativeReport),
    category,
    issueGroup,
    department,
    agencyType: item.agencyType ?? agencyTypeFromReport(report),
    statusHistories: getRepresentativeStatusHistories(representativeReport),
  };
}

export function issueDetailToPublicReportItem(detail: IssueDetail): PublicReportItem | null {
  const { issueGroup, representativeReport, category } = detail;
  if (!representativeReport || !category) {
    return null;
  }
  const report = getRepresentativeReport(representativeReport);
  const department = normalizeDepartment(detail.department, report);

  return {
    report: {
      ...report,
      latitude: issueGroup.groupLatitude,
      longitude: issueGroup.groupLongitude,
    },
    reportImages: getRepresentativeReportImages(representativeReport),
    category,
    issueGroup,
    department,
    agencyType: detail.agencyType ?? agencyTypeFromReport(report),
    statusHistories: getRepresentativeStatusHistories(representativeReport),
  };
}

export function hasValidIssueCoordinate(item: IssueItem) {
  return (
    Number.isFinite(item.issueGroup.groupLatitude) &&
    Number.isFinite(item.issueGroup.groupLongitude)
  );
}
