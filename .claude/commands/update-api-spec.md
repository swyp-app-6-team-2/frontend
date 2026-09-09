---
description: 백엔드 레포 기준으로 api-spec.md와 src/lib/api 타입을 최신 계약으로 갱신
---

백엔드 레포 `swyp-app-6-team-2/backend`(Spring Boot)를 다시 읽어, 프론트의 API 스펙 문서(`api-spec.md`)와 API 타입(`src/lib/api/types.ts`)을 **최신 계약**에 맞춰 갱신해라.

## 절차

1. **백엔드 읽기** — `gh`는 이미 인증돼 있다. 파일 raw는:
   `gh api "repos/swyp-app-6-team-2/backend/contents/<path>" -H "Accept: application/vnd.github.raw"`
   패키지 루트는 `src/main/java/com/star_pick/starpick/`. **파일은 하나씩 개별 호출**(멀티라인 셸 루프는 깨진다). 먼저 트리로 무엇이 있는지 확인:
   `gh api "repos/swyp-app-6-team-2/backend/git/trees/HEAD?recursive=1"`
   - `docs/specs/*.md` — recipe·ingredient·cooking·upload, 그리고 **새로 생긴 도메인 문서 전부**(auth·discovery·ingestion·billing 등이 생겼는지 확인)
   - 각 도메인의 `controller/*Controller.java`, `controller/request/*`, `controller/response/*`, `exception/*ErrorCode.java`
   - 공통: `global/ApiResponse.java`, `global/exception/CommonErrorCode.java`, `global/security/config/SecurityConfig.java`
   - 인증: `domain/auth/controller/AuthController.java` + `domain/auth/dto/*`
   컨트롤러의 `@GetMapping/@PostMapping/@PatchMapping/@DeleteMapping`, `@RequestParam`(이름·기본값·제약), `@PathVariable`, `@Valid`, 반환 status(200/201)를 보고 **정확한 method·path·파라미터·필드명·enum 값**을 확정한다. 추측 금지.

2. **대조** — 현재 `api-spec.md`(레포 루트)와 비교해 **추가·변경·삭제**된 엔드포인트·요청/응답 필드·enum·에러코드를 찾는다.

3. **문서 갱신** — `api-spec.md`를 고친다. 상단의 "기준일"을 **오늘 날짜**로 바꾼다. 기존 문서의 구조·톤·섹션 순서를 유지하고, 새 도메인이 생겼으면 섹션을 추가한다.

4. **타입 동기화** — 계약이 바뀌었으면 `src/lib/api/types.ts`와 영향받는 `src/lib/api/endpoints.ts`·`src/hooks/use-api.ts`도 함께 고친다. 그다음 `pnpm typecheck`로 확인.

5. **보고** — 무엇이 어떻게 바뀌었는지 요약하고, 백엔드에 아직 없어 프론트가 기다려야 하는 항목(예: 회원가입 완료 API, refresh 토큰 엔드포인트, provider 값)을 명시한다.

## 인자

`$ARGUMENTS` 가 있으면 그 도메인만 범위로 삼는다 (예: `/update-api-spec recipe` → recipe 관련 컨트롤러/DTO/문서 섹션만 갱신). 없으면 전체를 훑는다.
