import { ApiError, apiFetch, uploadToGcs } from './client';
import type {
  AddMyIngredientsRequest,
  AddMyIngredientsResponse,
  CookHistoryCreateRequest,
  CookHistoryItem,
  ImageContentType,
  IngestionJobCreateRequest,
  IngestionJobCreateResponse,
  IngestionJobResponse,
  IngredientListResponse,
  MeResponse,
  MyIngredientListResponse,
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
  me: async () => {
    try {
      const res = await apiFetch<MeResponse>('/users/me');
      if (__DEV__)
        console.log('[me][diag] OK provider=', res?.provider, 'full=', JSON.stringify(res));
      return res;
    } catch (e) {
      if (__DEV__) {
        const status = e instanceof ApiError ? e.status : undefined;
        console.log(
          '[me][diag] FAIL status=',
          status,
          'msg=',
          e instanceof Error ? e.message : String(e),
        );
      }
      throw e;
    }
  },
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
  if (__DEV__) console.log(`[upload][diag] 1) issueUrl purpose=${purpose} ct=${file.contentType}`);
  const issued = await uploadApi.issueUrl(purpose, file.contentType);
  if (__DEV__) console.log(`[upload][diag] 2) issued OK objectKey=${issued.objectKey}`);
  await uploadToGcs(issued.uploadUrl, issued.uploadHeaders, file.uri);
  if (__DEV__) console.log(`[upload][diag] 3) gcs PUT OK`);
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
};

// ── Ingestion (레시피 분석) ────────────────────────────────────
export const ingestionApi = {
  // 분석 요청(202) → jobId 반환. 이후 get(id)로 상태를 폴링한다.
  create: (body: IngestionJobCreateRequest) =>
    apiFetch<IngestionJobCreateResponse>('/ingestion-jobs', { method: 'POST', body }),
  get: (ingestionJobId: number) =>
    apiFetch<IngestionJobResponse>(`/ingestion-jobs/${ingestionJobId}`),
};
