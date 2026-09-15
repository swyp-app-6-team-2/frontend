// 백엔드 계약 타입 — api-spec.md(레포 루트) 기준. 계약이 바뀌면 여기와 문서를 함께 갱신.

// ── 공통 envelope ──────────────────────────────────────────────
export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type FieldError = { field: string; message?: string };
export type ErrorData = { code: string; errors?: FieldError[] };

// ── enum ──────────────────────────────────────────────────────
export type RecipeCategory =
  'KOREAN' | 'WESTERN' | 'CHINESE' | 'JAPANESE' | 'BUNSIK' | 'ASIAN' | 'OTHER';
export type RecipeListSort = 'LATEST' | 'OLDEST';
export type IngredientCategory = 'MEAT' | 'SEAFOOD' | 'VEGETABLE' | 'SAUCE' | 'ETC';
export type UploadPurpose = 'RECIPE_COVER' | 'COOK_HISTORY_PHOTO' | 'INGESTION_INPUT';
export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp';

// ── Auth ──────────────────────────────────────────────────────
// nonce: 애플만 사용(identityToken의 nonce 클레임과 원문 비교). 다른 provider는 미전달.
export type SocialLoginRequest = { provider: string; authToken: string; nonce?: string };
export type SocialLoginResponse = {
  requiresTermsAgreement: boolean;
  userId?: number;
  accessToken?: string;
  refreshToken?: string;
  signupToken?: string;
};

// 신규 소셜 사용자 가입 완료. 필수 3동의(age/tos/privacy)는 true여야 백엔드가 통과시킨다.
export type SignupRequest = {
  signupToken: string;
  ageOver14Agreed: boolean;
  serviceTermsAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  serviceAgreed: boolean;
};
export type SignupResponse = { userId: number; accessToken: string; refreshToken: string };

// 토큰 재발급. 성공 시 이전 refreshToken은 폐기(회전).
export type TokenRefreshRequest = { refreshToken: string };
export type TokenRefreshResponse = { accessToken: string; refreshToken: string };

// ── User / Profile ────────────────────────────────────────────
// 현재 프로필 조회. 백엔드 엔드포인트(GET /users/me)는 미구현 — 생기면 그대로 붙는다.
// (profiles 테이블: nickname, profile_image_url / users: last_login_provider)
export type MeResponse = {
  userId: number;
  nickname: string;
  profileImageUrl?: string | null;
  provider?: string; // KAKAO | NAVER | GOOGLE | APPLE — 배지용
};

// ── Upload ────────────────────────────────────────────────────
export type UploadUrlIssueRequest = { purpose: UploadPurpose; contentType: ImageContentType };
export type UploadUrlIssueResponse = {
  objectKey: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  expiresAt: string;
};

// ── Recipe ────────────────────────────────────────────────────
export type RecipeIngredientInput = {
  ingredientId?: number; // 마스터 참조(옵션)
  name: string; // 필수(스냅샷)
  amountText?: string;
};
export type RecipeStepInput = { content: string };

export type RecipeCreateRequest = {
  title: string;
  categoryCode: RecipeCategory;
  cookTimeMinutes?: number;
  servings?: number;
  memo?: string;
  coverImageKey?: string;
  ingredients?: RecipeIngredientInput[];
  steps?: RecipeStepInput[];
};

// PATCH: 미전달=유지 / null=제거 / 배열=전체교체([] 삭제)
export type RecipeUpdateRequest = Partial<{
  title: string;
  categoryCode: RecipeCategory;
  cookTimeMinutes: number | null;
  servings: number;
  memo: string | null;
  coverImageKey: string | null;
  ingredients: RecipeIngredientInput[];
  steps: RecipeStepInput[];
}>;

export type RecipeCreateResponse = { recipeId: number };

export type RecipeListItem = {
  recipeId: number;
  title: string;
  categoryCode: RecipeCategory;
  coverImageUrl: string | null;
  ingredientNames: string[];
};
export type RecipeListResponse = { totalCount: number; recipes: RecipeListItem[] };

export type RecipeDetailResponse = {
  recipeId: number;
  title: string;
  categoryCode: RecipeCategory;
  coverImageUrl: string | null;
  cookTimeMinutes: number | null;
  servings: number;
  memo: string | null;
  ingredients: { ingredientId: number | null; name: string; amountText: string | null }[];
  steps: { content: string }[];
  source: string | null; // 원본(URL) — Ingestion 전까지 런타임 항상 null
};

export type RecipeListParams = { page?: number; size?: number; sort?: RecipeListSort };

// ── Cooking ───────────────────────────────────────────────────
export type CookHistoryCreateRequest = { photoKey?: string; memo?: string };
export type CookHistoryItem = {
  cookedAt: string; // ISO8601 UTC
  photoUrl: string | null;
  memo: string | null;
};

// ── Ingestion (레시피 분석) ────────────────────────────────────
export type IngestionInputType = 'URL' | 'IMAGE';
export type IngestionJobStatus = 'QUEUED' | 'PROCESSING' | 'RESULT_READY' | 'FAILED' | 'EXPIRED';
export type IngestionFailureCode =
  'SOURCE_UNAVAILABLE' | 'CONTENT_NOT_RECOGNIZED' | 'MULTIPLE_RECIPES' | 'PROCESSING_FAILED';

// AI가 정리한 레시피 초안. 필드는 AI가 못 채우면 null일 수 있다(내용 확인 화면에서 사용자가 보정).
export type RecipeDraft = {
  title: string | null;
  categoryCode: RecipeCategory | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  ingredients: { ingredientId: number | null; name: string; amountText: string | null }[];
  steps: { content: string }[];
};

// 백엔드가 URL·IMAGE 중 정확히 하나만 허용(@AssertTrue) → 타입으로 XOR 강제.
export type IngestionJobCreateRequest =
  { inputType: 'URL'; url: string } | { inputType: 'IMAGE'; inputImageKeys: string[] };
export type IngestionJobCreateResponse = { ingestionJobId: number };
export type IngestionJobResponse = {
  ingestionJobId: number;
  inputType: IngestionInputType;
  status: IngestionJobStatus;
  previewImageUrl: string | null;
  result: RecipeDraft | null;
  failureCode: IngestionFailureCode | null;
};

// ── Ingredient ────────────────────────────────────────────────
export type Ingredient = {
  ingredientId: number;
  code: string;
  name: string;
  categoryCode: IngredientCategory;
  aliases: string[];
  /** 재료별 아이콘 이미지(webp). 백엔드가 iconBaseUrl로 생성. 없으면 카테고리 이모지로 폴백. */
  iconUrl?: string;
};
export type IngredientListResponse = { ingredients: Ingredient[] };

// ── My Ingredient (보유 재료) ──────────────────────────────────
// GET/POST /users/me/ingredients. 마스터(Ingredient)와 달리 iconUrl은 항상 채워지고
// aliases/code는 없다(조회·등록 응답이 공유하는 축약형).
export type UserIngredient = {
  ingredientId: number;
  name: string;
  categoryCode: IngredientCategory;
  iconUrl: string;
};
export type MyIngredientListResponse = { ingredients: UserIngredient[] };
export type AddMyIngredientsRequest = { ingredientIds: number[] };
// 새로 추가된 재료만 반환(이미 보유한 것은 무시). 전부 보유 중이면 빈 배열.
export type AddMyIngredientsResponse = { ingredients: UserIngredient[] };
