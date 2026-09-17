# API 스펙 (프론트 연동용)

> 백엔드 레포 [`swyp-app-6-team-2/backend`](https://github.com/swyp-app-6-team-2/backend)(Spring Boot) 기준.
> 백엔드 `docs/specs/*.md` + 컨트롤러/DTO에서 추출. **기준일 2026-09-17. (BE main ca3c5ad)**
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
(provider 값: `KAKAO | NAVER | GOOGLE | APPLE`.)

### `POST /api/v1/auth/signup` — 신규 가입 완료 (인증 불필요)
`social-login`이 준 `signupToken` + 약관 동의로 정식 가입 → 토큰 발급.
```ts
Request  = { signupToken; ageOver14Agreed; serviceTermsAgreed; privacyAgreed; marketingAgreed; serviceAgreed } // boolean 5
Response = { userId; accessToken; refreshToken }   // 200
```

### `POST /api/v1/auth/token/refresh` — 토큰 재발급 (인증 불필요)
```ts
Request = { refreshToken }; Response = { accessToken; refreshToken }  // 이전 refreshToken은 폐기(회전)
```
프론트 `client.ts`가 401 시 자동 호출(single-flight).

### `POST /api/v1/auth/logout` — 로그아웃 (인증 필요) → **200** `data: null`
서버 세션/토큰 무효화. 프론트는 이후 로컬 토큰(`clearTokens`)도 비운다.

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

**purpose별 prefix**: `PROFILE_IMAGE`→`profile-images`, `RECIPE_COVER`→`recipe-covers`, `COOK_HISTORY_PHOTO`→`cook-history`, `INGESTION_INPUT`→`ingestion-inputs`, `INQUIRY_ATTACHMENT`→`inquiry-attachments`.
**에러**: `400 REQUEST_VALIDATION_FAILED`(필드 누락/미지원 contentType) · `400 INVALID_REQUEST_FORMAT`(정의 안 된 purpose) · `401`.

---

## 2-1. 레시피 분석 — `Ingestion`

URL·이미지를 AI로 분석해 레시피 초안을 만드는 비동기 작업. 구현·배포 완료(09-14). 인증 필요.
흐름: **작업 생성 → 폴링 → 초안 확인·보정 → `POST /recipes`에 `ingestionJobId` 실어 저장**(§3 생성 참고).
이미지 입력은 먼저 `POST /uploads/images`에 `purpose: "INGESTION_INPUT"`로 올린 `objectKey`들을 넘긴다.

### `POST /api/v1/ingestion-jobs` — 분석 작업 생성 → **201** `{ ingestionJobId }`

```ts
// URL·IMAGE 중 정확히 하나(@AssertTrue). 앱 타입은 XOR로 강제.
type IngestionJobCreateRequest =
  | { inputType: 'URL'; url: string }
  | { inputType: 'IMAGE'; inputImageKeys: string[] }; // INGESTION_INPUT 업로드 objectKey들
// Response data: { ingestionJobId: number }
```

### `GET /api/v1/ingestion-jobs/{ingestionJobId}` — 작업 조회(폴링) → **200**

```ts
type IngestionJobResponse = {
  ingestionJobId: number;
  inputType: 'URL' | 'IMAGE';
  status: 'QUEUED' | 'PROCESSING' | 'RESULT_READY' | 'FAILED' | 'EXPIRED';
  previewImageUrl: string | null;      // 분석 원본 미리보기(확인 화면 대표사진 자리)
  result: RecipeDraft | null;          // RESULT_READY일 때만. 아래
  failureCode: IngestionFailureCode | null; // FAILED일 때만
};
// AI 초안 — 못 채운 필드는 null(사용자가 확인 화면에서 보정)
type RecipeDraft = {
  title: string | null;
  categoryCode: RecipeCategory | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  ingredients: { ingredientId: number | null; name: string; amountText: string | null }[];
  steps: { content: string }[];
};
type IngestionFailureCode =
  | 'SOURCE_UNAVAILABLE'      // 링크/이미지를 열 수 없음
  | 'CONTENT_NOT_RECOGNIZED'  // 재료·조리순서를 못 찾음
  | 'MULTIPLE_RECIPES'        // 레시피가 여러 개 감지
  | 'PROCESSING_FAILED';      // 분석 중 오류
```

- `QUEUED`/`PROCESSING` 동안 폴링(앱 2초 간격), terminal(`RESULT_READY`/`FAILED`/`EXPIRED`)이면 정지.
- 작업은 **생성 24시간 뒤 만료**(`EXPIRED`). `POST /recipes`에 `ingestionJobId`로 소비하면 그 시점에 확정.
- `result.ingredients[].ingredientId`는 마스터 매칭분만 채워지며, 레시피 저장 시 그대로 실어 보내면 재료 기반 추천에 잡힌다.

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
| `RECIPE_SLOT_EXCEEDED` | 409 | 레시피 저장 슬롯 초과(별 슬롯 세부는 별도 전달) |

### `POST /api/v1/recipes/recommendations` — 추천 → **200** (홈 "랜덤/재료 기반")
```ts
Request  = { recommendationMode: 'RANDOM' | 'INGREDIENT_BASED'; previousRecipeId?: number } // previousRecipeId: "다른 거" 시 직전 제외
Response = { recipeId; title; category: RecipeCategory; thumbnailUrl: string|null; mainIngredients: string[] }
```

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
  ingestionJobId?: number;    // 옵션. 분석(URL/이미지)으로 만든 레시피면 그 Job id. → 2-1. Ingestion
};
// Response data: { recipeId: number }
```
- `registrationMethod`는 서버가 결정(요청에 없음): `ingestionJobId` 없으면 `MANUAL`, 있으면 해당 Job의 `URL`/`IMAGE`.
- **`ingestionJobId`를 보내면**: 서버가 원본 정보(source_url·원본 사진 Key·원본 대표 이미지)를 붙이고 Job을 소비한다. 없으면 400이 아니라 조용히 `MANUAL`로 저장된다(원본·중복방지 없음).
- **재요청 멱등**: 같은 `ingestionJobId`로 다시 생성하면 `409`가 아니라 **200 + 기존 `recipeId`**를 돌려준다(중복 저장 방지).
- 에러: `400 REQUEST_VALIDATION_FAILED` · `400 RECIPE_INGREDIENT_INVALID` · `400 RECIPE_COVER_INVALID` · `409 RECIPE_COVER_ALREADY_USED` · `409 RECIPE_SLOT_EXCEEDED`.

### `GET /api/v1/recipes` — 목록·검색·필터(본인) → **200**

**Query**: `page`(기본 0, ≥0) · `size`(기본 20, 1~100) · `sort`(`LATEST`|`OLDEST`, 기본 LATEST)
- `searchQuery`(옵션, ≤255자): 제목 부분검색. 앞뒤 공백·영문 대소문자 무시. 빈 값 무시.
- `category`(옵션, 반복, ≤100개): 선택 카테고리 중 하나라도 일치(OR). 예 `category=KOREAN&category=CHINESE`.
- `ingredientName`(옵션, 반복, ≤255자·≤100개): 선택 재료명을 **모두 포함**(AND). 공백·영문 대소문자 제외 정확 일치. 보유 여부는 확인 안 함. 예 `ingredientName=두부&ingredientName=대파`.
- 세 조건은 함께 적용(AND). `totalCount`는 검색·필터 적용 후 전체 결과 수.

```ts
type RecipeListResponse = {
  totalCount: number; // 전체 결과 수(페이지 크기 아님)
  recipes: {
    recipeId: number;
    title: string;
    categoryCode: RecipeCategory;
    coverImageUrl: string | null;   // 서명 URL, 없으면 null
    thumbnailUrl: string | null;    // 분석 레시피 원본 썸네일. coverImageUrl 없을 때 카드 폴백
    ingredientNames: string[];      // 없으면 []
  }[];
};
```
- 카드 전용 필드만(memo/steps/source/cookTime/servings는 상세 전용).
- 분석(URL/이미지) 레시피는 `coverImageUrl` 대신 `thumbnailUrl`만 올 수 있으므로 카드에서 `coverImageUrl ?? thumbnailUrl`로 폴백한다.
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
  // 분석 레시피면 객체, 직접 입력이면 null. **객체는 항상 truthy** — "원본 보기" 노출은
  // source 유무가 아니라 originalUrl 유무로 판단할 것(그래야 IMAGE 레시피에 안 뜬다).
  source: {
    sourceType: 'URL' | 'IMAGE';
    originalUrl: string | null;   // URL 분석이면 원본 링크, IMAGE면 null
    thumbnailUrl: string | null;  // 원본 대표 이미지(coverImageUrl 없을 때 폴백)
  } | null;
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

읽기 전용, 104개 고정. 서버 페이지네이션·검색·필터 없음(검색은 클라이언트가 `name`/`aliases`로).

### `GET /api/v1/ingredients` — 활성 재료 전체 → **200**

```ts
type IngredientListResponse = {
  ingredients: {
    ingredientId: number;      // Recipe 저장 시 ingredientId로 전송
    code: string;              // "MET001" — 아이콘 조회 키
    name: string;              // 표시명(괄호/슬래시 그대로)
    categoryCode: IngredientCategory;
    aliases: string[];         // 검색어(표시용 아님), 없으면 []
    iconUrl: string;           // 재료 아이콘(webp). 항상 내려간다
  }[];
};
```
- 정렬: 카테고리 enum 순(`MEAT→SEAFOOD→VEGETABLE→SAUCE→ETC`) → 같은 카테고리 내 **이름 가나다순**. **배열 순서 그대로 사용**.
- 에러: 고유 에러 없음(`401`만). 비어도 `200 + { ingredients: [] }`.

---

## 5-1. 보유 재료 — My Ingredient

> 마스터(`GET /ingredients`)와 다른 소스 — "내가 등록한 재료"만. 인증 필요. (origin/main 머지·배포 완료.)

응답 항목(`UserIngredient`)은 마스터(`MASTER`)와 커스텀(`CUSTOM`, 직접 입력)을 같은 형태로 표현한다. 조회·등록·커스텀등록 응답이 공유.

```ts
type IngredientType = 'MASTER' | 'CUSTOM';
type UserIngredient = {
  ingredientType: IngredientType;
  ingredientId: number | null;        // MASTER만. CUSTOM은 null
  customIngredientId: number | null;  // CUSTOM만. MASTER는 null
  name: string;
  categoryCode: IngredientCategory | null; // CUSTOM은 null
  iconUrl: string | null;             // CUSTOM은 null(화면 폴백 이모지)
};
```

### `GET /api/v1/users/me/ingredients?searchQuery=` — 내 보유 재료 → **200**

```ts
type MyIngredientListResponse = { ingredients: UserIngredient[] };
```
- `searchQuery`(옵션): 재료명 부분검색. 빈 값/생략 = 전체.
- 정렬: 마스터 재료를 카테고리 순 + 이름 가나다순으로 먼저 놓고, 그 **뒤에 커스텀(직접 입력) 재료를 이름·id순**으로 붙인다. 보유한 비활성 재료도 포함.

### `POST /api/v1/users/me/ingredients` — 보유 재료 추가 → **200**

```ts
type AddMyIngredientsRequest = { ingredientIds: number[] };   // 1개 이상, 양수
type AddMyIngredientsResponse = { ingredients: UserIngredient[] }; // 신규만(이미 보유는 무시), 전부 보유면 []
```
- 에러: `400`(요청값 오류/존재하지 않거나 비활성인 신규 재료) · `401`(인증 실패).

### `POST /api/v1/users/me/ingredients/custom` — 커스텀(직접 입력) 재료 추가 → **200**

```ts
type CustomIngredientCreateRequest = { name: string };  // 앞뒤 공백 제거 후 1~50자
// 응답은 UserIngredient 단건(항상 ingredientType='CUSTOM').
```
- 마스터·기존 커스텀과 이름이 같아도 **새 항목으로 등록**(중복 허용).
- 에러: `400`(재료명 누락·공백·길이 초과) · `401`(인증 실패).

---

## 5-2. 사용자 / 프로필 / 온보딩 — `User`

### `GET /api/v1/users/me` — 내 정보 → **200**
```ts
{ userId; nickname: string|null; profileImageUrl: string|null;
  remainingRecipeSlots: number; recipeSlotLimit: number; cumulativeRecipeCount: number }
