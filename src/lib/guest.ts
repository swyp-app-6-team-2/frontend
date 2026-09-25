// 게스트 모드 — 로그인 없이 앱을 둘러보고 레시피를 직접 입력·로컬 저장·조회한다.
// (App Store 심사 5.1.1(v): 계정 기반이 아닌 기능은 로그인 없이 접근 가능해야 한다.)
//
// - 게스트 플래그: SecureStore(작은 값)에 저장 → 재시작 후에도 게스트 세션 유지.
// - 게스트 레시피: expo-file-system(Expo 57 File API)로 문서 디렉터리에 JSON 파일로 저장.
//   SecureStore는 2KB 값 제한이 있어 레시피 목록엔 부적합하므로 파일로 보관한다.
// - 백엔드 무연동: 게스트 레시피는 전적으로 기기 로컬. 계정 기능(AI 분석·추천·재료·클라우드
//   저장)은 로그인이 필요하며, 화면에서 로그인 유도 팝업으로 안내한다.
//
// 네이티브 모듈(expo-secure-store / expo-file-system)이 없는(리빌드 전) 환경에서도 크래시하지
// 않도록 lazy require + try/catch로 감싸고, 실패 시 인메모리로 폴백한다.

import { Alert } from 'react-native';

import type { RecipeCategory, RecipeDetailResponse, RecipeListItem } from '@/lib/api/types';

// ── SecureStore (게스트 플래그) ──────────────────────────────────────────
type SecureStoreModule = typeof import('expo-secure-store');
let secureStore: SecureStoreModule | null | undefined;
function getSecureStore(): SecureStoreModule | null {
  if (secureStore !== undefined) return secureStore;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 지연 로드(네이티브 모듈)
    secureStore = require('expo-secure-store') as SecureStoreModule;
  } catch {
    secureStore = null;
  }
  return secureStore;
}

// ── expo-file-system (게스트 레시피 파일) ────────────────────────────────
type FileSystemModule = typeof import('expo-file-system');
let fileSystem: FileSystemModule | null | undefined;
function getFileSystem(): FileSystemModule | null {
  if (fileSystem !== undefined) return fileSystem;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 지연 로드(네이티브 모듈)
    fileSystem = require('expo-file-system') as FileSystemModule;
  } catch {
    fileSystem = null;
  }
  return fileSystem;
}

const GUEST_KEY = 'app.guestMode';
const RECIPES_FILE = 'guest-recipes.json';

// ── 게스트 플래그 ────────────────────────────────────────────────────────
let guestMode = false;

/** 모듈 로드 시 1회 — SecureStore에서 게스트 플래그 복원. hydrateTokens 옆에서 호출. */
export function hydrateGuest(): void {
  const ss = getSecureStore();
  if (!ss) return;
  try {
    guestMode = ss.getItem(GUEST_KEY) === '1';
  } catch {
    guestMode = false;
  }
}

export function isGuest(): boolean {
  return guestMode;
}

/** 게스트 진입/해제. 로그인 성공 시 setGuest(false)로 정식 세션으로 승격. */
export function setGuest(on: boolean): void {
  guestMode = on;
  const ss = getSecureStore();
  if (!ss) return;
  try {
    if (on) ss.setItem(GUEST_KEY, '1');
    else void ss.deleteItemAsync(GUEST_KEY).catch(() => {});
  } catch {
    // 인메모리는 이미 갱신됨.
  }
}

// ── 게스트 레시피 (로컬 파일) ────────────────────────────────────────────
// 저장 스키마 — 상세(RecipeDetailResponse) + 목록(RecipeListItem) 파생에 필요한 필드 + 정렬용 createdAt.
export type GuestRecipe = {
  recipeId: number; // 음수 — 백엔드(양수) id와 구분
  title: string;
  categoryCode: RecipeCategory;
  coverImageUrl: string | null; // 로컬 file:// URI (업로드 없음)
  cookTimeMinutes: number | null;
  servings: number;
  memo: string | null;
  ingredients: { ingredientId: number | null; name: string; amountText: string | null }[];
  steps: { content: string }[];
  createdAt: number;
};

