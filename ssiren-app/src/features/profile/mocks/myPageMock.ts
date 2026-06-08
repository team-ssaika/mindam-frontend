export type ReportStatusSummary = {
  pending: number;
  inProgress: number;
  completed: number;
};

export type MyPageProfile = {
  name: string;
  email: string;
  statusSummary: ReportStatusSummary;
};

export const myPageMock: MyPageProfile = {
  name: '홍길동',
  email: 'ssafy@kakao.com',
  statusSummary: {
    pending: 0,
    inProgress: 1,
    completed: 0,
  },
};

export const myPageMenuItems = [
  { id: 'guide', label: '이용 안내' },
  { id: 'support', label: '고객센터' },
  { id: 'account', label: '회원정보 관리' },
] as const;
