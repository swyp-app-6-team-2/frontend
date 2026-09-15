import { apiFetch, uploadToGcs } from './client';
import type {
  CookHistoryCreateRequest,
  CookHistoryItem,
  ImageContentType,
  IngestionJobCreateRequest,
  IngestionJobCreateResponse,
  IngestionJobResponse,
  IngredientListResponse,
  MeResponse,
  NotificationSetting,
  NotificationSettingRequest,
  PushPlatform,
  RecipeCreateRequest,
  RecipeCreateResponse,
  RecipeDetailResponse,
  RecipeListParams,
  RecipeListResponse,
  RecipeUpdateRequest,
  SignupRequest,
  SignupResponse,
  SocialLoginRequest,
  SocialLoginResponse,
  UploadPurpose,
  UploadUrlIssueResponse,
} from './types';

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  socialLogin: (body: SocialLoginRequest) =>
    apiFetch<SocialLoginResponse>('/auth/social-login', { method: 'POST', body, auth: false }),
  // 신규 사용자 가입 완료 — signupToken은 social-login이 반환한 값. accessToken 불필요.
  signup: (body: SignupRequest) =>
    apiFetch<SignupResponse>('/auth/signup', { method: 'POST', body, auth: false }),
};

// ── User / Profile ────────────────────────────────────────────
export const userApi = {
  // 백엔드 GET /users/me 미구현 → 현재 404. 생기면 마이페이지에 자동 반영.
  me: () => apiFetch<MeResponse>('/users/me'),
};

// ── Upload ────────────────────────────────────────────────────
export const uploadApi = {
  issueUrl: (purpose: UploadPurpose, contentType: ImageContentType) =>
    apiFetch<UploadUrlIssueResponse>('/uploads/images', {
      method: 'POST',
      body: { purpose, contentType },
    }),
};

/**
 * 이미지 업로드 전체 흐름(발급 → GCS PUT)을 한 번에. 연결에 쓸 objectKey를 반환한다.
 * 반환값을 Recipe의 coverImageKey / CookHistory의 photoKey로 넘기면 된다.
 */
export async function uploadImage(
  purpose: UploadPurpose,
  file: { uri: string; contentType: ImageContentType },
): Promise<string> {
  const issued = await uploadApi.issueUrl(purpose, file.contentType);
  await uploadToGcs(issued.uploadUrl, issued.uploadHeaders, file.uri);
  return issued.objectKey;
}

// ── Recipe ────────────────────────────────────────────────────
export const recipeApi = {
  list: (params: RecipeListParams = {}) =>
    apiFetch<RecipeListResponse>('/recipes', { query: params }),
  detail: (recipeId: number) => apiFetch<RecipeDetailResponse>(`/recipes/${recipeId}`),
  create: (body: RecipeCreateRequest) =>
    apiFetch<RecipeCreateResponse>('/recipes', { method: 'POST', body }),
  update: (recipeId: number, body: RecipeUpdateRequest) =>
    apiFetch<null>(`/recipes/${recipeId}`, { method: 'PATCH', body }),
  remove: (recipeId: number) => apiFetch<null>(`/recipes/${recipeId}`, { method: 'DELETE' }),
};

// ── Cooking (레시피 하위 중첩) ─────────────────────────────────
export const cookingApi = {
  list: (recipeId: number) => apiFetch<CookHistoryItem[]>(`/recipes/${recipeId}/cook-histories`),
  create: (recipeId: number, body: CookHistoryCreateRequest) =>
    apiFetch<null>(`/recipes/${recipeId}/cook-histories`, { method: 'POST', body }),
};

// ── Ingredient ────────────────────────────────────────────────
export const ingredientApi = {
  list: () => apiFetch<IngredientListResponse>('/ingredients'),
};

// ── Notification (설정 · 푸시 토큰 · 오픈 기록) ────────────────
export const notificationApi = {
  // 설정 조회 — 없으면 백엔드가 꺼진 기본값({enabled:false, weekdays:[], timeSlots:[]})을 준다.
  getSettings: () => apiFetch<NotificationSetting>('/notification-settings'),
  // 전체 교체 저장. 세 필드 모두 필수(켜져 있어도 배열은 빌 수 있음).
  saveSettings: (body: NotificationSettingRequest) =>
    apiFetch<null>('/notification-settings', { method: 'PUT', body }),
  // FCM 등록 토큰 등록/이관(upsert). platform은 IOS/ANDROID.
  registerPushToken: (token: string, platform: PushPlatform) =>
    apiFetch<null>('/push-tokens', { method: 'PUT', body: { token, platform } }),
  // 토큰 해제(비활성화). 남의 토큰·없는 토큰이어도 200.
  unregisterPushToken: (token: string) =>
    apiFetch<null>('/push-tokens', { method: 'DELETE', body: { token } }),
  // 알림 오픈 기록 — 푸시 data.notificationId(문자열)를 숫자로 바꿔 호출.
  markOpened: (notificationId: number) =>
    apiFetch<null>(`/notifications/${notificationId}/open`, { method: 'POST' }),
};

// ── Ingestion (레시피 분석) ────────────────────────────────────
export const ingestionApi = {
  // 분석 요청(202) → jobId 반환. 이후 get(id)로 상태를 폴링한다.
  create: (body: IngestionJobCreateRequest) =>
    apiFetch<IngestionJobCreateResponse>('/ingestion-jobs', { method: 'POST', body }),
  get: (ingestionJobId: number) =>
    apiFetch<IngestionJobResponse>(`/ingestion-jobs/${ingestionJobId}`),
};
