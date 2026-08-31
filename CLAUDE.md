# CLAUDE.md — 에이전트 작업 지침

이 저장소에서 코드를 작성·수정하는 AI 에이전트를 위한 규칙. **작업 전 먼저 읽을 것.**

## 이 프로젝트

**별따먹자** — 레시피 저장·관리 + 요리 완료 시 ⭐별 점등 게이미피케이션 앱 (Expo React Native).

- 무엇을 만드나 → [spec.md](./spec.md)
- 스택·구조·현재 상태 → [context.md](./context.md)
- 무엇부터 하나 → [task.md](./task.md)

세 문서를 먼저 읽고 시작해라. 화면 픽셀 스펙은 **Figma 확정 디자인 `619:9650`**(fileKey `13cTHGZBezIIZI0zKbiFV9`), 플로우는 `499:406`.

@AGENTS.md

## 절대 규칙

- **Expo SDK 57**: API가 크게 바뀌었다. 코드 쓰기 전 https://docs.expo.dev/versions/v57.0.0/ 확인. 기억으로 쓰지 마라.
- **ESLint는 v9 고정.** 10으로 올리지 마라 (eslint-config-expo 57이 깨진다).
- **다크 전용.** 라이트 테마 만들지 마라. 색은 반드시 토큰(`bg-primary`, `text-muted` 등) — 하드코딩 hex(`text-[#fff]`) 금지.
- **디자인 토큰 3소스 동기화**: 토큰 바꾸면 `global.css` + `tailwind.config.js` + `src/constants/tokens.ts` 셋 다 맞춰라.
- 패키지 매니저는 **pnpm**.

## 컨벤션

- **공통 컴포넌트부터 재사용.** `@/components/ui`(AppText·Button·Chip·ListRow·Screen·SearchBar·Section·SectionTitle·Tag·Chevron)를 먼저 확인하고 조합해라. 새로 만들기 전에 있는지 본다.
- **화면은 `Screen`으로 감싼다**: `<Screen title="…" back scroll>…</Screen>` — 배경/safe-area/margin/헤더를 Screen이 처리. 화면에서 `SafeAreaView`/`ScrollView`를 직접 다시 짜지 마라.
- **타이포는 `AppText variant`**: `title`(화면 헤더 24) / `subheading`(22) / `body`(16) / `chip`(14). weight 내장됨.
- **새 화면 추가(2스텝)**: ① `src/app/foo.tsx`에 `<Screen>` ② `src/app/(tabs)/index.tsx` `PAGES`에 한 줄.
- **반복되면 공통화**: 2곳 이상 반복 또는 명백한 프리미티브만 `@/components/ui`로. 단일 사용은 화면 로컬 유지(오버엔지니어링 금지).
- **아이콘 라이브러리 없음**: chevron/검색 등은 글리프·이모지 임시. 새 아이콘도 같은 방식(또는 slot prop). 임의로 SVG 그리지 마라.
- 파일명 kebab-case, 컴포넌트 PascalCase (기존 패턴 따름).

## 명령어 (변경 후 반드시)

```bash
pnpm typecheck      # tsc --noEmit
pnpm lint:fix       # expo lint --fix (prettier 포함)
```
시뮬레이터 확인: `npx expo start --dev-client` 후 `xcrun simctl openurl booted "orca:///<route>"` 로 화면 이동해 육안 검증. **타입/린트만으론 런타임 스타일 버그(예: NativeWind className↔style 충돌)를 못 잡는다 — 화면을 띄워 확인해라.**

## Git

- 팀 저장소(`swyp-app-6-team-2/frontend`). **커밋/푸시는 사용자가 요청할 때만.** main 직접 vs PR 브랜치는 팀 규칙 확인.
- **커밋 메시지 컨벤션: `type: 설명` — 스코프 괄호 금지.** `feat(login):` ❌ → `feat: 로그인 …` ✅. type은 `feat`·`fix`·`chore`·`docs`·`refactor`·`style`·`test`.
- 커밋 메시지 끝에:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

## 하지 마라

- 라이트 테마·하드코딩 색·임의 px(토큰 우선).
- 있는 공통 컴포넌트 두고 새로 만들기.
- Expo v57 문서 확인 없이 API 쓰기.
- 요청 없이 커밋/푸시.
- 확정 안 된 화면을 619:9650 확인 없이 픽셀 확정.
