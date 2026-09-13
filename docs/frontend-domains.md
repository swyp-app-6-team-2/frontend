# 별따먹자 프론트엔드 — 도메인별 구현 문서

작업 현황을 도메인별로 정리한 문서입니다. 각 도메인의 **화면·구현 파일·상태·주요 로직·백엔드 의존**을 담았습니다.

- 스택: Expo SDK 57 · React Native 0.86 · React 19(React Compiler) · expo-router · NativeWind · React Query
- 백엔드: dev / local 두 환경 (`EXPO_PUBLIC_API_BASE_URL`로 전환)
- 상태 표기: ✅ 완료 · 🟡 부분(백엔드 대기) · 🧪 개발용/임시

---

## 1. 인증 (Auth)

소셜 로그인으로 provider 토큰을 받아 백엔드에 넘기고, 우리 서비스용 `accessToken`을 발급받는다.

| 항목 | 파일 | 상태 |
|---|---|---|
| 소셜 로그인 화면(카카오·네이버·구글·애플) | `src/app/login.tsx` | ✅ |
| provider SDK → authToken | `src/lib/social-auth.ts` | ✅ |
| 토큰 저장(인메모리) | `src/lib/api/auth-token.ts` | ✅ |
| 신규/기존 분기 | `src/hooks/use-api.ts` `useSocialLogin` | ✅ |
| 약관 동의(신규 흐름) | `src/app/terms.tsx` | 🟡 |

**핵심 개념**
- **토큰 2종**: `authToken`(구글=idToken, 카카오/네이버=accessToken, provider 발급) → 백엔드 검증 → `accessToken`(우리 백엔드 발급, API 인증용).
- **provider별 검증 방식이 다름**: 카카오/네이버는 백엔드가 provider userinfo API 호출, **구글만** idToken의 `aud`(audience)를 서버 `GOOGLE_CLIENT_ID`와 로컬 대조.
- **구글 audience 이슈**: 앱이 `webClientId`를 주면 `aud=웹 client id`가 되는데 dev 서버 `GOOGLE_CLIENT_ID`가 iOS client id라 401. **현재 iOS는 webClientId 제거로 우회**(`social-auth.ts`). Android는 webClientId 없으면 idToken 자체가 안 나오므로 **서버가 웹 client id로 검증하도록 바뀌어야** iOS·Android 모두 정상.
- **회원가입 완료 API 부재**: 신규 유저는 `signupToken`만 받고 `accessToken`을 못 받는다. `terms.tsx`에 TODO로 연결 지점만 있음.

**🔗 백엔드 대기**
- 회원가입 완료 API (`signupToken` → `accessToken` 교환)
- dev `GOOGLE_CLIENT_ID`를 **웹 client id**(`844378154938-a9pkan…`)로 정렬

---

## 2. 레시피 (Recipe)

레시피 저장·조회·수정·삭제와 "요리 완료" 게이미피케이션.

| 화면/기능 | 파일 | 상태 |
|---|---|---|
| 나의 레시피 목록(검색·필터·정렬) | `src/app/recipes.tsx` | ✅ |
| 레시피 상세(수정하기·삭제·완료하기) | `src/app/recipe-view.tsx` | ✅ |
| 직접 입력 / 수정 겸용 폼 | `src/app/add-recipe-manual.tsx` | ✅ |
| 요리 완료(별 점등 애니메이션) | `src/app/cook-complete.tsx` | ✅ |
| URL·이미지 등록 진입/실패 | `add-recipe-*`, `url-failed`, `ocr-failed` | 🟡 |

**핵심 로직**
- **직접 입력 폼(`add-recipe-manual`)은 create/edit 겸용**. `id` 파라미터가 있으면 `useRecipe(id)`로 기존 데이터를 프리필하고 **PATCH**로 저장(원본 보존). 프리필은 effect가 아니라 **렌더 중 상태 조정 패턴**(react-compiler의 effect-setState 린트 회피).
- **조리시간**: 카테고리 밑 섹션에 시/분 직접 입력 2칸 + 프리셋 칩(`+1분/+5분/…`)이 **누적**으로 더해짐 → `cookTimeMinutes(시×60+분)`로 저장.
- **상세 → 수정하기**: 헤더 버튼 → `/add-recipe-manual?id=` → 프리필 폼. 새 사진 미선택 시 `coverImageKey` 미전달 → 기존 이미지 유지.
- 재료 입력 시 "갖고 있는 재료" 추천 칩, 방법(단계) 추가/순서이동.

**🔗 백엔드 의존**
- 이미지 업로드(GCS) — 대표 사진
- URL/이미지 → AI/OCR 구조화 파이프라인(인제스천)

---

## 3. 재료 (Ingredient)

재료 마스터 목록 조회 + 내 냉장고(보유 재료) 관리.

| 화면/기능 | 파일 | 상태 |
|---|---|---|
| 재료관리(카테고리별 칩, 보유 토글) | `src/app/ingredients.tsx` | ✅ |
| 재료 추가하기(카테고리 칩·3열 카드·다중선택) | `src/app/fridge.tsx` | 🟡 |
| 재료 직접 입력(마스터에 없는 재료) | `src/app/add-ingredient.tsx` | 🟡 |
| 담은 재료 세션 store | `src/lib/my-ingredients.ts` | 🧪 |