```
신규 유저는 nickname/profileImageUrl 이 null. **provider 필드는 아직 없음** → 마이 배지는 로그인 시 저장값 폴백.

### `PATCH /api/v1/users/me/profile` — 프로필 수정 → **200**
```ts
// profileImageKey: 생략=유지 / null=삭제 / 값=PROFILE_IMAGE 업로드 objectKey로 교체
Request  = { nickname: string /*1~6자*/; profileImageKey?: string | null }
Response = { userId; nickname: string|null; profileImageUrl: string|null }
```

### `GET /api/v1/users/me/onboarding` — 온보딩 필요 여부 → **200**
### `POST /api/v1/users/me/onboarding/complete` — 온보딩 완료 → **200**
둘 다 `{ onboardingRequired: boolean; onboardingCompletedAt: string|null }`.

### `DELETE /api/v1/users/me` — 회원 탈퇴 → **200** `data: null`
- 계정·사용자 데이터를 삭제한다(복구 불가). 중간 실패는 서버가 자동 복구. 외부 소셜 연결 해제는 안 함.
- 성공 후 프론트는 로컬 토큰 삭제·캐시 비움 → 로그인 화면으로.

---

## 6. 문의 — `Inquiry`

모든 API 인증 필요. 첨부는 `POST /uploads/images`에 `purpose: "INQUIRY_ATTACHMENT"`로 발급받아 올린 objectKey들(최대 5장). 표시 이름·순서는 앱이 보유(서버는 코드만).

### `POST /api/v1/inquiries` — 문의 접수 → **201** `{ inquiryId }`

```json
{ "type": "SLOT", "title": "…", "content": "…", "attachmentKeys": ["inquiry-attachments/12/a.jpg"] }
```

- `title` 1~255자, `content` 1~2,000자. `attachmentKeys` 생략/`null`이면 `[]`.
- 에러: 형식/없는 type `400 INVALID_REQUEST_FORMAT` · 검증 `400 REQUEST_VALIDATION_FAILED`(+`data.errors`, 중복은 `attachmentKeysUnique`) · 첨부 key 무효 `400 INQUIRY_ATTACHMENT_INVALID` · 이미 사용된 key `409 INQUIRY_ATTACHMENT_ALREADY_USED`.

### `GET /api/v1/inquiries?page=0&size=20` — 내 문의 목록 → **200**

```json
{ "totalCount": 2, "inquiries": [
  { "inquiryId": 31, "type": "SLOT", "title": "…", "content": "…", "status": "ANSWERED", "createdAt": "2026-09-15T06:10:00Z" }
] }
```

- 최근 1년(`Asia/Seoul`), `createdAt DESC, id DESC`. 정렬 파라미터 없음. `page`≥0 기본 0, `size` 1~100 기본 20.
- `content` 전체를 준다(미리보기 길이는 앱). 첨부·답변은 목록에 없다. 없으면 `totalCount:0`.

### `GET /api/v1/inquiries/{inquiryId}` — 내 문의 상세 → **200**

```json
{ "inquiryId": 31, "type": "SLOT", "title": "…", "content": "…",
  "attachmentImageUrls": ["https://…"], "status": "ANSWERED",
  "createdAt": "2026-09-15T06:10:00Z",
  "answer": "…", "answeredAt": "2026-09-16T01:20:00Z" }
