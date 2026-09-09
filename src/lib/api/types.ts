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
export type SocialLoginRequest = { provider: string; authToken: string };
export type SocialLoginResponse = {
  requiresTermsAgreement: boolean;
  userId?: number;
  accessToken?: string;
  refreshToken?: string;
  signupToken?: string;
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
  source: null; // Ingestion 전까지 항상 null
};

export type RecipeListParams = { page?: number; size?: number; sort?: RecipeListSort };

// ── Cooking ───────────────────────────────────────────────────
export type CookHistoryCreateRequest = { photoKey?: string; memo?: string };
export type CookHistoryItem = {
  cookedAt: string; // ISO8601 UTC
  photoUrl: string | null;
  memo: string | null;
};

// ── Ingredient ────────────────────────────────────────────────
export type Ingredient = {
  ingredientId: number;
  code: string;
  name: string;
  categoryCode: IngredientCategory;
  aliases: string[];
};
export type IngredientListResponse = { ingredients: Ingredient[] };
