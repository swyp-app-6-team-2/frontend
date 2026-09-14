import {
  clearTokens,
  emitAuthExpired,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './auth-token';
import type { ApiResponse, ErrorData, TokenRefreshResponse } from './types';

// 배포 환경별 호스트는 EXPO_PUBLIC_API_BASE_URL로 주입. (예: https://api.example.com)
const HOST = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
const BASE = `${HOST}/api/v1`;

if (__DEV__ && !HOST) {
  console.warn('[api] EXPO_PUBLIC_API_BASE_URL 미설정 — API 요청이 실패합니다. .env에 설정하세요.');
}

// 개발 중 어느 백엔드(로컬/dev)에 붙었는지 한눈에. 서버 전환 시 헷갈림 방지.
if (__DEV__) {
  console.log(`[api] BASE = ${BASE}`);
}

/**
 * API 실패를 표준화한 에러. 화면은 HTTP status가 아니라 `code`로 분기한다.
 * - code: 도메인/공통 에러코드(예 "RECIPE_NOT_FOUND"). MVC/인증 표준 실패는 null.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
    readonly errors?: ErrorData['errors'],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | boolean | undefined | null;

function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Authorization 헤더 부착 여부. 기본 true (auth 엔드포인트만 false). */
  auth?: boolean;
  signal?: AbortSignal;
};

// 진행 중인 재발급 요청. 동시에 401이 여러 개 나도 한 번만 재발급하도록 공유(single-flight).
let refreshing: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  if (!refreshing) refreshing = doRefresh().finally(() => (refreshing = null));
  return refreshing;
}

/**
 * refreshToken으로 새 토큰을 받아 저장. apiFetch를 거치지 않고 raw fetch로 호출한다
 * (여기서 apiFetch를 쓰면 401 인터셉터가 다시 돌아 무한 재귀가 된다).
 */
async function doRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const text = await res.text();
    const data = text ? (JSON.parse(text) as ApiResponse<TokenRefreshResponse>).data : null;
    if (!data?.accessToken) return false;
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return true;
  } catch {
    return false;
  }
}

/**
 * 공통 요청기. envelope를 벗겨 `data`만 반환하고, 실패 시 ApiError를 던진다.
 * 성공이지만 data가 없는 응답(수정/삭제 등)은 null을 반환한다.
 * 인증 요청이 401이면 refreshToken으로 1회 재발급 후 원 요청을 재시도한다.
 */
export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, signal } = opts;
  const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;

  const send = () => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${BASE}${path}${buildQuery(query)}`, { method, headers, body: bodyStr, signal });
  };

  let res = await send();

  // 인증 요청이 401 → 재발급 시도. 성공하면 새 토큰으로 1회 재요청, 실패하면 세션 종료 통지.
  if (res.status === 401 && auth && getRefreshToken()) {
    if (await refreshTokens()) {
      res = await send();
    } else {
      clearTokens();
      emitAuthExpired();
    }
  }

  // envelope 파싱 (본문 없는 성공/실패도 안전하게)
  const text = await res.text();
  let envelope: ApiResponse<unknown> | null = null;
  if (text) {
    try {
      envelope = JSON.parse(text) as ApiResponse<unknown>;
    } catch {
      // JSON 아님 — 아래에서 처리
    }
  }

  if (!res.ok) {
    const data = envelope?.data;
    const isErrorData =
      data != null && typeof data === 'object' && 'code' in (data as Record<string, unknown>);
    const err = isErrorData ? (data as ErrorData) : undefined;
    throw new ApiError(
      res.status,
      err?.code ?? null,
      envelope?.message ?? `요청에 실패했습니다. (${res.status})`,
      err?.errors,
    );
  }

  return (envelope ? envelope.data : null) as T;
}

/**
 * 발급받은 서명 URL로 이미지 바이너리를 GCS에 직접 PUT.
 * uploadHeaders를 하나도 빠짐없이 그대로 실어야 한다(빠지면 GCS가 거부).
 */
export async function uploadToGcs(
  uploadUrl: string,
  uploadHeaders: Record<string, string>,
  fileUri: string,
): Promise<void> {
  const blob = await (await fetch(fileUri)).blob();
  const res = await fetch(uploadUrl, { method: 'PUT', headers: uploadHeaders, body: blob });
  if (!res.ok) {
    throw new ApiError(res.status, null, `이미지 업로드에 실패했습니다. (${res.status})`);
  }
}
