import { apiFetch, uploadToGcs } from './client';
import type {
  AddMyIngredientsRequest,
  AddMyIngredientsResponse,
  AdRewardSessionCancelRequest,
  AdRewardSessionCreateRequest,
  AdRewardSessionResponse,
  AdRewardSessionResultResponse,
  AdRewardStatusResponse,
  CookHistoryCreateRequest,
  CookHistoryItem,
  CustomIngredientCreateRequest,
  ImageContentType,
  IngestionJobCreateRequest,
  IngestionJobCreateResponse,
  IngestionJobResponse,
  IngredientListResponse,
  InquiryCreateRequest,
  InquiryCreateResponse,
  InquiryDetailResponse,
  InquiryListParams,
  InquiryListResponse,
  MeResponse,
  MyIngredientListResponse,
  NotificationSettings,
  OnboardingResponse,
  ProfileResponse,
  ProfileUpdateRequest,
  PushTokenRegisterRequest,
  PushTokenUnregisterRequest,
  RecipeCreateRequest,
  RecipeCreateResponse,
  RecipeDetailResponse,
  RecipeListParams,
  RecipeListResponse,
  RecipeRecommendationRequest,
  RecipeRecommendationResponse,
  RecipeUpdateRequest,
  SignupRequest,
  SignupResponse,
  SocialLoginRequest,
  SocialLoginResponse,
  UploadPurpose,
  UploadUrlIssueResponse,
  UserIngredient,
} from './types';

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  socialLogin: (body: SocialLoginRequest) =>
    apiFetch<SocialLoginResponse>('/auth/social-login', { method: 'POST', body, auth: false }),
  // 신규 사용자 가입 완료 — signupToken은 social-login이 반환한 값. accessToken 불필요.
  signup: (body: SignupRequest) =>
    apiFetch<SignupResponse>('/auth/signup', { method: 'POST', body, auth: false }),
  // 로그아웃 — 서버 세션/토큰 무효화(인증 필요). 이후 프론트에서 clearTokens 호출.
  logout: () => apiFetch<null>('/auth/logout', { method: 'POST' }),
};

// ── User / Profile ────────────────────────────────────────────
export const userApi = {
  me: () => apiFetch<MeResponse>('/users/me'),
  // 프로필 수정 — nickname(1~6자) 필수, profileImageKey는 uploads/images(RECIPE_COVER 등)로 받은 key.
  updateProfile: (body: ProfileUpdateRequest) =>
    apiFetch<ProfileResponse>('/users/me/profile', { method: 'PATCH', body }),
  // 온보딩 필요 여부 조회 / 완료 처리.
  getOnboarding: () => apiFetch<OnboardingResponse>('/users/me/onboarding'),
  completeOnboarding: () =>
    apiFetch<OnboardingResponse>('/users/me/onboarding/complete', { method: 'POST' }),
  // 회원 탈퇴 — 계정·사용자 데이터 삭제(복구 불가). 소셜 연결 해제는 서버가 안 함.
  withdraw: () => apiFetch<null>('/users/me', { method: 'DELETE' }),
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
  // 추천 — 홈 "랜덤으로 골라줘/재료 기반". previousRecipeId로 직전 추천 제외.
  // 후보가 없으면 백엔드가 200 + data:null → 여기서도 null이 반환된다(전체 랜덤으로 전환 안 함).
  recommend: (body: RecipeRecommendationRequest) =>
    apiFetch<RecipeRecommendationResponse | null>('/recipes/recommendations', {
      method: 'POST',
      body,
    }),
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

// ── My Ingredient (보유 재료) ──────────────────────────────────
// 마스터(GET /ingredients)와 구분: 이건 "내가 등록한" 재료만. 인증 필요.
export const myIngredientApi = {
  // searchQuery: 재료명 부분검색(옵션). 비어 있으면 전체 조회.
  list: (searchQuery?: string) =>
    apiFetch<MyIngredientListResponse>('/users/me/ingredients', {
      query: searchQuery ? { searchQuery } : undefined,
    }),
  // 마스터 id 다건 등록. 이미 보유한 건 백엔드가 무시하고 신규만 반환.
  add: (ingredientIds: number[]) =>
    apiFetch<AddMyIngredientsResponse>('/users/me/ingredients', {
      method: 'POST',
      body: { ingredientIds } satisfies AddMyIngredientsRequest,
    }),
  // 커스텀 재료(직접 입력) 등록 — 이름만. 마스터에 없어도 등록되며 항상 새 CUSTOM 항목.
  addCustom: (name: string) =>
    apiFetch<UserIngredient>('/users/me/ingredients/custom', {
      method: 'POST',
      body: { name } satisfies CustomIngredientCreateRequest,
    }),
};

// ── Inquiry (문의) ─────────────────────────────────────────────
export const inquiryApi = {
  // 접수(201). attachmentKeys 는 uploads/images(INQUIRY_ATTACHMENT) 발급 key들.
  create: (body: InquiryCreateRequest) =>
    apiFetch<InquiryCreateResponse>('/inquiries', { method: 'POST', body }),
  // 내 문의 목록 — 최근 1년, createdAt DESC. page 기본 0, size 기본 20(1~100).
  list: (params: InquiryListParams = {}) =>
    apiFetch<InquiryListResponse>('/inquiries', { query: params }),
  detail: (inquiryId: number) => apiFetch<InquiryDetailResponse>(`/inquiries/${inquiryId}`),
};

// ── Notification (알림) ────────────────────────────────────────
export const notificationApi = {
  getSettings: () => apiFetch<NotificationSettings>('/notification-settings'),
  // 전체 교체(PUT). 세 필드 모두 필수.
  saveSettings: (body: NotificationSettings) =>
    apiFetch<null>('/notification-settings', { method: 'PUT', body }),
  // 기기 FCM 토큰 등록/갱신. 네이티브 FCM 토큰 필요.
  registerPushToken: (body: PushTokenRegisterRequest) =>
    apiFetch<null>('/push-tokens', { method: 'PUT', body }),
  unregisterPushToken: (body: PushTokenUnregisterRequest) =>
    apiFetch<null>('/push-tokens', { method: 'DELETE', body }),
  // 푸시 탭 시 최초 오픈 기록. notificationId = push data.notificationId.
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

// ── Ad Reward (광고 보상 슬롯) ──────────────────────────────────
// 플로우: status로 시청 가능 확인 → createSession → (AdMob 광고 시청) → getResult 폴링으로
// 지급 확인. 시청 실패/닫음 시 cancel. 실제 슬롯 지급은 Google SSV 콜백이 확정한다.
export const adRewardApi = {
  status: () => apiFetch<AdRewardStatusResponse>('/ads/rewards/status'),
  createSession: (body: AdRewardSessionCreateRequest) =>
    apiFetch<AdRewardSessionResponse>('/ads/rewards/sessions', { method: 'POST', body }),
  getResult: (sessionId: string) =>
    apiFetch<AdRewardSessionResultResponse>(`/ads/rewards/sessions/${sessionId}`),
  cancelSession: (sessionId: string, body: AdRewardSessionCancelRequest) =>
    apiFetch<AdRewardSessionResultResponse>(`/ads/rewards/sessions/${sessionId}/cancel`, {
      method: 'POST',
      body,
    }),
};
