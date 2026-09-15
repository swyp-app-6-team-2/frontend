# API 스펙 (프론트 연동용)

> 백엔드 레포 [`swyp-app-6-team-2/backend`](https://github.com/swyp-app-6-team-2/backend)(Spring Boot) 기준.
> 백엔드 `docs/specs/*.md` + 컨트롤러/DTO에서 추출. **기준일 2026-09-09.**
> 백엔드가 계약을 바꾸면 이 문서도 갱신할 것. Swagger UI: `<host>/swagger-ui/index.html`.

---

## 0. 공통 규약

### Base URL

- 모든 경로 접두사: **`/api/v1`**
- 호스트는 배포 환경별로 주입 — `EXPO_PUBLIC_API_BASE_URL` 환경변수 권장 (예: `https://api.example.com`).
- 최종 요청 예: `POST ${EXPO_PUBLIC_API_BASE_URL}/api/v1/recipes`

### 응답 Envelope

성공/실패 **모두** 아래 형태로 감싸진다.

```ts
type ApiResponse<T> = {
  status: number;   // HTTP status (200/201/400/401/...)
  message: string;  // 사용자 표시 가능한 메시지
  data: T;          // 성공: 실제 데이터 / 실패: 아래 ErrorData 또는 null
};
```

- **성공**: `data`에 실제 payload (200 조회/수정, 201 생성). 일부는 `data: null`(수정·삭제·기록 생성).
- **실패(도메인 에러)**: `data`는 `{ code, errors? }`.
- **실패(MVC 표준·인증 예외)**: `data: null` (code 없음 → 404/405/415 등은 분기 대상 아님).

```ts
type ErrorData = {
  code: string;                    // 예: "RECIPE_NOT_FOUND" — 이 문자열로 분기
  errors?: { field: string; /* ... */ }[]; // Bean Validation 상세(있을 때만)
};
```

> ⚠️ FE는 **HTTP status가 아니라 `data.code` 문자열로 분기**한다. code enum 이름이 곧 공개 계약이라 백엔드가 rename하면 조용히 깨진다.

### 인증

- 방식: **JWT Bearer**. 헤더 `Authorization: Bearer <accessToken>`.
- `POST /api/v1/auth/**` 와 swagger를 제외한 **모든 엔드포인트는 인증 필요**.
- 미인증/만료: `401 + AUTHENTICATION_REQUIRED`, 권한 없음: `403 + ACCESS_DENIED`.

### 공통 에러코드

| code | HTTP | 의미 |
|---|---|---|
| `REQUEST_VALIDATION_FAILED` | 400 | 값 검증 실패(필수 누락, 범위 초과 등). `errors[]` 동반 가능 |
| `INVALID_REQUEST_FORMAT` | 400 | 형식 오류(enum 아닌 값, 숫자 아닌 파라미터, 본문 없음) |
| `AUTHENTICATION_REQUIRED` | 401 | 인증 필요/실패 |
| `ACCESS_DENIED` | 403 | 접근 권한 없음 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 오류 |

### 날짜/이미지 규칙

- 모든 타임스탬프(`expiresAt`, `cookedAt`)는 **`Z`가 붙은 UTC ISO8601 문자열** (예 `2026-09-09T12:34:56Z`). 로컬 시각·상대시간("3일 전")은 **클라이언트가 계산**.
- 조회용 이미지 URL(`coverImageUrl`, `photoUrl`)은 **서명 URL(유효 60분), nullable**. 없거나 서명 실패 시 `null` — 이미지 하나 때문에 조회 전체가 실패하지 않는다. FE는 항상 null 폴백(플레이스홀더) 준비.

---

## 1. 인증 — `Auth`

### `POST /api/v1/auth/social-login` — 소셜 로그인/가입 (인증 불필요)

클라이언트가 소셜 Provider(카카오/네이버/애플) 인증을 마친 뒤 받은 토큰을 서버로 넘겨 로그인/신규가입을 판단.

**Request**
```ts
{ provider: string; authToken: string } // provider 예: "KAKAO" | "NAVER" | "APPLE"(백엔드 확인 필요)
```

**Response 200** — `requiresTermsAgreement`로 분기:
```ts
type SocialLoginResponse = {
  requiresTermsAgreement: boolean;
  userId?: number;        // 기존 회원일 때만
  accessToken?: string;   // 기존 회원일 때만
  refreshToken?: string;  // 기존 회원일 때만
  signupToken?: string;   // 신규 회원일 때만(약관 동의 화면으로)
};
```
- **기존 회원**: `requiresTermsAgreement=false` + `accessToken`/`refreshToken`/`userId` → 로그인 완료, 토큰 저장.
- **신규 회원**: `requiresTermsAgreement=true` + `signupToken` → 약관 동의 화면(`/terms`)으로 유도.

**에러**: `401` 유효하지 않은 소셜 토큰 · `502` 소셜 인증 서버 오류.

> 회원가입 완료(약관 동의 후 signupToken → 정식 가입) API는 백엔드에 아직 없음 → 추가되면 이 문서 갱신.

---

## 2. 이미지 업로드 — `Upload`

바이너리는 **서버를 거치지 않는다.** 서버는 접근 권한(Signed URL)만 발급하고, 업로드된 `objectKey`를 비즈니스 API에 넘겨 연결한다.

### 흐름 (3단계)

```
① 발급   POST /api/v1/uploads/images { purpose, contentType }
             → { objectKey, uploadUrl, uploadHeaders, expiresAt }
② 업로드  PUT <uploadUrl>  (바이너리 + uploadHeaders 전부 그대로)
③ 연결   objectKey를 비즈니스 API에 전달
             레시피 대표: coverImageKey / 요리완성: photoKey
```

### `POST /api/v1/uploads/images` — 업로드 URL 발급

**Request**
```ts
{ purpose: UploadPurpose; contentType: "image/jpeg" | "image/png" | "image/webp" }
```

**Response 200** (⚠️ 201 아님):
```ts
type UploadUrlIssueResponse = {
  objectKey: string;      // 예 "recipe-covers/1/uuid.jpg" — ③에서 사용
  uploadUrl: string;      // GCS 서명 PUT URL (유효 15분)
  uploadHeaders: Record<string, string>; // { "Content-Type", "x-goog-if-generation-match" }
  expiresAt: string;      // ISO8601 UTC
};
```

### ② PUT 업로드 (GCS 직접, envelope 아님)

- `uploadUrl`로 이미지 바이너리를 **PUT**.
- 응답의 **`uploadHeaders`를 하나도 빠짐없이 그대로** 실어야 함. 빠지면 GCS `400 MalformedSecurityHeader`.
- `x-goog-if-generation-match: 0` → 같은 위치에 파일이 이미 있으면 `412 Precondition Failed`.

### ③ 연결

- 업로드 끝난 `objectKey`를 Recipe 생성/수정의 `coverImageKey`, CookHistory 생성의 `photoKey`로 전달.
- **수정 시 기존과 같은 key를 다시 보내면** 소비 도메인이 "동일 → 이미지 작업 스킵"으로 처리(정상).

**purpose별 prefix**: `RECIPE_COVER`→`recipe-covers`, `COOK_HISTORY_PHOTO`→`cook-history`, `INGESTION_INPUT`→`ingestion-inputs`.
**에러**: `400 REQUEST_VALIDATION_FAILED`(필드 누락/미지원 contentType) · `400 INVALID_REQUEST_FORMAT`(정의 안 된 purpose) · `401`.

---

## 3. 레시피 — `Recipe`

`categoryCode`: `KOREAN | WESTERN | CHINESE | JAPANESE | BUNSIK | ASIAN | OTHER`

**도메인 에러코드**

| code | HTTP | 언제 |
|---|---|---|
| `RECIPE_NOT_FOUND` | 404 | 없거나 타인 소유 |
| `RECIPE_INGREDIENT_INVALID` | 400 | 보낸 `ingredientId`가 마스터에 없음 |
| `RECIPE_COVER_INVALID` | 400 | coverImageKey가 없음/남의것/다른용도/미업로드 |
| `RECIPE_COVER_ALREADY_USED` | 409 | 이미 연결된 coverImageKey |

### `POST /api/v1/recipes` — 생성 → **201** `{ recipeId }`

```ts
type RecipeCreateRequest = {
  title: string;              // 필수, ≤255
  categoryCode: RecipeCategory; // 필수
  cookTimeMinutes?: number;   // 옵션, ≥1
  servings?: number;          // 옵션, ≥1 (미전달 시 서버 1)
  memo?: string;              // 옵션
  coverImageKey?: string;     // 옵션, 업로드 objectKey
  ingredients?: {
    ingredientId?: number;    // 옵션(마스터 참조). 없으면 자유 입력 재료
    name: string;             // 필수(ingredientId 있어도 필수) — 스냅샷
    amountText?: string;      // 옵션 "300g"
  }[];
  steps?: { content: string }[]; // 배열 순서 = 표시 순서
};
// Response data: { recipeId: number }
```
- `registrationMethod`는 서버가 `MANUAL`로 결정(요청에 없음). Ingestion(URL/이미지 분석)은 아직 미구현.
- 에러: `400 REQUEST_VALIDATION_FAILED` · `400 RECIPE_INGREDIENT_INVALID` · `400 RECIPE_COVER_INVALID` · `409 RECIPE_COVER_ALREADY_USED`.

### `GET /api/v1/recipes` — 목록(본인) → **200**

**Query**: `page`(기본 0, ≥0) · `size`(기본 20, 1~100) · `sort`(`LATEST`|`OLDEST`, 기본 LATEST)

```ts
type RecipeListResponse = {
  totalCount: number; // 전체 결과 수(페이지 크기 아님)
  recipes: {
    recipeId: number;
    title: string;
    categoryCode: RecipeCategory;
    coverImageUrl: string | null;   // 서명 URL, 없으면 null
    ingredientNames: string[];      // 없으면 []
  }[];
};
```
- 카드 전용 필드만(memo/steps/source/cookTime/servings는 상세 전용). 검색·필터 없음.
- 에러: `400 REQUEST_VALIDATION_FAILED`(page<0/size 범위 밖) · `400 INVALID_REQUEST_FORMAT`(sort 오타/page 숫자 아님).

### `GET /api/v1/recipes/{recipeId}` — 상세 → **200**

```ts
type RecipeDetailResponse = {
  recipeId: number;
  title: string;
  categoryCode: RecipeCategory;
  coverImageUrl: string | null;
  cookTimeMinutes: number | null;
  servings: number;               // non-null
  memo: string | null;
  ingredients: {
    ingredientId: number | null;  // 마스터에서 고른 것만, 아니면 null (PATCH 재전송용)
    name: string;
    amountText: string;           // 없으면 빈 문자열/null
  }[];
  steps: { content: string }[];
  source: null;                   // Ingestion 전까지 항상 null
};
```
- 에러: `404 RECIPE_NOT_FOUND`.

### `PATCH /api/v1/recipes/{recipeId}` — 부분 수정 → **200** `data: null`

**3-state 규칙**:
- 필드 **미전달** → 유지 · 명시적 **`null`** → 제거(nullable 단일 필드) · 값 → 변경.
- `ingredients`/`steps`: 전달하면 **전체 교체**, `[]`이면 **전체 삭제**.
- `title`/`categoryCode`/`servings`에 명시적 `null` 금지(위반 시 400).
- `coverImageKey`: 미전달 유지 · `null` 대표이미지 제거 · 새 key 교체 · **기존과 같은 key면 스킵**.

```ts
// 예: 제목·메모(제거)·재료(교체)만
{ title: "새 제목", memo: null, ingredients: [{ name: "양파", amountText: "1개" }] }
```
- 에러: `400 REQUEST_VALIDATION_FAILED`(본문 없음/빈 객체 `{}`/검증위반) · `404 RECIPE_NOT_FOUND` · `400 RECIPE_INGREDIENT_INVALID` · `400 RECIPE_COVER_INVALID` · `409 RECIPE_COVER_ALREADY_USED`.

### `DELETE /api/v1/recipes/{recipeId}` — 삭제 → **200** `data: null`

- 재료·조리순서·**조리이력**·대표/완성 이미지까지 함께 영구 삭제. 저장소 삭제 실패해도 200.
- 에러: `404 RECIPE_NOT_FOUND`.

---

## 4. 요리 이력 — `Cooking` (레시피 하위 중첩)

경로가 레시피에 중첩된다: `/api/v1/recipes/{recipeId}/cook-histories`.

**도메인 에러코드**: `COOK_HISTORY_PHOTO_INVALID`(400) · `COOK_HISTORY_PHOTO_ALREADY_USED`(409) · (레시피 없음/타인 → `RECIPE_NOT_FOUND` 404 재사용).

### `POST /api/v1/recipes/{recipeId}/cook-histories` — 요리 완료 기록 → **201** `data: null`

```ts
{ photoKey?: string; memo?: string } // 둘 다 옵션, 빈 객체 {} 도 유효
```
- `cookedAt`은 **서버가 처리 시점으로** 기록(요청에 없음). 생성 식별자 반환 안 함.
- 에러: `404 RECIPE_NOT_FOUND` · `400 COOK_HISTORY_PHOTO_INVALID` · `409 COOK_HISTORY_PHOTO_ALREADY_USED` · `400 INVALID_REQUEST_FORMAT`(본문 자체가 없음 — 빈 `{}`는 OK).

### `GET /api/v1/recipes/{recipeId}/cook-histories` — 이력 조회 → **200**

⚠️ `data`가 **배열 그 자체** (객체 래핑 없음):
```ts
type CookHistoryResponse = {
  cookedAt: string;        // ISO8601 UTC
  photoUrl: string | null; // 서명 URL(60분), 없으면 null
  memo: string | null;
}[];
```
- `cookedAt DESC` 정렬. 식별자(id) 노출 안 함. 이력 없으면 `[]`.
- 에러: `404 RECIPE_NOT_FOUND`.

---

## 5. 재료 마스터 — `Ingredient`

읽기 전용, 87개 고정. 서버 페이지네이션·검색·필터 없음(검색은 클라이언트가 `name`/`aliases`로).

### `GET /api/v1/ingredients` — 활성 재료 전체 → **200**

```ts
type IngredientListResponse = {
  ingredients: {
    ingredientId: number;      // Recipe 저장 시 ingredientId로 전송
    code: string;              // "MET001" — 아이콘 조회 키
    name: string;              // 표시명(괄호/슬래시 그대로)
    categoryCode: IngredientCategory;
    aliases: string[];         // 검색어(표시용 아님), 없으면 []
  }[];
};
```
- 정렬: 카테고리 enum 순(`MEAT→SEAFOOD→VEGETABLE→SAUCE→ETC`) → 같은 카테고리 내 `code` 오름차순. **배열 순서 그대로 사용**.
- 에러: 고유 에러 없음(`401`만). 비어도 `200 + { ingredients: [] }`.

---

## 5-1. 보유 재료 — My Ingredient

> ⚠️ **백엔드 `feat/73-get-my-ingredients` 기준 (아직 origin/main 미머지).** 머지·배포 전까지 로컬 백엔드를 해당 브랜치로 띄워야 동작. 마스터(`GET /ingredients`)와 다른 소스 — "내가 등록한 재료"만. 인증 필요.

응답 항목(`UserIngredient`)은 마스터와 달리 `iconUrl`이 항상 채워지고 `code`/`aliases`가 없다. 조회·등록 응답이 공유.

```ts
type UserIngredient = {
  ingredientId: number;
  name: string;
  categoryCode: IngredientCategory;
  iconUrl: string;            // 항상 채워짐(백엔드가 iconBaseUrl로 생성)
};
```

### `GET /api/v1/users/me/ingredients?searchQuery=` — 내 보유 재료 → **200**

```ts
type MyIngredientListResponse = { ingredients: UserIngredient[] };
```
- `searchQuery`(옵션): 재료명 부분검색. 빈 값/생략 = 전체.
- 정렬: 카테고리 순 + 이름 가나다순. 보유한 비활성 재료도 포함.

### `POST /api/v1/users/me/ingredients` — 보유 재료 추가 → **200**

```ts
type AddMyIngredientsRequest = { ingredientIds: number[] };   // 1개 이상, 양수
type AddMyIngredientsResponse = { ingredients: UserIngredient[] }; // 신규만(이미 보유는 무시), 전부 보유면 []
```
- 에러: `400`(요청값 오류/존재하지 않거나 비활성인 신규 재료) · `401`(인증 실패).

---

## 6. Enum 요약 (TS 정의용)

```ts
type RecipeCategory = 'KOREAN' | 'WESTERN' | 'CHINESE' | 'JAPANESE' | 'BUNSIK' | 'ASIAN' | 'OTHER';
type RecipeListSort = 'LATEST' | 'OLDEST';
type IngredientCategory = 'MEAT' | 'SEAFOOD' | 'VEGETABLE' | 'SAUCE' | 'ETC';
type UploadPurpose = 'RECIPE_COVER' | 'COOK_HISTORY_PHOTO' | 'INGESTION_INPUT';
type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp';
```

**nullable 함정**: `RecipeDetail.servings`는 non-null, 그러나 `cookTimeMinutes`/`memo`/`coverImageUrl`/`source`는 nullable. 모든 `coverImageUrl`/`photoUrl` nullable. `GET cook-histories`는 `data`가 배열.

---

## 7. 프론트 연동 메모

### 화면 ↔ API 매핑

| 화면 | API |
|---|---|
| 로그인(`login`) | `POST /auth/social-login` → 토큰 저장 or `terms`로 |
| 나의 레시피(`recipes`) | `GET /recipes?page&size&sort` |
| 레시피 상세(`recipe-view`/`recipe-detail`) | `GET /recipes/{id}` |
| 레시피 등록(`add-recipe*`) | (이미지 있으면) `POST /uploads/images`→PUT→ `POST /recipes` |
| 요리 완료(`cook-complete`) | (사진) 업로드 → `POST /recipes/{id}/cook-histories` |
| 재료관리(`ingredients`) | `GET /users/me/ingredients` (내 보유 재료만) |
| 재료 추가(`fridge`) | `GET /ingredients`(마스터) − 보유분 제외 → `POST /users/me/ingredients` |

### React Query 제안 (이미 `@tanstack/react-query` 설정됨)

```ts
// queryKey 컨벤션
['recipes', { page, sort }]        // 목록
['recipe', recipeId]               // 상세
['cook-histories', recipeId]       // 이력
['ingredients']                    // 마스터(거의 불변 → staleTime 크게)
['my-ingredients', searchQuery]    // 내 보유 재료

// 변이 후 무효화
// 레시피 생성/수정/삭제 → invalidate ['recipes'] (+ ['recipe', id])
// 요리기록 생성 → invalidate ['cook-histories', id]
// 보유 재료 추가 → invalidate ['my-ingredients']
```

- API 클라이언트: envelope를 벗겨 `data`만 반환하고, `status>=400`이면 `data.code`로 에러를 던지는 래퍼를 하나 두면 편하다.
- 토큰: `accessToken`은 요청 헤더, 만료 시 `refreshToken` 재발급 흐름은 **백엔드에 refresh 엔드포인트가 확인되면** 추가(현재 미확인).
