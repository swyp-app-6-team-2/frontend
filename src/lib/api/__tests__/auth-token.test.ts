import * as SecureStore from 'expo-secure-store';

import {
  clearTokens,
  emitAuthExpired,
  getAccessToken,
  getLoginProvider,
  getRefreshToken,
  hydrateTokens,
  setLoginProvider,
  setOnAuthExpired,
  setTokens,
} from '@/lib/api/auth-token';

// SecureStore(네이티브)를 목킹해 write-through/hydrate 경로를 검증한다.
jest.mock('expo-secure-store', () => ({
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
}));

const ss = SecureStore as jest.Mocked<typeof SecureStore>;

beforeEach(() => {
  clearTokens();
  setOnAuthExpired(null);
  jest.clearAllMocks();
  (ss.getItem as jest.Mock).mockReturnValue(null);
});

describe('setTokens / 게터', () => {
  it('access·refresh를 인메모리에 저장하고 SecureStore에 write-through', () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1' });
    expect(getAccessToken()).toBe('a1');
    expect(getRefreshToken()).toBe('r1');
    expect(ss.setItem).toHaveBeenCalledWith('auth.accessToken', 'a1');
    expect(ss.setItem).toHaveBeenCalledWith('auth.refreshToken', 'r1');
  });

  it('refreshToken 미전달 시 기존 refresh를 유지한다', () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1' });
    setTokens({ accessToken: 'a2' }); // refreshToken 키 자체를 안 보냄
    expect(getAccessToken()).toBe('a2');
    expect(getRefreshToken()).toBe('r1');
  });

  it('refreshToken: null을 명시하면 제거된다', () => {
    setTokens({ accessToken: 'a1', refreshToken: 'r1' });
    setTokens({ accessToken: 'a2', refreshToken: null });
    expect(getRefreshToken()).toBeNull();
  });
});

describe('clearTokens', () => {
  it('전부 null로 지우고 SecureStore에서도 삭제한다', () => {
    setTokens({ accessToken: 'a', refreshToken: 'r' });
    setLoginProvider('GOOGLE');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getLoginProvider()).toBeNull();
    expect(ss.deleteItemAsync).toHaveBeenCalledWith('auth.accessToken');
    expect(ss.deleteItemAsync).toHaveBeenCalledWith('auth.refreshToken');
  });
});

describe('loginProvider', () => {
  it('저장·조회되고 SecureStore에 반영된다', () => {
    setLoginProvider('KAKAO');
    expect(getLoginProvider()).toBe('KAKAO');
    expect(ss.setItem).toHaveBeenCalledWith('auth.loginProvider', 'KAKAO');
  });
});

describe('hydrateTokens', () => {
  it('SecureStore 값을 인메모리로 복원한다(세션 복원)', () => {
    (ss.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'auth.accessToken') return 'stored-a';
      if (key === 'auth.refreshToken') return 'stored-r';
      if (key === 'auth.loginProvider') return 'NAVER';
      return null;
    });
    hydrateTokens();
    expect(getAccessToken()).toBe('stored-a');
    expect(getRefreshToken()).toBe('stored-r');
    expect(getLoginProvider()).toBe('NAVER');
  });

  it('저장된 게 없으면 전부 null', () => {
    hydrateTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

describe('emitAuthExpired', () => {
  it('재로그인 전까지 한 번만 발화하고, setTokens 후 다시 발화 가능', () => {
    const cb = jest.fn();
    setOnAuthExpired(cb);

    emitAuthExpired();
    emitAuthExpired();
    expect(cb).toHaveBeenCalledTimes(1); // 중복 발화 방지

    setTokens({ accessToken: 'a2' }); // 재로그인/재발급 성공 → 플래그 리셋
    emitAuthExpired();
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
