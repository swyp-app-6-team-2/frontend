import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clearTokens, setTokens } from '@/lib/api/auth-token';
import {
  adRewardApi,
  authApi,
  cookingApi,
  ingestionApi,
  ingredientApi,
  inquiryApi,
  myIngredientApi,
  notificationApi,
  recipeApi,
  userApi,
} from '@/lib/api/endpoints';
import type {
  AdRewardSessionCancelRequest,
  AdRewardSessionCreateRequest,
  CookHistoryCreateRequest,
  IngestionJobCreateRequest,
  InquiryCreateRequest,
  InquiryListParams,
  NotificationSettings,
  ProfileUpdateRequest,
  PushTokenRegisterRequest,
  PushTokenUnregisterRequest,
  RecipeCreateRequest,
  RecipeListParams,
  RecipeRecommendationRequest,
  RecipeUpdateRequest,
  SignupRequest,
  SocialLoginRequest,
} from '@/lib/api/types';

// queryKey 컨벤션 — 무효화 대상을 예측 가능하게 한 곳에서 관리.
export const queryKeys = {
  recipes: (params?: RecipeListParams) => ['recipes', params ?? {}] as const,
  recipe: (recipeId: number) => ['recipe', recipeId] as const,
  cookHistories: (recipeId: number) => ['cook-histories', recipeId] as const,
  ingredients: () => ['ingredients'] as const,
  myIngredients: (searchQuery?: string) => ['my-ingredients', searchQuery ?? ''] as const,
  ingestionJob: (jobId: number) => ['ingestion-job', jobId] as const,
  me: () => ['me'] as const,
  inquiries: (params?: InquiryListParams) => ['inquiries', params ?? {}] as const,
  inquiry: (inquiryId: number) => ['inquiry', inquiryId] as const,
  notificationSettings: () => ['notification-settings'] as const,
  onboarding: () => ['onboarding'] as const,
  adRewardStatus: () => ['ad-reward-status'] as const,
  adRewardSession: (sessionId: string) => ['ad-reward-session', sessionId] as const,
};

// ── Queries ───────────────────────────────────────────────────
export function useRecipes(params: RecipeListParams = {}) {
  return useQuery({ queryKey: queryKeys.recipes(params), queryFn: () => recipeApi.list(params) });
}

// 현재 로그인 유저 프로필. 백엔드 GET /users/me 미구현 시 404 → 화면은 폴백 처리.
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => userApi.me(),
    retry: false, // 엔드포인트 없으면 재시도 무의미
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecipe(recipeId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.recipe(recipeId as number),
    queryFn: () => recipeApi.detail(recipeId as number),
    enabled: recipeId != null,
  });
}

export function useCookHistories(recipeId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.cookHistories(recipeId as number),
    queryFn: () => cookingApi.list(recipeId as number),
    enabled: recipeId != null,
  });
}

export function useIngredients() {
  // 마스터는 거의 불변 → 재요청하지 않도록 staleTime 무한.
  return useQuery({
    queryKey: queryKeys.ingredients(),
    queryFn: ingredientApi.list,
    staleTime: Infinity,
  });
}

// 내가 등록한 재료(재료관리 화면). 마스터(useIngredients)와 다른 소스.
export function useMyIngredients(searchQuery?: string) {
  return useQuery({
    queryKey: queryKeys.myIngredients(searchQuery),
    queryFn: () => myIngredientApi.list(searchQuery),
  });
}

// 레시피 분석 작업 폴링. QUEUED/PROCESSING 동안만 refetch, terminal 상태면 자동 정지.
export function useIngestionJob(jobId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.ingestionJob(jobId as number),
    queryFn: () => ingestionApi.get(jobId as number),
    enabled: jobId != null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const done = status === 'RESULT_READY' || status === 'FAILED' || status === 'EXPIRED';
      return done ? false : 2000;
    },
  });
}

// 내 문의 목록(문의내역). 최근 1년, 최신순.
export function useInquiries(params: InquiryListParams = {}) {
  return useQuery({
    queryKey: queryKeys.inquiries(params),
    queryFn: () => inquiryApi.list(params),
  });
}

// 문의 상세(답변 포함).
export function useInquiry(inquiryId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.inquiry(inquiryId as number),
    queryFn: () => inquiryApi.detail(inquiryId as number),
    enabled: inquiryId != null,
  });
}

// 알림 설정 조회. 설정이 없으면 {enabled:false, weekdays:[], timeSlots:[]}.
export function useNotificationSettings() {
  return useQuery({
    queryKey: queryKeys.notificationSettings(),
    queryFn: () => notificationApi.getSettings(),
  });
}

