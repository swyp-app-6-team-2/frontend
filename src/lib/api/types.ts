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
export type RecommendationMode = 'RANDOM' | 'INGREDIENT_BASED';
export type IngredientCategory = 'MEAT' | 'SEAFOOD' | 'VEGETABLE' | 'SAUCE' | 'ETC';
export type UploadPurpose =
  'RECIPE_COVER' | 'COOK_HISTORY_PHOTO' | 'INGESTION_INPUT' | 'INQUIRY_ATTACHMENT';
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
// GET /users/me. 신규 유저는 nickname/profileImageUrl 이 null.
export type MeResponse = {
  userId: number;
  nickname: string | null;
  profileImageUrl?: string | null;
  remainingRecipeSlots: number;
  recipeSlotLimit: number;
  cumulativeRecipeCount: number;
  // provider 는 백엔드가 아직 응답에 안 넣는다 — 마이 배지는 로그인 시 저장한 값(getLoginProvider)으로 폴백.
  provider?: string; // KAKAO | NAVER | GOOGLE | APPLE
};

// PATCH /users/me/profile — nickname 1~6자 필수, profileImageKey 옵션(생략=기존 유지).
export type ProfileUpdateRequest = { nickname: string; profileImageKey?: string };
export type ProfileResponse = {
  userId: number;
  nickname: string | null;
  profileImageUrl: string | null;
};

// 온보딩 상태 — GET /users/me/onboarding, POST /users/me/onboarding/complete 둘 다 이 응답.
export type OnboardingResponse = {
  onboardingRequired: boolean;
  onboardingCompletedAt: string | null; // ISO8601 UTC
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

// POST /recipes/recommendations — 홈 "랜덤으로 골라줘/재료 기반".
// previousRecipeId: "다른 거 추천" 시 직전 추천 제외용(옵션).
export type RecipeRecommendationRequest = {
  recommendationMode: RecommendationMode;
  previousRecipeId?: number;
};
export type RecipeRecommendationResponse = {
  recipeId: number;
  title: string;
  category: RecipeCategory;
  thumbnailUrl: string | null;
  mainIngredients: string[];
};

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

// ── Inquiry (문의) ─────────────────────────────────────────────
// 표시 이름·순서는 앱이 보유(constants). 서버는 코드만 주고받는다.
export type InquiryType = 'RECIPE' | 'SLOT' | 'ACCOUNT' | 'NOTIFICATION' | 'BUG' | 'ETC';
export type InquiryStatus = 'RECEIVED' | 'ANSWERED'; // answer 유무로 서버가 계산

// 첨부는 POST /uploads/images(purpose=INQUIRY_ATTACHMENT)로 받은 objectKey들, 최대 5장.
export type InquiryCreateRequest = {
  type: InquiryType;
  title: string; // 1~255자
  content: string; // 1~2,000자
  attachmentKeys?: string[]; // 생략/ null 이면 []
};
export type InquiryCreateResponse = { inquiryId: number };

// 목록: content 전체를 주며 미리보기 길이는 앱이 정한다. 첨부·답변은 목록에 없음.
export type InquiryListItem = {
  inquiryId: number;
  type: InquiryType;
  title: string;
  content: string;
  status: InquiryStatus;
  createdAt: string; // ISO8601 UTC
};
export type InquiryListResponse = { totalCount: number; inquiries: InquiryListItem[] };
export type InquiryListParams = { page?: number; size?: number };

// 상세: 답변 전엔 answer·answeredAt 이 null(키는 항상 내려온다). URL 유효 60분.
export type InquiryDetailResponse = {
  inquiryId: number;
  type: InquiryType;
  title: string;
  content: string;
  attachmentImageUrls: string[];
  status: InquiryStatus;
  createdAt: string;
  answer: string | null;
  answeredAt: string | null;
};

// ── Notification (알림) ────────────────────────────────────────
export type Weekday =
  'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type NotificationTimeSlot = { label: string; time: string }; // time = "HH:mm"

// GET 응답 = PUT 요청 본문(전체 교체). 켜져 있어도 weekdays/timeSlots 는 비어 있을 수 있다.
export type NotificationSettings = {
  enabled: boolean;
  weekdays: Weekday[];
  timeSlots: NotificationTimeSlot[];
};

// 푸시 토큰 — 네이티브 FCM 토큰 필요(iOS도 FCM). platform 은 발송엔 안 쓰이나 구분용.
export type PushPlatform = 'IOS' | 'ANDROID';
export type PushTokenRegisterRequest = { token: string; platform: PushPlatform };
export type PushTokenUnregisterRequest = { token: string };

// ── Ad Reward (광고 보상 슬롯) ──────────────────────────────────
// 보상형 광고 SSV 플로우. 슬롯 지급은 Google SSV 콜백(서버-서버)으로 확정되므로,
// 앱은 세션 발급 → 광고 시청 → 결과 폴링(getSessionResult)으로 지급 여부를 확인한다.
export type AdRewardPlatform = 'IOS' | 'ANDROID';
export type AdRewardCancelReason = 'LOAD_FAILED' | 'USER_DISMISSED';
export type AdRewardSessionStatus = 'PENDING' | 'GRANTED' | 'CANCELLED' | 'EXPIRED' | 'REJECTED';
export type AdRewardUnavailableReason = 'DAILY_LIMIT_REACHED' | 'REWARD_PENDING';

// GET /ads/rewards/status — 한도·잔여 슬롯·당일 지급/예약·진행 중 세션. 슬롯 지급 안 함.
export type AdRewardPendingSession = {
  sessionId: string; // UUID
  status: AdRewardSessionStatus;
  quotaDate: string; // YYYY-MM-DD
  expiresAt: string; // ISO8601 UTC
  verificationDeadline: string;
};
export type AdRewardStatusResponse = {
  recipeSlotLimit: number;
  remainingRecipeSlots: number;
  dailyRewardCount: number;
  dailyRewardLimit: number;
  reservedCount: number;
  remainingRewardCount: number;
  availableWatchCount: number;
  canWatchAd: boolean;
  unavailableReason: AdRewardUnavailableReason | null;
  quotaDate: string;
  resetsAt: string;
  pendingSessions: AdRewardPendingSession[];
};

// POST /ads/rewards/sessions — 시청 세션 발급(당일 1회 예약). requestId 로 멱등.
export type AdRewardSessionCreateRequest = { platform: AdRewardPlatform; requestId: string };
export type AdRewardSessionResponse = {
  sessionId: string; // UUID
  status: AdRewardSessionStatus;
  adUnitId: string;
  customData: string; // = sessionId, AdMob customData로 전달
  rewardType: string;
  rewardAmount: number;
  quotaDate: string;
  expiresAt: string;
  verificationDeadline: string;
};

// POST /ads/rewards/sessions/{id}/cancel — 보상 청구 포기(시청 실패/닫음).
export type AdRewardSessionCancelRequest = { reason: AdRewardCancelReason };

// GET /ads/rewards/sessions/{id} & cancel 응답 — 지급 결과 + 최신 슬롯 값.
export type AdRewardSessionResultResponse = {
  sessionId: string;
  status: AdRewardSessionStatus;
  reasonCode: string | null;
  quotaDate: string;
  grantedAmount: number; // GRANTED 아니면 0
  grantedAt: string | null;
  recipeSlotLimit: number;
  remainingRecipeSlots: number;
};
