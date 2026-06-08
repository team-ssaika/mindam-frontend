import type { PublicReportItem } from '../types/publicReport';
import type { ReportDetail } from '../types/reportDetail';
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
    title: report.title,
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
    summary: report.contents.summary ?? issueGroup.content,
    category: category.categoryName,
    empathyCount: issueGroup.yesCount,
    organization: issueGroup.title,
    status: getReportStatusLabel(report.status),
  };
}

export function hasValidReportCoordinate(item: PublicReportItem) {
  return (
    Number.isFinite(item.report.latitude) &&
    Number.isFinite(item.report.longitude)
  );
}
