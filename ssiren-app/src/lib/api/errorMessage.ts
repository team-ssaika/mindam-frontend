import axios from 'axios';
import { resolveApiBaseUrl } from './client';

/**
 * Normalize an API/network error into a user-facing Korean message.
 * Pass `withBaseUrl` to append the request host hint on network failures.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  options?: { withBaseUrl?: boolean }
): string {
  let message = fallback;

  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    message = typeof apiMessage === 'string' ? apiMessage : error.message || fallback;
    if (!error.response && options?.withBaseUrl) {
      message = `${message}\n\n요청 주소: ${resolveApiBaseUrl()}\nPC와 폰이 같은 Wi‑Fi인지 확인해주세요.`;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return message;
}
