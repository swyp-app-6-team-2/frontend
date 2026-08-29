# 디자인 시스템 스펙 — 별따먹자 (레시피 추천앱)

- **작성일**: 2026-08-29
- **출처**: Figma "레시피 추천앱 - 별따먹자" / 디자인시스템 보드 (`node-id 113:108`)
- **스택**: Expo v57 · React Native 0.86 · Expo Router · NativeWind v4 · Tailwind v3 · TypeScript
- **방식**: A — NativeWind(className) 우선, 토큰 단일 소스

---

## 1. 목표

Figma 디자인시스템 보드의 토큰·컴포넌트를 이 앱의 **실제 코드 토큰 시스템**으로 옮긴다. 현재 스타일링이 두 갈래(JS `constants/theme.ts` + `useTheme` vs 미설정 NativeWind)로 갈라져 있는 것을 **NativeWind 토큰 단일 소스**로 통합한다.

성공 기준:

- `className="bg-primary text-foreground"` 처럼 토큰명으로 스타일링 가능
- 라이트/다크 모드가 토큰으로 자동 전환
- Figma의 6개 컴포넌트가 재사용 컴포넌트로 존재하고, 쇼케이스 화면에서 렌더됨

## 2. 접근 방식 (A: NativeWind 우선)

- 토큰을 `tailwind.config.js`의 `theme.extend`에 정의(현재 비어 있음) → **단일 소스**.
- 컴포넌트는 `className` 기반. 색·간격·타이포를 토큰명으로만 참조(raw hex 금지).
- 기존 `themed-text`/`themed-view`/`constants/theme.ts`는 토큰 기반으로 재정리(§7).
- 다크모드는 NativeWind v4 `dark:` 변형으로. (구현 시 Expo v57 + NativeWind v4 다크모드 설정 문서 확인 — `darkMode` 전략, `useColorScheme` 연동.)

## 3. 컬러 토큰 (Figma 확정값)

의미(semantic) 토큰으로 정의한다. 값은 Figma 원본과 일치.

| 토큰             | Light     | Dark      | 역할                                                   |
| ---------------- | --------- | --------- | ------------------------------------------------------ |
| `primary`        | `#FFD457` | `#FFD457` | 브랜드/주요 액션(버튼)                                 |
| `primary-subtle` | `#FAEECB` | `#FAEECB` | 연한 브랜드 면(칩·강조 배경)                           |
| `brand-deep`     | `#694800` | `#694800` | 브랜드 딥(아이콘/강조 텍스트 등). 버튼 텍스트엔 미사용 |
| `background`     | `#FFFFFF` | `#060A19` | 화면 기본 배경                                         |
| `foreground`     | `#18181B` | `#FFFFFF` | 기본 텍스트                                            |
| `muted`          | `#3F4250` | `#3F4250` | 보조/비활성(disabled)                                  |
| `ink`            | `#060A19` | `#060A19` | 다크 서피스/강조 배경                                  |
| `error`          | `#FF6B5E` | `#FF6B5E` | 오류                                                   |
| `success`        | `#2FA96B` | `#2FA96B` | 성공                                                   |

메모:

- **메인버튼 텍스트 = `#000000`(검정)** — `brand-deep(#694800)`이 아님(Figma 확인). 별도 `on-primary` 토큰은 검정으로 두거나 `foreground` 재사용.
- `#FAEECB`는 Figma에서 2회 등장(중복) → 단일 토큰.
- 다크 배경 `#060A19`는 Figma의 다크 화면 목업에서 사용됨 → `background` 다크값으로 매핑.

## 4. 타이포그래피

- **폰트: Pretendard** (Figma가 Pretendard Regular/SemiBold 사용).
- 스케일(Figma):

| 토큰          | size | weight       | 용도                   |
| ------------- | ---- | ------------ | ---------------------- |
| `text-header` | 22   | Bold(700)    | 화면 헤더("나의 거래") |
| `text-body`   | 16   | Medium(500)  | 본문                   |
| `text-chip`   | 14   | Regular(400) | 칩·태그                |

- ⚠️ **폰트 로딩 갭**: 프로젝트에 Pretendard가 없음(`global.css`는 Spline Sans/Inter, `theme.ts`는 system-ui). 결정 필요:
  - (권장) `expo-font`로 Pretendard 로드(웹은 `@font-face`) → 디자인과 정확히 일치
  - 또는 잠정적으로 system 폰트 유지하고 후속 작업으로 분리