```

- 답변 전엔 `answer`·`answeredAt`이 `null`(키는 항상 내려온다). `attachmentImageUrls`는 조회 URL(유효 60분), 서명 실패분은 배열에서 빠진다.
- 없음/타인/1년 경과 = `404 INQUIRY_NOT_FOUND`. 비-숫자 id = `400 INVALID_REQUEST_FORMAT`.

---

## 7. 알림 — `Notification`

모든 API 인증 필요. 시간대 칩→설정 변환은 앱이 하고 `PUT`으로 보낸다.

### `GET /api/v1/notification-settings` — 조회 → **200**

```json
{ "enabled": true, "weekdays": ["MONDAY", "FRIDAY"], "timeSlots": [{ "label": "점심 알림", "time": "12:00" }] }
```

설정이 없으면 `{ "enabled": false, "weekdays": [], "timeSlots": [] }`(row 생성 안 함).

### `PUT /api/v1/notification-settings` — 전체 교체 → **200** `data: null`

- 세 필드 모두 필수. **켜져 있어도 `weekdays`·`timeSlots`는 빌 수 있다**(보낼 대상이 없을 뿐).
- `time`은 `"HH:mm"`(24h). 에러: 검증 `400 REQUEST_VALIDATION_FAILED`(label 빈값·255초과, 요일·시각 중복) · 없는 요일·잘못된 time 형식 `400 INVALID_REQUEST_FORMAT`.

### `PUT /api/v1/push-tokens` — 기기 토큰 등록/갱신 → **200** `data: null`

```json
{ "token": "fcm-registration-token", "platform": "IOS" }
```

- `token` 필수·512자 이하, `platform` `IOS`/`ANDROID`. **iOS도 FCM 토큰**(RNFirebase). 재등록은 갱신, 다른 계정 토큰은 현재 계정으로 이동.

### `DELETE /api/v1/push-tokens` — 해제 → **200** `data: null`

```json
{ "token": "fcm-registration-token" }
```

- 내 토큰이면 비활성화. 남의/없는 토큰이어도 `200`(소유 여부 비노출).

### `POST /api/v1/notifications/{notificationId}/open` — 오픈 기록 → **200** `data: null`

- 푸시 탭 시 최초 시각 기록. `notificationId` = 푸시 `data.notificationId`. 없음/타인 = `404 NOTIFICATION_NOT_FOUND`.

---

## 7-1. 광고 보상 슬롯 — `Ad Reward`

보상형 광고(AdMob) 시청 → 레시피 저장 슬롯 지급. 지급 확정은 **Google SSV 서버-서버 콜백**이 하므로, 앱은 세션 발급 → 광고 시청 → 결과 폴링으로 지급을 확인한다. (콜백 `GET /ads/rewards/callback`은 Google 전용, 앱 미사용.)

### `GET /api/v1/ads/rewards/status` — 상태 → **200** (슬롯 지급 안 함)
```ts
{ recipeSlotLimit; remainingRecipeSlots; dailyRewardCount; dailyRewardLimit; reservedCount;
  remainingRewardCount; availableWatchCount; canWatchAd: boolean;
  unavailableReason: 'DAILY_LIMIT_REACHED'|'REWARD_PENDING'|null; quotaDate; resetsAt;
  pendingSessions: { sessionId; status; quotaDate; expiresAt; verificationDeadline }[] }