export type GuestRecipeInput = Omit<GuestRecipe, 'recipeId' | 'createdAt'>;

// 파일이 없거나 읽기 실패 시 인메모리 폴백(세션 한정).
let memCache: GuestRecipe[] | null = null;

function recipesFile() {
  const fs = getFileSystem();
  if (!fs) return null;
  try {
    return new fs.File(fs.Paths.document, RECIPES_FILE);
  } catch {
    return null;
  }
}

function readAll(): GuestRecipe[] {
  const f = recipesFile();
  if (!f) return memCache ?? [];
  try {
    if (!f.exists) return [];
    const raw = f.textSync();
    const list = JSON.parse(raw) as GuestRecipe[];
    memCache = Array.isArray(list) ? list : [];
    return memCache;
  } catch {
    return memCache ?? [];
  }
}

function writeAll(list: GuestRecipe[]): void {
  memCache = list;
  const f = recipesFile();
  if (!f) return;
  try {
    f.write(JSON.stringify(list));
  } catch {
    // 파일 쓰기 실패 — 인메모리(memCache)로만 유지(세션 한정).
  }
}

/** 최신순 목록(홈·레시피 화면용 RecipeListItem 형태). */
export function listGuestRecipes(): RecipeListItem[] {
  return [...readAll()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((r) => ({
      recipeId: r.recipeId,
      title: r.title,
      categoryCode: r.categoryCode,
      coverImageUrl: r.coverImageUrl,
      thumbnailUrl: null,
      ingredientNames: r.ingredients.map((i) => i.name).filter(Boolean),
    }));
}

/** 상세(recipe-view용 RecipeDetailResponse 형태). 없으면 null. */
export function getGuestRecipe(recipeId: number): RecipeDetailResponse | null {
  const r = readAll().find((x) => x.recipeId === recipeId);
  if (!r) return null;
  return {
    recipeId: r.recipeId,
    title: r.title,
    categoryCode: r.categoryCode,
    coverImageUrl: r.coverImageUrl,
    cookTimeMinutes: r.cookTimeMinutes,
    servings: r.servings,
    memo: r.memo,
    ingredients: r.ingredients,
    steps: r.steps,
    source: null, // 직접 입력 — 원본 없음
  };
}

/** 게스트 레시피 추가 → 생성된 recipeId(음수) 반환. id는 시간 기반 음수로 유일. */
export function addGuestRecipe(input: GuestRecipeInput): number {
  const list = readAll();
  const recipeId = -Date.now();
  list.push({ ...input, recipeId, createdAt: Date.now() });
  writeAll(list);
  return recipeId;
}

/** 게스트 레시피 수정(직접입력 편집). 대상이 없으면 무시. */
export function updateGuestRecipe(recipeId: number, input: GuestRecipeInput): void {
  const list = readAll();
  const idx = list.findIndex((x) => x.recipeId === recipeId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...input, recipeId };
  writeAll(list);
}

/** 게스트 레시피 삭제. */
export function deleteGuestRecipe(recipeId: number): void {
  writeAll(readAll().filter((x) => x.recipeId !== recipeId));
}

/** recipeId가 게스트(로컬) 레시피인지 — 음수면 게스트. */
export function isGuestRecipeId(recipeId: number): boolean {
  return recipeId < 0;
}

// ── 계정 기능 로그인 유도 ────────────────────────────────────────────────
/**
 * 게스트가 계정 기능(AI 분석·추천·재료·요리완료·클라우드 저장)을 시도할 때 로그인 유도 팝업.
 * onLogin에 로그인 화면 이동을 넘긴다: promptGuestLogin(() => router.push('/login'), '...')
 */
export function promptGuestLogin(
  onLogin: () => void,
  message = '이 기능은 로그인 후 이용할 수 있어요.',
): void {
  Alert.alert('로그인이 필요해요', message, [
    { text: '취소', style: 'cancel' },
    { text: '로그인하기', onPress: onLogin },
  ]);
}
