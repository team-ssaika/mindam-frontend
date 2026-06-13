import axios from 'axios';
import { apiClient, resolveApiBaseUrl } from '../../../lib/api/client';
import type { ApiResponse, PageResponse } from '../../../lib/api/types';
import type {
  ChatbotMessagesQuery,
  ChatbotMessagesResponse,
  ChatbotSession,
  ChatbotSessionsQuery,
  SendChatbotMessageRequest,
  SendChatbotMessageResponse,
  UpdateChatbotSessionTitleRequest,
  UpdateChatbotSessionTitleResponse,
} from '../types/chatbot';

const CHATBOT_MESSAGE_TIMEOUT_MS = 60000;

function logRequest(name: string, detail?: Record<string, unknown>) {
  console.log(`[Chatbot API] ${name} request`, detail ?? {});
}

function logSuccess(name: string, response: { status: number; message: string; data: unknown }) {
  console.log(`[Chatbot API] ${name} success`, {
    status: response.status,
    message: response.message,
    data: response.data,
  });
}

function logFailure(name: string, error: unknown) {
  if (axios.isAxiosError(error)) {
    console.error(`[Chatbot API] ${name} failed`, {
      status: error.response?.status,
      message: error.response?.data?.message ?? error.message,
      code: error.code,
      data: error.response?.data,
      baseURL: error.config?.baseURL ?? resolveApiBaseUrl(),
      url: error.config?.url,
      method: error.config?.method,
      timeout: error.config?.timeout,
    });
    return;
  }

  console.error(`[Chatbot API] ${name} failed`, error);
}

export async function createChatbotSession() {
  const name = 'create session';
  logRequest(name, { path: '/api/v1/chatbots/sessions', method: 'POST' });

  try {
    const response = await apiClient.post<ApiResponse<ChatbotSession>>(
      '/api/v1/chatbots/sessions',
      {}
    );

    logSuccess(name, response.data);
    return response.data.data;
  } catch (error) {
    logFailure(name, error);
    throw error;
  }
}

export async function fetchChatbotSessions(params?: ChatbotSessionsQuery) {
  const name = 'fetch sessions';
  logRequest(name, { path: '/api/v1/chatbots/sessions', method: 'GET', params });

  try {
    const response = await apiClient.get<ApiResponse<PageResponse<ChatbotSession>>>(
      '/api/v1/chatbots/sessions',
      { params }
    );

    logSuccess(name, {
      ...response.data,
      data: {
        page: response.data.data.page,
        count: response.data.data.contents.length,
      },
    });
    return response.data.data;
  } catch (error) {
    logFailure(name, error);
    throw error;
  }
}

export async function fetchChatbotMessages(
  sessionId: number,
  params?: ChatbotMessagesQuery
) {
  const name = 'fetch messages';
  logRequest(name, {
    path: `/api/v1/chatbots/sessions/${sessionId}`,
    method: 'GET',
    sessionId,
    params,
  });

  try {
    const response = await apiClient.get<ApiResponse<ChatbotMessagesResponse>>(
      `/api/v1/chatbots/sessions/${sessionId}`,
      { params }
    );

    logSuccess(name, {
      ...response.data,
      data: {
        sessionId,
        count: response.data.data.content.length,
        nextCursor: response.data.data.nextCursor,
        hasNext: response.data.data.hasNext,
      },
    });
    return response.data.data;
  } catch (error) {
    logFailure(name, error);
    throw error;
  }
}

export async function sendChatbotMessage(
  sessionId: number,
  body: SendChatbotMessageRequest
) {
  const name = 'send message';
  logRequest(name, {
    path: `/api/v1/chatbots/sessions/${sessionId}`,
    method: 'POST',
    sessionId,
    messageLength: body.message.length,
    latitude: body.latitude,
    longitude: body.longitude,
  });

  try {
    const response = await apiClient.post<ApiResponse<SendChatbotMessageResponse>>(
      `/api/v1/chatbots/sessions/${sessionId}`,
      body,
      { timeout: CHATBOT_MESSAGE_TIMEOUT_MS }
    );

    logSuccess(name, {
      ...response.data,
      data: {
        answerLength: response.data.data.answer?.length ?? 0,
        usedReportIds: response.data.data.usedReportIds ?? null,
        sessionId: response.data.data.session?.id ?? sessionId,
        messageCount: response.data.data.messages?.length ?? undefined,
        senderTypes: response.data.data.messages?.map((message) => message.senderType),
      },
    });
    return response.data.data;
  } catch (error) {
    logFailure(name, error);
    throw error;
  }
}

export async function deleteChatbotSession(sessionId: number) {
  const name = 'delete session';
  logRequest(name, {
    path: `/api/v1/chatbots/sessions/${sessionId}`,
    method: 'DELETE',
    sessionId,
  });

  try {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/api/v1/chatbots/sessions/${sessionId}`
    );

    logSuccess(name, { ...response.data, data: { sessionId } });
  } catch (error) {
    logFailure(name, error);
    throw error;
  }
}

export async function updateChatbotSessionTitle(
  sessionId: number,
  body: UpdateChatbotSessionTitleRequest
) {
  const name = 'update title';
  logRequest(name, {
    path: `/api/v1/chatbots/sessions/${sessionId}`,
    method: 'PATCH',
    sessionId,
    title: body.title,
  });

  try {
    const response = await apiClient.patch<ApiResponse<UpdateChatbotSessionTitleResponse>>(
      `/api/v1/chatbots/sessions/${sessionId}`,
      body
    );

    logSuccess(name, response.data);
    return response.data.data;
  } catch (error) {
    logFailure(name, error);
    throw error;
  }
}
