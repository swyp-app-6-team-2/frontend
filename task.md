# task.md — 로드맵 & 태스크

> 실행 계획. 제품 정의는 [spec.md](./spec.md), 배경은 [context.md](./context.md).
> 상태: ✅ 완료 · 🔨 진행중 · ⬜ 예정

## ✅ 완료 (기반)

- [x] 다크 테마 디자인 토큰 (global.css / tailwind.config.js / tokens.ts 동기화)
- [x] 공통 UI 컴포넌트 11개 (`@/components/ui`, 배럴 export)
- [x] 루트 Stack + `(tabs)` 그룹 네비 구조 (상세 화면 push + back)
- [x] 워킹 스켈레톤 — 전 화면 stub + 플로우 연결 (딥링크로 걸어짐)
- [x] EAS 프로젝트 연결 + 앱 정체성 확정 (별따먹자 / com.byeolddameokja.app)

## 🔨 지금 하는 것

- [ ] 프로젝트 문서 세팅 (spec/task/context/CLAUDE) ← **이 작업**
- [ ] 확정 디자인(Figma 619:9650) 화면별 실측 스펙 확보

## ⬜ P0 — 핵심 루프 (레시피 저장 → 요리 완료)

각 stub → 확정 디자인 반영 실제 구현:
- [ ] `/recipes` 나의 레시피 목록 (카드/리스트, 검색·필터 UI)
- [ ] `/add-recipe` 등록 방법 선택 (bottom sheet 형태 검토)
- [ ] `/add-recipe-manual` 직접 입력 폼 (이름·카테고리·시간·제공량·재료·조리순서)
- [ ] `/recipe-detail` 내용 확인 (AI 정리 결과 편집) — 저장 액션
- [ ] `/recipe-view` 레시피 상세 (원본 링크·재료·조리순서·"해먹었어요")
- [ ] `/cook-complete` ⭐요리 완료 기록 (별 점등 애니메이션 — 앱 정체성, 공들일 것)

## ⬜ P1 — 등록 경로 확장 + 재료 관리

- [ ] `/add-recipe-url` URL 입력 + 붙여넣기 UX
- [ ] `/add-recipe-loading` AI 분석 로딩 (단계별 진행 표시)
- [ ] `/add-recipe-image` 캡쳐 이미지 업로드 → OCR
- [ ] `/url-failed`, `/ocr-failed` 실패 안내 → 직접 입력 전환
- [ ] `/fridge` 내 냉장고 (재료·유통기한 임박 D-day)
- [ ] `/add-ingredient` 재료 추가 (검색·카테고리 533종·담기)
- [ ] `/slot-full` 저장 슬롯 초과(50/50) 안내

## ⬜ P2 — 셸 & 나머지

- [ ] **실제 4탭 탭바** (`홈·재료관리·나의레시피·마이`) — NativeTabs에 4탭 + 아이콘 에셋
- [ ] `/home` 홈 대시보드 (별 진행도·추천·임박 요약)
- [ ] `/my` 마이 (슬롯 사용량·설정), `/terms` 약관
- [ ] 온보딩(요리 취향 선택) — 619:9650 확인 후 포함 여부 결정

## ⬜ 인프라 (UI와 병행 가능)

- [ ] **데이터 레이어** — 흩어진 mock(RECIPES/INGREDIENTS/STEPS…)을 `src/types` + `src/api`(+ TanStack Query / Zustand)로
- [ ] 로딩/빈/에러 상태 공통 처리
- [ ] AI 분석 파이프라인 (백엔드 계약 협의 후)
- [ ] 아이콘 시스템 도입 (현재 글리프/이모지 임시)
- [ ] 첫 EAS 빌드 (development/preview) + Apple 자격증명

## 백로그 / 정리 필요

- [ ] `my-trade`("나의 거래") — 확정 플로우에 없는 orphan 화면. 제거 또는 용도 재정의.
- [ ] `(tabs)/index.tsx` 개발용 허브 → 실제 홈/탭으로 대체되면 정리
- [ ] `Screen.contentClassName` 클래스 충돌(twMerge 미도입) — 오버라이드 필요해지면 대응
- [ ] `safeBottom` 고정값(26) 기기 편차

## 팀/배포 미결

- [ ] main 직접 vs PR 브랜치 전략 확정 후 push
- [ ] 담당자에게 앱 이름·번들 ID 전달 → App Store Connect 앱 생성
