import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export type DialogTone = 'neutral' | 'danger';

export type DialogAction = {
  label: string;
  onPress: () => void;
  /** neutral = 팝업 중립 버튼(#34394B), danger = Error(#FF6B5E). 기본 neutral. */
  tone?: DialogTone;
};

export type AlertDialogProps = {
  /** 아이콘 원(60·Error 15%) 안에 들어갈 요소 — 이모지 <Text> 또는 tint된 <Image>. */
  icon: ReactNode;
  title: string;
  /** 본문 — `\n` 으로 두 줄. */
  message: string;
  /** 1~2개 버튼, 왼→오. */
  actions: DialogAction[];
};

// 중앙 정렬 경고 팝업 — Figma 팝업창 스펙(카드 370 / padding 30·18·20 / gap 26 / radius 20).
// url-failed · ocr-failed · slot-full 세 화면이 아이콘/문구만 다르고 구조가 같아 공통화.
export function AlertDialog({ icon, title, message, actions }: AlertDialogProps) {
  return (
    <View className="flex-1 items-center justify-center px-[10px]">
      {/* dim */}
      <View pointerEvents="none" className="absolute inset-0 bg-black/60" />

      {/* 팝업창 카드 */}
      <View
        className="w-full max-w-[370px] items-center rounded-[20px] bg-field"
        style={{
          paddingTop: 30,
          paddingHorizontal: 18,
          paddingBottom: 20,
          gap: 26,
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: 20 },
        }}
      >
        {/* Frame 288: 아이콘 + 텍스트 (gap 20) */}
        <View className="items-center" style={{ gap: 20 }}>
          {/* Frame 283: 아이콘 원 60 · Error 15% */}
          <View
            className="items-center justify-center bg-error/15"
            style={{ width: 60, height: 60, borderRadius: 99 }}
          >
            {icon}
          </View>

          {/* Frame 287: 제목 + 본문 (gap 12) */}
          <View className="items-center" style={{ gap: 12 }}>
            <Text
              className="text-center font-bold text-foreground"
              style={{ fontSize: 22, lineHeight: 22 * 1.3 }}
            >
              {title}
            </Text>
            <Text
              className="text-center font-medium text-body-muted"
              style={{ fontSize: 16, lineHeight: 16 * 1.3 }}
            >
              {message}
            </Text>
          </View>
        </View>

        {/* Frame 286: 버튼 행 (gap 12) */}
        <View className="flex-row justify-center" style={{ gap: 12 }}>
          {actions.map((a) => {
            const danger = a.tone === 'danger';
            return (
              <Pressable
                key={a.label}
                onPress={a.onPress}
                accessibilityRole="button"
                className={`items-center justify-center rounded-[30px] active:opacity-90 ${
                  danger ? 'bg-error' : 'bg-popup-button'
                }`}
                style={{ width: 150, height: 52 }}
              >
                <Text
                  className={`font-semibold ${danger ? 'text-foreground' : 'text-popup-button-text'}`}
                  style={{ fontSize: 16, lineHeight: 21 }}
                >
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
