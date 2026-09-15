import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { setTokens } from '@/lib/api/auth-token';
import {
  authApi,
  cookingApi,
  ingestionApi,
  ingredientApi,
  notificationApi,
  recipeApi,
  userApi,
} from '@/lib/api/endpoints';
import type {
  CookHistoryCreateRequest,
  IngestionJobCreateRequest,
  NotificationSettingRequest,
  PushPlatform,
  RecipeCreateRequest,
  RecipeListParams,
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
  ingestionJob: (jobId: number) => ['ingestion-job', jobId] as const,
  me: () => ['me'] as const,
  notificationSettings: () => ['notification-settings'] as const,
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

// ── Notification ──────────────────────────────────────────────
// 알림 설정 조회 — notify-setup(온보딩)·notifications(설정) 화면에서 사용.
export function useNotificationSettings() {
  return useQuery({
    queryKey: queryKeys.notificationSettings(),
    queryFn: () => notificationApi.getSettings(),
  });
}

// 알림 설정 저장(전체 교체). 성공 시 설정 캐시 무효화.
export function useSaveNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NotificationSettingRequest) => notificationApi.saveSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notificationSettings() }),
  });
}

// FCM 등록 토큰 등록/이관. 로그인 후·토큰 갱신 시 호출.
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: ({ token, platform }: { token: string; platform: PushPlatform }) =>
      notificationApi.registerPushToken(token, platform),
  });
}

// 토큰 해제 — 로그아웃 시 호출.
export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: (token: string) => notificationApi.unregisterPushToken(token),
  });
}

// 알림 오픈 기록 — 푸시 탭 시 data.notificationId로 호출.
export function useMarkNotificationOpened() {
  return useMutation({
    mutationFn: (notificationId: number) => notificationApi.markOpened(notificationId),
  });
}
