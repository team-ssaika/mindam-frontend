import type { ReportDetail } from '../types/reportDetail';

export const reportDetailMock: ReportDetail = {
  id: 'report-mock-1',
  title: '유성구 궁동 도로 파손 의심',
  riskLabel: '위험지수 82',
  timeAgo: '10분 전',
  distance: '70m',
  address: '대전 유성구 궁동 어쩌구 길 10-1 (궁동)',
  summary: '도로 파손으로 차량 통행과 보행자 안전에 주의가 필요해요. 동일 위치에서 반복 제보되고 있어요.',
  category: '도로파손',
  empathyCount: 34,
  organization: '유성구청 도로관리팀',
  status: '접수 전',
};
