// Mock data for the officer (담당자) app, mirroring the ssaika-design `official.jsx`.
import type { IconName } from '../../../components/ui';
import type { StatusKey } from '../../../theme';

export type OfficerReport = {
  id: string;
  title: string;
  location: string;
  type: string;
  cat: IconName;
  catColor: 'coral' | 'mustard' | 'brand' | 'mint';
  status: StatusKey;
  occurredAt: string;
};

export const officerProfile = {
  name: '박담당 주무관',
  department: '강남구청 · 도로관리과',
  jurisdiction: '강남구 · 도로관리과 관할',
};

export const officerSummary = {
  total: 64,
  wait: 38,
  prog: 18,
  done: 8,
};

export const dashboardFunnel: { label: string; count: number; tone: StatusKey | 'all' }[] = [
  { label: '전체', count: 142, tone: 'all' },
  { label: '대기중', count: 38, tone: 'wait' },
  { label: '처리중', count: 64, tone: 'prog' },
  { label: '완료', count: 40, tone: 'done' },
];

export const dashboardTypes: { label: string; count: number; color: 'coral' | 'mustard' | 'brand' | 'mint' | 'faint' }[] = [
  { label: '도로·시설', count: 48, color: 'coral' },
  { label: '환경·청소', count: 32, color: 'mustard' },
  { label: '안전·조명', count: 28, color: 'brand' },
  { label: '교통', count: 19, color: 'mint' },
  { label: '기타', count: 15, color: 'faint' },
];

export const officerStats: { label: string; count: number; tone: StatusKey }[] = [
  { label: '처리 대기', count: 38, tone: 'wait' },
  { label: '처리중', count: 18, tone: 'prog' },
  { label: '완료', count: 86, tone: 'done' },
];

export const officerReports: OfficerReport[] = [
  {
    id: '#2024-0931',
    title: '역삼로 보도블록 파손으로 통행 위험',
    location: '역삼로 124 앞',
    type: '도로·시설',
    cat: 'alert',
    catColor: 'coral',
    status: 'wait',
    occurredAt: '2024.6.9 오후 2:14',
  },
  {
    id: '#2024-0930',
    title: '공원 입구 가로등 점등 불량 3개소',
    location: '역삼근린공원',
    type: '안전·조명',
    cat: 'doc',
    catColor: 'mustard',
    status: 'prog',
    occurredAt: '2024.6.9 오전 9:02',
  },
  {
    id: '#2024-0929',
    title: '버스정류장 무단투기 쓰레기 적치',
    location: '테헤란로 정류장',
    type: '환경·청소',
    cat: 'tag',
    catColor: 'brand',
    status: 'prog',
    occurredAt: '2024.6.8 오후 6:40',
  },
  {
    id: '#2024-0927',
    title: '횡단보도 도색 마모 재도색 요청',
    location: '강남대로 사거리',
    type: '교통',
    cat: 'pin',
    catColor: 'brand',
    status: 'done',
    occurredAt: '2024.6.8 오전 11:20',
  },
  {
    id: '#2024-0926',
    title: '맨홀 뚜껑 파손 보행 위험',
    location: '논현로 일대',
    type: '도로·시설',
    cat: 'alert',
    catColor: 'coral',
    status: 'wait',
    occurredAt: '2024.6.7 오후 3:05',
  },
  {
    id: '#2024-0925',
    title: '공원 벤치 파손 교체 요청',
    location: '도산공원',
    type: '환경·청소',
    cat: 'pin',
    catColor: 'mint',
    status: 'done',
    occurredAt: '2024.6.7 오전 10:10',
  },
];