- 헤더→본문 세로 간격 **8px** 규칙.

## 5. 간격·레이아웃 토큰

Figma 스펙:

- 화면 좌우 `margin` = **20**
- 컬럼 `gutter` = **16**
- 헤더→본문 = **8**
- 상단 status bar = **44**, 하단 바 = **82**(navigation 56 + safe area 26)

기존 `constants/theme.ts`의 `Spacing`(half2/one4/two8/three16/four24/five32/six64)과 조화: 20·16은 커스텀 스페이싱 키로 추가하거나 기존 스케일에 맞춰 조정(`three16`, 그리고 `screen=20`).

## 6. 컴포넌트 목록 (초기 범위)

`src/components/ui/` 아래. 정확한 radius/padding/색은 구현 시 각 Figma 노드에서 추출.

| 컴포넌트                | Figma 노드 | 핵심 스펙 / API                                                                                       |
| ----------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `Button` (메인버튼)     | `616:990`  | bg `primary`, h52, radius **30**(알약), 텍스트 검정 16 Regular. props: `title`, `onPress`, `disabled` |
| `MiniButton` (미니버튼) | `616:998`  | 작은 알약 버튼. props: `title`, `onPress`                                                             |
| `SearchBar` (검색바)    | `623:395`  | 검색 아이콘 + placeholder "재료명을 검색해보세요". props: `value`, `onChangeText`, `placeholder`      |
| `Chip` (칩)             | `623:375`  | 14 Regular 알약. props: `label`, `selected`, `onPress`                                                |
| `ListRow` (리스트)      | `616:1098` | 라벨 + 오른쪽 chevron(>). props: `label`, `onPress`                                                   |
| `Header` (헤더)         | `616:1114` | 22 Bold 타이틀. props: `title`, `onBack?`                                                             |

후속(선택): `Popup`(가나다 필터), `BottomNav`, `Screen`(SafeArea+margin 스캐폴드).

## 7. 기존 코드와의 정리

- `tailwind.config.js` — `theme.extend`에 §3–5 토큰 주입(현재 비어 있어 NativeWind로 토큰 스타일 불가).
- `constants/theme.ts` — `Colors`/`Spacing`/`Fonts`를 토큰의 파생/보조로 정리(중복 값 제거, 단일 소스는 tailwind config 또는 공유 TS 상수).
- `themed-text.tsx` / `themed-view.tsx` — 토큰 기반으로 재작성 또는 신규 `Text`/컴포넌트로 대체. 기존 사용처(`app/*`) 회귀 없게.
- `global.css` — 웹 폰트 변수(Pretendard) 반영(폰트 로딩 결정 후).

## 8. 빌드 순서

1. **토큰**: `tailwind.config.js` + (필요시) 공유 TS 토큰 상수 + 다크모드 설정. `pnpm/npm lint`·타입 통과.
2. **폰트**: Pretendard 로딩 결정 반영(또는 후속 분리).
3. **컴포넌트**: `Button` → `Chip` → `SearchBar` → `ListRow` → `Header` → `MiniButton` 순(단순→조합). 각기 Figma 노드에서 정확값 추출.
4. **쇼케이스**: `src/app/design-system.tsx` 에 전 컴포넌트 렌더(라이트/다크 토글).
5. **기존 정리**: `themed-*` 재정리 + 회귀 확인.

각 단계 후 실제 앱 실행으로 시각 확인(특히 다크모드·Pretendard).

## 9. 리스크 / 열린 질문

- **Pretendard 로딩**(§4) — 디자인 일치 vs 작업량. 기본 권장: 로드.
- **`brand-deep(#694800)` 실제 용도** — 버튼 텍스트 아님. 미니버튼/아이콘 등에서 구현 시 확정.
- **NativeWind v4 다크모드** 설정 방식 — 구현 시 Expo v57/NativeWind v4 문서로 검증.
- **`constants/theme.ts` 이중 소스** — 완전 대체 vs 병행. 회귀 최소화 위해 점진 정리 권장.

## 10. 범위 밖 (YAGNI)

- 애니메이션/모션 토큰, 아이콘 시스템 전체, 폼 유효성 컴포넌트, 접근성 감사 — 초기 범위에서 제외(후속).