```

### `POST /api/v1/ads/rewards/sessions` — 시청 세션 발급 → **200** (당일 1회 예약, requestId 멱등)
```ts
Request  = { platform: 'IOS'|'ANDROID'; requestId: string /*≤255, 멱등키*/ }
Response = { sessionId; status; adUnitId; customData /*=sessionId, AdMob customData*/;
             rewardType; rewardAmount; quotaDate; expiresAt; verificationDeadline }
// 409: AD_REWARD_SESSION_PENDING / AD_REWARD_DAILY_LIMIT_REACHED / AD_REWARD_REQUEST_ID_CONFLICT
```

### `GET /api/v1/ads/rewards/sessions/{sessionId}` — 결과 조회(폴링) → **200**
### `POST /api/v1/ads/rewards/sessions/{sessionId}/cancel` — 청구 포기 → **200**
```ts
CancelRequest = { reason: 'LOAD_FAILED'|'USER_DISMISSED'|'USER_ABANDONED' }
Result = { sessionId; status: 'PENDING'|'GRANTED'|'CANCELLED'|'EXPIRED'|'REJECTED';
           reasonCode: string|null; quotaDate; grantedAmount /*GRANTED 아니면 0*/; grantedAt: string|null;
           recipeSlotLimit; remainingRecipeSlots /*최신값*/ }
