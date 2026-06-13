export type ChatbotSession = {
  id: number;
  title: string;
  createdAt: string;
};

export type ChatbotSenderType = 'USER' | 'BOT';

export type ChatbotMessage = {
  id: number;
  senderType: ChatbotSenderType;
  message: string;
  createdAt: string;
};

export type ChatbotSessionsQuery = {
  page?: number;
  size?: number;
};

export type ChatbotMessagesQuery = {
  cursor?: number;
  size?: number;
};

export type ChatbotMessagesResponse = {
  content: ChatbotMessage[];
  nextCursor: number | null;
  hasNext: boolean;
};

export type SendChatbotMessageRequest = {
  message: string;
  latitude: number;
  longitude: number;
};

export type SendChatbotMessageResponse = {
  answer: string;
  usedReportIds: number[] | null;
  session?: ChatbotSession;
  messages?: ChatbotMessage[];
};

export type UpdateChatbotSessionTitleRequest = {
  title: string;
};

export type UpdateChatbotSessionTitleResponse = {
  title: string;
};
