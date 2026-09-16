import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setOnAuthExpired,
  setTokens,
} from '@/lib/api/auth-token';
import { ApiError, apiFetch } from '@/lib/api/client';

// SecureStore(네이티브)는 목킹 — auth-token이 write-through에서 부르므로.
// (jest.mock은 babel이 import 위로 hoist하므로 여기 위치해도 적용된다.)
jest.mock('expo-secure-store', () => ({
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
}));

// jest.setup.js가 BASE를 http://test.local 로 고정.
const BASE = 'http://test.local/api/v1';

type Body = unknown;
function res(status: number, body: Body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
    clone() {
      return this;
    },
  };
}
const ok = (data: unknown) => res(200, { status: 200, message: 'ok', data });

beforeEach(() => {
  clearTokens();
  setOnAuthExpired(null);
  jest.clearAllMocks();
});

describe('apiFetch — envelope 언랩', () => {
  it('성공 시 envelope.data만 반환', async () => {
    global.fetch = jest.fn(async () => ok({ x: 1 })) as unknown as typeof fetch;
    await expect(apiFetch('/recipes')).resolves.toEqual({ x: 1 });
  });

  it('본문 없는 성공(수정/삭제)은 null 반환', async () => {
    global.fetch = jest.fn(async () => res(200, undefined)) as unknown as typeof fetch;
    await expect(apiFetch('/recipes/1', { method: 'DELETE' })).resolves.toBeNull();
  });
});

describe('apiFetch — 에러 매핑', () => {
  it('!ok면 ApiError(status·code·message)로 던진다', async () => {
    global.fetch = jest.fn(async () =>
      res(404, { status: 404, message: '없음', data: { code: 'RECIPE_NOT_FOUND' } }),
    ) as unknown as typeof fetch;

    await expect(apiFetch('/recipes/9')).rejects.toBeInstanceOf(ApiError);
    try {
      await apiFetch('/recipes/9');
    } catch (e) {
      const err = e as ApiError;
      expect(err.status).toBe(404);
      expect(err.code).toBe('RECIPE_NOT_FOUND');
      expect(err.message).toBe('없음');
    }
  });

  it('code 없는 표준 실패는 code=null', async () => {
    global.fetch = jest.fn(async () =>
      res(500, { status: 500, message: '서버 오류', data: null }),
    ) as unknown as typeof fetch;
    try {
      await apiFetch('/x');
    } catch (e) {
      expect((e as ApiError).code).toBeNull();
    }
  });
});

describe('apiFetch — 쿼리·헤더', () => {
  it('undefined/null 쿼리는 빼고 URL에 붙이며, 토큰이 있으면 Authorization 부착', async () => {
    setTokens({ accessToken: 'tok' });
    const fetchMock = jest.fn(async () => ok(null));
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiFetch('/recipes', { query: { sort: 'LATEST', page: 0, skip: undefined } });

    const [url, opts] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${BASE}/recipes?sort=LATEST&page=0`);
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });
});

describe('apiFetch — 401 토큰 재발급', () => {
  it('401 → refresh → 원요청 재시도(새 토큰 저장)', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'r1' });
    let dataCalls = 0;
    global.fetch = jest.fn(async (url: string) => {
      if (String(url).includes('/auth/token/refresh')) {
        return ok({ accessToken: 'new', refreshToken: 'r2' });
      }
      dataCalls += 1;
      return dataCalls === 1
        ? res(401, { status: 401, message: '', data: null })
        : ok({ done: true });
    }) as unknown as typeof fetch;

    await expect(apiFetch('/recipes')).resolves.toEqual({ done: true });
    expect(getAccessToken()).toBe('new');
    expect(getRefreshToken()).toBe('r2');
  });

  it('refresh도 실패하면 세션 종료 콜백 발화 + 토큰 clear', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'r1' });
    const onExpired = jest.fn();
    setOnAuthExpired(onExpired);
    global.fetch = jest.fn(async () =>
      res(401, { status: 401, message: '', data: null }),
    ) as unknown as typeof fetch;

    await expect(apiFetch('/recipes')).rejects.toBeInstanceOf(ApiError);
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('동시 401 여러 건이어도 refresh는 한 번만(single-flight)', async () => {
    setTokens({ accessToken: 'old', refreshToken: 'r1' });
    let refreshCalls = 0;
    let dataCalls = 0;
    global.fetch = jest.fn(async (url: string) => {
      if (String(url).includes('/auth/token/refresh')) {
        refreshCalls += 1;
        return ok({ accessToken: 'new', refreshToken: 'r2' });
      }
      dataCalls += 1;
      return dataCalls <= 2
        ? res(401, { status: 401, message: '', data: null })
        : ok({ done: true });
    }) as unknown as typeof fetch;

    const [a, b] = await Promise.all([apiFetch('/a'), apiFetch('/b')]);
    expect(a).toEqual({ done: true });
    expect(b).toEqual({ done: true });
    expect(refreshCalls).toBe(1);
  });

  it('refreshToken이 없으면 재발급을 시도하지 않고 401을 그대로 던진다', async () => {
    setTokens({ accessToken: 'old' }); // refreshToken 없음
    const fetchMock = jest.fn(async () => res(401, { status: 401, message: '', data: null }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiFetch('/recipes')).rejects.toBeInstanceOf(ApiError);
    // 단 1회 호출(재발급/재시도 없음)
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
