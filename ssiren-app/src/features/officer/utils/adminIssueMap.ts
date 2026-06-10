import type { Region } from 'react-native-maps';
import type { PublicReportItem } from '../../report/types/publicReport';
import type { AdminIssueItem } from '../types/adminIssue';

type LatLng = { latitude: number; longitude: number };

function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function buildAdminIssueQuery(region: Region, userLocation: LatLng | null) {
  if (userLocation && distanceMeters(userLocation, region) < 100) {
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radiusMeters: 5000,
    };
  }

  return {
    swLat: region.latitude - region.latitudeDelta / 2,
    swLng: region.longitude - region.longitudeDelta / 2,
    neLat: region.latitude + region.latitudeDelta / 2,
    neLng: region.longitude + region.longitudeDelta / 2,
  };
}

export function hasValidAdminIssueCoordinate(item: AdminIssueItem) {
  return (
    Number.isFinite(item.issueGroup.groupLatitude) &&
    Number.isFinite(item.issueGroup.groupLongitude)
  );
}

export function adminIssueToPublicReportItem(item: AdminIssueItem): PublicReportItem | null {
  const { issueGroup, representativeReport, category } = item;
  const report = representativeReport?.report;
  if (!report || !category) {
    return null;
  }

  return {
    report: {
      ...report,
      latitude: issueGroup.groupLatitude,
      longitude: issueGroup.groupLongitude,
    },
    reportImages: representativeReport.reportImages ?? [],
    category: {
      id: category.id,
      categoryCode: category.categoryCode,
      categoryName: category.categoryName,
      createdAt: '',
      updatedAt: '',
      parentCategoryId: category.parentCategory?.id ?? null,
    },
    issueGroup,
  };
}