**핵심 로직**
- **재료 아이콘**: 백엔드가 재료마다 `iconUrl`(webp 절대 URL)을 내려줌. 구조는 `{iconBaseUrl}/images/ingredients/{iconKey}.webp`이고 `iconKey`는 종류 단위로 공유(닭가슴살·닭다리살 → chicken.webp). 재료관리·재료 추가하기 카드가 이 이미지를 표시하고, **없으면 카테고리 이모지로 폴백**.
- **카테고리 매핑**: `IngredientCategory`(MEAT/SEAFOOD/VEGETABLE/SAUCE/ETC) = 백엔드 enum과 동일, 이모지·라벨은 `Record<>` 타입이라 누락 시 컴파일 에러. (`src/constants/labels.ts`)
- **재료 추가하기**: 카드 탭 다중선택(골드 테두리), 1개+ 선택 시 등록하기 활성. **이미 담은 재료는 목록에서 제외**(세션 store 기준). 등록 → 세션 store에 추가.
- **직접 입력**: "재료가 없어요, 직접 입력할게요" → `/add-ingredient`(이름 입력 → 완료).

**🔗 백엔드 대기**
- 내 재료(냉장고) 저장 API (선택 재료 id 저장) — 현재 세션 메모리(재시작 시 초기화)
- 커스텀 재료 추가 API

---

## 4. 홈 · 게이미피케이션 (Home)

밤하늘 별 = 내 레시피, 요리 완료 시 점등. 추천/슬롯 확장.

| 화면/기능 | 파일 | 상태 |
|---|---|---|
| 홈(별·마스코트·추천 드롭다운) | `src/app/home.tsx` | ✅ |
| 메뉴 추천 팝업(랜덤/내재료) | `src/components/recommend-popup.tsx` | ✅ |
| 슬롯 확장(광고 시청) | `src/app/slot-expand.tsx` | 🟡 |
| 슬롯 추가 성공 팝업 | `src/components/slot-added-popup.tsx` | ✅ |
| 광고 시청 세션 store | `src/lib/slot-ads.ts` | 🧪 |
| 마이페이지 | `src/app/my.tsx` | ✅ |

**핵심 로직**
- **별**: 레시피 수만큼 radial 글로우(`star.png`)를 밤하늘에 뿌림. Figma 스펙대로 **큰별(60px 밝게)/작은별(40px 흐리게)** 랜덤 혼합, 좌우 가장자리에 안 붙게 안쪽(14~70%)에 배치, 천천히 반짝임. 탭하면 해당 레시피 팝업.
- **슬롯 확장 플로우**: 마이 `별 확장` → `/slot-expand`(안내 카드 + 광고 리워드 pill + **광고 보기** 버튼) → 광고 보기 → **홈으로 복귀하며 "슬롯 2개가 추가됐어요!" 팝업**. 하루 한도(3회) 소진 시 버튼 비활성 + "오늘 다 봤어요" 안내(State B). 시청 상태는 `slot-ads` 세션 store로 관리(재진입해도 유지).
- 상단 별 진행도 `5/10`은 아직 하드코딩(목업).

**🔗 백엔드 대기**
- 슬롯 수 / 일일 광고 시청 횟수(날짜 기반 리셋) API — 현재 세션 카운트
- 별 진행도(점등 수/총 슬롯) API
- 광고 SDK 연동

---

## 5. 인프라 · 개발환경 (Infra / DevOps)

API 레이어, 서버 전환, 빌드·배포, 개발용 우회.

| 항목 | 파일/위치 | 상태 |
|---|---|---|
| API fetch 래퍼(envelope·Bearer) | `src/lib/api/client.ts` | ✅ |
| 엔드포인트·타입 계약 | `src/lib/api/endpoints.ts` · `types.ts` | ✅ |
| 로컬/dev 서버 전환 스크립트 | `package.json` `start:local`·`start:dev` | ✅ |
| 개발용 더미토큰 주입 | `src/components/query-provider.tsx` | 🧪 |
| EAS 빌드/배포 | `eas.json` · EAS env | ✅ |

**핵심 개념**
- **서버 전환**: 스크립트가 `EXPO_PUBLIC_API_BASE_URL`을 inline으로 주입. ⚠️ **`.env.local`에 같은 키를 두면 스크립트를 덮어써서 전환이 무력화**되므로 넣지 말 것. 실제 적용값은 콘솔 `[api] BASE=` 로그로 확인.
- **더미토큰 우회**(로그인 없이 인증 API 테스트): 백엔드마다 JWT secret이 달라 서명이 맞는 토큰만 통과. `query-provider`가 호스트에 맞춰 `.env.local`의 로컬/dev 토큰을 `__DEV__`에서 주입. release(데모) 빌드는 `EXPO_PUBLIC_DEMO_TOKEN`(EAS env)이 있을 때만 주입.
- **데모 배포 빌드**: `production` 프로필(EAS env: dev URL + `EXPO_PUBLIC_DEMO_TOKEN`)로 빌드 → App Manager 권한이라 `eas submit` 대신 **Transporter로 수동 업로드** → TestFlight. ⚠️ 데모 종료 후 `EXPO_PUBLIC_DEMO_TOKEN` 제거 필수.

---

## 백엔드 대기 요약

| 도메인 | 필요한 것 |
|---|---|
| 인증 | 회원가입 완료 API · dev `GOOGLE_CLIENT_ID`를 웹 client id로 |
| 레시피 | 이미지 업로드(GCS) · 인제스천(AI/OCR) |
| 재료 | 내 재료(냉장고) 저장 API · 커스텀 재료 추가 |
| 홈 | 슬롯 수/일일 광고 시청·별 진행도 API |

---

## 개발용/임시(🧪) 정리 대상

프로덕션 전 정리하거나 백엔드 연동으로 교체할 항목.

- `query-provider.tsx` 더미토큰 주입 · EAS `EXPO_PUBLIC_DEMO_TOKEN`
- `my-ingredients.ts` · `slot-ads.ts` 세션 store → 서버 상태로 교체
- 홈 별 진행도 `5/10` 하드코딩 → API
- 각 화면의 `TODO`(내 재료 저장, 커스텀 재료, 광고 SDK, 슬롯 백엔드 반영)
