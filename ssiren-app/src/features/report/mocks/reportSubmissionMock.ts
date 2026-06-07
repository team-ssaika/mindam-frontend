export const reportSubmissionMock = {
  aiSummary:
    '둔산동 갤러리아 앞 인도 블록이 파손되어 보행자 낙상 위험이 있습니다.\n동일 위치에서 반복 제보되고 있어요.',
  title: '둔산동 갤러리아 앞 인도 파손 - 보행 안전 위험',
  category: '시설물 파손/보수',
  location: {
    address: '대전 서구 둔산동 1036',
    detail: '갤러리아타임월드 정문 앞 보도',
  },
  details: {
    occurredAt: '26.05.28 (수) 07:40 AM',
    issue: '파손된 인도 블록에 보행자가 걸려 넘어질 수 있음',
    risk: '우천 시 물 고임으로 낙상 위험이 높음',
  },
  detectedTags: ['#균열·파손 블록', '#침수 고임물', '#보행 위험', '#갤러리아 외벽'],
  completion: {
    reportId: '#2026-0528-004',
    organization: '대전광역시 서구청',
    department: '도로교통과 시설물관리팀',
    receiptNumber: 'SR-2026-003847',
    eta: '3 ~ 7일',
    assignmentReason:
      "AI가 사진과 내용을 분석해 '인도 파손·보수' 유형으로 분류하고, 관할 자치구 도로교통과로 자동 배정했어요.",
  },
} as const;
