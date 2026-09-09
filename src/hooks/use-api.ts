import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { setTokens } from '@/lib/api/auth-token';
import { authApi, cookingApi, ingredientApi, recipeApi, userApi } from '@/lib/api/endpoints';
import type {
  CookHistoryCreateRequest,
  RecipeCreateRequest,
  RecipeListParams,
  RecipeUpdateRequest,
  SocialLoginRequest,
} from '@/lib/api/types';

// queryKey 컨벤션 — 무효화 대상을 예측 가능하게 한 곳에서 관리.
export const queryKeys = {
  recipes: (params?: RecipeListParams) => ['recipes', params ?? {}] as const,
  recipe: (recipeId: number) => ['recipe', recipeId] as const,
  cookHistories: (recipeId: number) => ['cook-histories', recipeId] as const,
  ingredients: () => ['ingredients'] as const,
  me: () => ['me'] as const,
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
