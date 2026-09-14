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
  RecipeCreateRequest,
  RecipeCreateResponse,
  RecipeDetailResponse,
  RecipeListParams,
  RecipeListResponse,
  RecipeUpdateRequest,
  SocialLoginRequest,
  SocialLoginResponse,
  UploadPurpose,
  UploadUrlIssueResponse,
} from './types';

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  socialLogin: (body: SocialLoginRequest) =>
    apiFetch<SocialLoginResponse>('/auth/social-login', { method: 'POST', body, auth: false }),
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

// ── Ingestion (레시피 분석) ────────────────────────────────────
export const ingestionApi = {
  // 분석 요청(202) → jobId 반환. 이후 get(id)로 상태를 폴링한다.
  create: (body: IngestionJobCreateRequest) =>
    apiFetch<IngestionJobCreateResponse>('/ingestion-jobs', { method: 'POST', body }),
  get: (ingestionJobId: number) =>
    apiFetch<IngestionJobResponse>(`/ingestion-jobs/${ingestionJobId}`),
};
