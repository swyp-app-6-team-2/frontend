import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { fireHaptic } from '@/lib/haptics';

import { PressableScale } from './pressable-scale';

export type DialogTone = 'neutral' | 'danger' | 'primary';

/** 등장 햅틱 — 경고성(기본)/축하성. */
export type DialogHaptic = 'warning' | 'success';

// 카드 등장 — 아래서 살짝 올라오며 스프링 팝. reduce-motion은 기본값이 자동 존중.
const cardEntering = FadeInDown.springify().damping(18).mass(0.85);

export type DialogAction = {
  label: string;
  onPress: () => void;
  /** neutral=중립(#34394B) · danger=Error(#FF6B5E) · primary=골드 확인. 기본 neutral. */
  tone?: DialogTone;
};

export type AlertDialogProps = {
  /** 아이콘 원(60·Error 15%) 안에 들어갈 요소 — 없으면 아이콘 생략(예: 로그아웃 확인). */
  icon?: ReactNode;
  /** 카드 상단에 걸쳐 얹히는 마스코트(예: 문의 중단 확인) — 카드 위로 살짝 겹쳐 표시. */
  mascot?: ReactNode;
  /** 제목(Bold 22) — 없으면 생략하고 message를 강조(18px 흰색)로 표시. */
  title?: string;
  /** 본문 — `\n` 으로 두 줄. */
  message: string;
  /** 1~2개 버튼, 왼→오. 1개면 카드 폭에 꽉 차게. */
  actions: DialogAction[];
  /** 등장 시 햅틱 — 기본 'warning'(경고 팝업). 축하 팝업은 'success'. */
  haptic?: DialogHaptic;
};

// 중앙 정렬 경고 팝업 — Figma 팝업창 스펙(카드 370 / padding 30·18·20 / gap 26 / radius 20).
// url-failed · ocr-failed · slot-full 세 화면이 아이콘/문구만 다르고 구조가 같아 공통화.
export function AlertDialog({
  icon,
  mascot,
  title,
  message,
  actions,
  haptic = 'warning',
}: AlertDialogProps) {
  // 팝업 등장 시 햅틱(경고성 기본, 축하 팝업은 success).
  useEffect(() => {
    fireHaptic(haptic);
  }, [haptic]);

  const single = actions.length === 1; // 단일 버튼 → 카드 폭 전체

  return (
    <View className="flex-1 items-center justify-center px-[10px]">
      {/* dim — 페이드 인 (애니메이션은 Animated 노드, 색은 자식 View의 className) */}
      <Animated.View
        entering={FadeIn.duration(150)}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <View className="flex-1 bg-black/60" />
      </Animated.View>

      {/* 팝업창 카드 — 애니메이션은 바깥 Animated.View(레이아웃은 inline style),
          시각 스타일(className)은 안쪽 View로 분리해 NativeWind 충돌 회피 */}
      <Animated.View
        entering={cardEntering}
        style={{ width: '100%', maxWidth: 370, alignItems: 'center' }}
      >
        {/* Frame 1437264172: 마스코트 — 카드 상단에 걸쳐 얹힘(zIndex로 카드 위, 하단은 겹침) */}
        {mascot ? (
          <View pointerEvents="none" style={{ zIndex: 2, marginBottom: -44 }}>
            {mascot}
          </View>
        ) : null}

        <View
          className="w-full items-center rounded-[20px] bg-field"
          style={{
            paddingTop: mascot ? 48 : 30,
            paddingHorizontal: 18,
            paddingBottom: 20,
            gap: 26,
            shadowColor: '#000000',
            shadowOpacity: 0.35,
            shadowRadius: 40,
            shadowOffset: { width: 0, height: 20 },
          }}
        >
          {/* Frame 288: 아이콘 + 텍스트 (gap 20). 아이콘 없으면 텍스트만 */}
          <View className="items-center" style={{ gap: 20 }}>
            {/* Frame 283: 아이콘 원 60 · Error 15% (있을 때만) */}
            {icon ? (
              <View
                className="items-center justify-center bg-error/15"
                style={{ width: 60, height: 60, borderRadius: 99 }}
              >
                {icon}
              </View>
            ) : null}

            {/* Frame 287: 제목(있을 때) + 본문 (gap 12). 제목 없으면 본문을 강조 +
                위아래 여백(24/20)으로 카드 높이 확보(Figma 197). */}
            <View
              className="items-center"
              style={{ gap: 12, paddingTop: title ? 0 : 24, paddingBottom: title ? 0 : 20 }}
            >
              {title ? (
                <Text
                  className="text-center font-bold text-foreground"
                  style={{ fontSize: 22, lineHeight: 22 * 1.3 }}
                >
                  {title}
                </Text>
              ) : null}
              <Text
                className={`text-center font-medium ${title ? 'text-body-muted' : 'text-foreground'}`}
                style={{ fontSize: title ? 16 : 18, lineHeight: (title ? 16 : 18) * 1.3 }}
              >
                {message}
              </Text>
            </View>
          </View>

          {/* Frame 286: 버튼 행 (gap 12). 단일 버튼은 카드 폭 전체(self-stretch) */}
          <View
            className={`flex-row justify-center ${single ? 'self-stretch' : ''}`}
            style={{ gap: 12 }}
          >
            {actions.map((a) => {
              const tone = a.tone ?? 'neutral';
              const bg =
                tone === 'danger'
                  ? 'bg-error'
                  : tone === 'primary'
                    ? 'bg-primary'
                    : 'bg-popup-button';
              const textColor =
                tone === 'danger'
                  ? 'text-foreground'
                  : tone === 'primary'
                    ? 'text-ink'
                    : 'text-popup-button-text';
              return (
                <PressableScale
                  key={a.label}
                  onPress={a.onPress}
                  accessibilityRole="button"
                  className={`h-[52px] ${single ? 'flex-1' : 'w-[150px]'} items-center justify-center rounded-[30px] ${bg}`}
                >
                  <Text
                    className={`font-semibold ${textColor}`}
                    style={{ fontSize: 16, lineHeight: 21 }}
                  >
                    {a.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