```

---

## 8. Enum 요약 (TS 정의용)

```ts
type RecipeCategory = 'KOREAN' | 'WESTERN' | 'CHINESE' | 'JAPANESE' | 'BUNSIK' | 'ASIAN' | 'OTHER';
type RecipeListSort = 'LATEST' | 'OLDEST';
type RecommendationMode = 'RANDOM' | 'INGREDIENT_BASED';
type IngredientCategory = 'MEAT' | 'SEAFOOD' | 'VEGETABLE' | 'SAUCE' | 'ETC';
type IngredientType = 'MASTER' | 'CUSTOM';   // 보유 재료 항목 구분(커스텀=직접 입력)
type UploadPurpose = 'PROFILE_IMAGE' | 'RECIPE_COVER' | 'COOK_HISTORY_PHOTO' | 'INGESTION_INPUT' | 'INQUIRY_ATTACHMENT';
type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp';
type InquiryType = 'RECIPE' | 'SLOT' | 'ACCOUNT' | 'NOTIFICATION' | 'BUG' | 'ETC';
type InquiryStatus = 'RECEIVED' | 'ANSWERED'; // answer 유무로 서버가 계산
type Weekday = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
type PushPlatform = 'IOS' | 'ANDROID';
// 광고 보상
type AdRewardPlatform = 'IOS' | 'ANDROID';
type AdRewardCancelReason = 'LOAD_FAILED' | 'USER_DISMISSED' | 'USER_ABANDONED';
type AdRewardSessionStatus = 'PENDING' | 'GRANTED' | 'CANCELLED' | 'EXPIRED' | 'REJECTED';
type AdRewardUnavailableReason = 'DAILY_LIMIT_REACHED' | 'REWARD_PENDING';
```

**nullable 함정**: `RecipeDetail.servings`는 non-null, 그러나 `cookTimeMinutes`/`memo`/`coverImageUrl`/`source`는 nullable. 모든 `coverImageUrl`/`photoUrl` nullable. `GET cook-histories`는 `data`가 배열.

---

## 9. 프론트 연동 메모

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
| 문의하기(`inquiry`) | `GET /inquiries`(내역) · `POST /inquiries`(접수) |
| 문의 상세(`inquiry-detail`) | `GET /inquiries/{id}` |
| 알림 설정(`notifications`) | `GET`·`PUT /notification-settings` · `PUT`·`DELETE /push-tokens`(FCM 토큰) |

### React Query 제안 (이미 `@tanstack/react-query` 설정됨)

```ts
// queryKey 컨벤션
['recipes', { page, sort }]        // 목록
['recipe', recipeId]               // 상세
['cook-histories', recipeId]       // 이력
['ingredients']                    // 마스터(거의 불변 → staleTime 크게)
['my-ingredients', searchQuery]    // 내 보유 재료
['inquiries', { page, size }]      // 문의내역
['inquiry', inquiryId]             // 문의 상세
['notification-settings']          // 알림 설정

// 변이 후 무효화
// 레시피 생성/수정/삭제 → invalidate ['recipes'] (+ ['recipe', id])
// 요리기록 생성 → invalidate ['cook-histories', id]
// 보유 재료 추가 → invalidate ['my-ingredients']
// 문의 접수 → invalidate ['inquiries']
// 알림 설정 저장 → invalidate ['notification-settings']
```

- API 클라이언트: envelope를 벗겨 `data`만 반환하고, `status>=400`이면 `data.code`로 에러를 던지는 래퍼를 하나 두면 편하다.
- 토큰: `accessToken`은 요청 헤더, 만료 시 `refreshToken` 재발급 흐름(`POST /auth/token/refresh`, 위 `1. 인증` 참고)은 **확인됨 + 앱도 이미 구현**(`client.ts` single-flight).
