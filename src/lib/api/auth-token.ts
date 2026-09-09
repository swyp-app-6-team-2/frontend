// 인증 토큰 저장소.
//
// 지금은 인메모리(JS 전용, 네이티브 리빌드 불필요). 앱을 껐다 켜면 사라지므로
// "로그인 유지"가 필요해지면 expo-secure-store로 교체한다(네이티브 모듈 → dev client 재빌드).
// 교체해도 이 모듈의 get/set 인터페이스만 유지하면 client.ts는 그대로 동작한다.

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

/** 로그인 성공 시 호출. accessToken은 필수, refreshToken은 있을 때만. */
export function setTokens(tokens: { accessToken: string; refreshToken?: string | null }): void {
  accessToken = tokens.accessToken;
  if (tokens.refreshToken !== undefined) refreshToken = tokens.refreshToken;
}

/** 로그아웃/탈퇴 시 호출. */
export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}
