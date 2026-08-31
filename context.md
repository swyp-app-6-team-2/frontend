# context.md — 프로젝트 오리엔테이션

> 이 저장소에서 작업하기 전에 먼저 읽는 문서. **무엇을·어떻게**는 [spec.md](./spec.md)·[task.md](./task.md), 작업 규칙은 [CLAUDE.md](./CLAUDE.md).

## 한 줄 소개

**별따먹자** — 레시피를 저장·정리하고, 요리를 완료하면 ⭐별에 불이 켜지는 게이미피케이션 레시피 앱.

## 팀 / 저장소

- 팀: SWYP 앱 6기 2팀
- 저장소: `github.com/swyp-app-6-team-2/frontend` (이 repo = 프론트엔드)
- 기본 브랜치: `main` (팀 브랜치/PR 전략은 팀 규칙 확인 필요)

## 앱 정체성 (고정값 — 변경 주의)

| 항목 | 값 |
|---|---|
| 앱 이름 (표시명) | **별따먹자** (`app.json` `expo.name`) |
| iOS 번들 ID / Android 패키지 | **com.byeolddameokja.app** |
| 딥링크 scheme | `orca://` (내부용, 유지) |
| EAS slug | `orca` |
| EAS projectId (빌드 아이디) | `79f3b953-0651-4384-91dd-bc878b19dc19` |
| Expo owner | `leeseunghwan123` |

## 기술 스택

- **Expo SDK 57** (⚠️ API가 많이 바뀜 — [AGENTS.md](./AGENTS.md), 항상 v57 문서 확인)
- React Native 0.86 · React 19 · **React Compiler 켜짐**(`app.json` experiments)
- **expo-router**(파일 기반 라우팅, `typedRoutes` 켜짐)
- **NativeWind v4 + Tailwind v3** — **다크 전용** 디자인 토큰
- react-native-reanimated 4 (press 모션 등)
- 패키지 매니저: **pnpm** · ESLint **v9 고정**(10으로 올리면 eslint-config-expo 57 깨짐)

## 프로젝트 구조

```
src/
  app/                     # expo-router 라우트 (파일 = 화면)
    _layout.tsx            # 루트 Stack (headerShown: false)
    (tabs)/                # 하단 탭 그룹
      _layout.tsx          #   NativeTabs (현재 Home/Explore, → 4탭 예정)
      index.tsx            #   현재 "페이지 허브"(개발용 인덱스)
      explore.tsx
    *.tsx                  # 상세/플로우 화면들 (Stack 위로 push)
  components/ui/           # 공통 컴포넌트 (배럴: index.ts)
  constants/tokens.ts      # JS 토큰 (className 밖: placeholder색·safe-area 등)
  global.css               # 색상 CSS 변수 (다크 토큰)
tailwind.config.js         # 색/타이포/간격/radius 토큰
app.json                   # 앱 정체성 + EAS
```

## 디자인 시스템 (다크 전용)

- 색: `background`(#060A19 navy) · `surface`(#18181B) · `field`(#1E2230) · `primary`(#FFD457 gold) · `primary-subtle`(#FAEECB) · `on-primary`(#694800) · `foreground`(#FFF) · `ink`(#111 라이트 표면 위 텍스트) · `muted`(#A4A4A4) · `disabled`(#3F4250) · `success`(#2FA96B) · `error`(#FF6B5E)
- 타이포(`AppText` variant): `title`(24 Bold, 화면 헤더) · `subheading`(22 Bold) · `body`(16 Medium) · `chip`(14 Regular)
- 레이아웃: margin 20(`px-screen`) · gutter 16 · radius `pill`/`card`(20)
- **세 소스 동기화**: `global.css`(CSS 변수) ↔ `tailwind.config.js` ↔ `tokens.ts`. 하나 바꾸면 셋 다.

## 공통 컴포넌트 (11개, `@/components/ui`)

`AppText` · `Button`(primary/secondary + press 모션) · `Chevron` · `Chip` · `ListRow`(leftIcon/right/showChevron/subtitle) · `Screen`(bg+safe-area+margin+옵션헤더) · `ScreenHeader`(title+back) · `SearchBar`(기본 🔍) · `Section` · `SectionTitle` · `Tag`(onPress/onRemove)

> 아이콘 라이브러리 없음 → chevron/검색 등은 글리프·이모지로 임시 구현. 실제 아이콘 도입은 별도 작업.

## 새 화면 추가 (2스텝)

1. `src/app/foo.tsx` → `export default () => <Screen title="..">…</Screen>`
2. `src/app/(tabs)/index.tsx`의 `PAGES`에 `{ href: '/foo', label: '..' }` 추가 → 허브에서 push

## 현재 상태 (2026-08 기준)

- ✅ 디자인 토큰 + 공통 컴포넌트(11) + 루트 Stack/(tabs) 네비 구조
- ✅ **워킹 스켈레톤** — 앱 전 화면이 stub(placeholder + 네비게이션 버튼)으로 존재, 플로우 걸어짐
- ✅ EAS 프로젝트 연결 + 앱 정체성 확정
- ⬜ **실제 UI 미확정** — 확정 디자인(Figma 619:9650) 반영 전. stub 상태.
- ⬜ 데이터 레이어(API/상태) 없음 — 화면들은 하드코딩 mock

## 개발 명령

```bash
pnpm typecheck            # tsc --noEmit
pnpm lint / lint:fix      # expo lint
# 시뮬레이터: 개발 빌드(ios/ 생성됨) 설치 후
xcrun simctl launch booted com.byeolddameokja.app
npx expo start --dev-client
# 딥링크로 화면 이동: xcrun simctl openurl booted "orca:///<route>"
```

## Figma 참조 (fileKey `13cTHGZBezIIZI0zKbiFV9`)

| 노드 | 용도 |
|---|---|
| `113:108` | 디자인 시스템(색/타이포 토큰 원본) |
| `499:406` | **플로우 차트**(전체 화면 전이 로직) |
| `619:9650` | **확정된 디자인**(각 화면 픽셀 스펙 — 구현 시 여기서 실측) |
| `679:500` | 화면 플로우 보드(확정 카드 12~23 = 화면 정의) |

> Figma Variables는 정의 안 됨(`get_variable_defs` → `{}`). 스펙은 `get_design_context`의 실측 px 사용.