// ── Mutations ─────────────────────────────────────────────────
export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RecipeCreateRequest) => recipeApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useUpdateRecipe(recipeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RecipeUpdateRequest) => recipeApi.update(recipeId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: queryKeys.recipe(recipeId) });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: number) => recipeApi.remove(recipeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

// 보유 재료 추가(재료 추가하기 화면). 성공 시 재료관리 목록 무효화 → 자동 반영.
export function useAddMyIngredients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ingredientIds: number[]) => myIngredientApi.add(ingredientIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-ingredients'] }),
  });
}

export function useCreateCookHistory(recipeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CookHistoryCreateRequest) => cookingApi.create(recipeId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cookHistories(recipeId) }),
  });
}

export function useSocialLogin() {
  return useMutation({
    mutationFn: (body: SocialLoginRequest) => authApi.socialLogin(body),
    onSuccess: (res) => {
      // 기존 회원이면 토큰 저장(신규는 signupToken만 → 약관 화면에서 처리).
      if (res.accessToken) {
        setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken ?? null });
      }
    },
  });
}

// 레시피 분석 요청. 성공 시 jobId를 받아 로딩 화면에서 폴링한다.
export function useCreateIngestionJob() {
  return useMutation({
    mutationFn: (body: IngestionJobCreateRequest) => ingestionApi.create(body),
  });
}

// 신규 가입 완료(약관 화면). 성공 시 토큰 저장 → 이후 요청이 인증된다.
export function useSignup() {
  return useMutation({
    mutationFn: (body: SignupRequest) => authApi.signup(body),
    onSuccess: (res) => {
      setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    },
  });
}

// 문의 접수(문의하기 폼). 성공 시 문의내역 무효화 → 목록 자동 반영.
export function useCreateInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InquiryCreateRequest) => inquiryApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inquiries'] }),
  });
}

// 알림 설정 저장(전체 교체). 성공 시 설정 무효화.
export function useSaveNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NotificationSettings) => notificationApi.saveSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notificationSettings() }),
  });
}

// 기기 푸시 토큰 등록/해제 — 네이티브 FCM 토큰이 있어야 실제 동작(iOS도 FCM).
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: (body: PushTokenRegisterRequest) => notificationApi.registerPushToken(body),
  });
}
export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: (body: PushTokenUnregisterRequest) => notificationApi.unregisterPushToken(body),
  });
}

// ── User / Auth 추가 ──────────────────────────────────────────
// 프로필 수정 — 성공 시 /users/me 무효화(닉네임·이미지 즉시 반영).
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileUpdateRequest) => userApi.updateProfile(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me() }),
  });
}

// 온보딩 필요 여부.
export function useOnboarding() {
  return useQuery({ queryKey: queryKeys.onboarding(), queryFn: () => userApi.getOnboarding() });
}
export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => userApi.completeOnboarding(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.onboarding() }),
  });
}

// 로그아웃 — 서버 세션 무효화 후 로컬 토큰 삭제(성공/실패 무관하게 로컬은 비운다).
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearTokens();
      qc.clear();
    },
  });
}

// ── 레시피 추천 ───────────────────────────────────────────────
// 홈 "랜덤으로 골라줘/재료 기반". 결과는 화면 상태로 다뤄 매번 새로 뽑으므로 mutation.
export function useRecommendRecipe() {
  return useMutation({
    mutationFn: (body: RecipeRecommendationRequest) => recipeApi.recommend(body),
  });
}

// ── 광고 보상 슬롯 ────────────────────────────────────────────
// 시청 가능 여부·잔여 슬롯 조회. 세션 결과 반영 위해 포그라운드 복귀 시 자동 갱신.
export function useAdRewardStatus() {
  return useQuery({ queryKey: queryKeys.adRewardStatus(), queryFn: () => adRewardApi.status() });
}

// 시청 세션 발급. 성공 시 상태 무효화(예약 반영).
export function useCreateAdRewardSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdRewardSessionCreateRequest) => adRewardApi.createSession(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adRewardStatus() }),
  });
}

// 세션 결과 폴링 — SSV 지급 확인용. sessionId 있고 poll=true일 때만 2초 간격.
export function useAdRewardResult(sessionId: string | null, poll = false) {
  return useQuery({
    queryKey: queryKeys.adRewardSession(sessionId ?? ''),
    queryFn: () => adRewardApi.getResult(sessionId as string),
    enabled: !!sessionId,
    refetchInterval: poll ? 2000 : false,
  });
}

// 보상 청구 포기(시청 실패/닫음). 성공 시 상태 무효화.
export function useCancelAdRewardSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { sessionId: string; body: AdRewardSessionCancelRequest }) =>
      adRewardApi.cancelSession(args.sessionId, args.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adRewardStatus() }),
  });
}
