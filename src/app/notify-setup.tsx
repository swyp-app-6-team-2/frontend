import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText, Screen } from '@/components/ui';

// 알림 시간대 설정 — 신규 가입(약관 동의) 후. 선택한 시간대에 '별똥별' 알림을 보낸다.
// 시간대 라벨은 임시(스펙 확정 시 교체). 복수 선택 가능(Figma: 2개 활성 예시).
const SLOTS = ['아침', '점심', '저녁', '야식'];

// 172×52 미니 토글 — on=골드·ink 글자, off=#36398A(slot)·흰 글자. radius 30.
function TimeSlot({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      className={`h-[52px] flex-1 items-center justify-center rounded-[30px] active:opacity-80 ${
        on ? 'bg-primary' : 'bg-slot'
      }`}
    >
      <Text
        className={`text-[20px] font-semibold leading-[26px] ${on ? 'text-ink' : 'text-foreground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function NotifySetupScreen() {
  const router = useRouter();
  const { nick } = useLocalSearchParams<{ nick?: string }>();
  const nickname = nick || '요리사';
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (s: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const canSubmit = selected.size > 0;
  const onSubmit = () => {
    if (!canSubmit) return;
    // TODO: 선택 시간대를 알림 설정 API로 저장.
    // 신규 가입 흐름: 알림 시간대 설정 → 온보딩 튜토리얼.
    router.replace('/onboarding');
  };

  return (
    <Screen
      title=""
      back
      bgImage={require('../assets/images/terms-bg.png')}
      bgBottomImage={require('../assets/images/notify-bottom.png')}
    >
      <View className="flex-1">
        {/* 제목 + 부제 */}
        <Text className="mt-2 text-[24px] font-bold leading-[31px] text-foreground">
          {nickname}님, 평소 어느 시간대에{'\n'}요리하시나요?
        </Text>
        <AppText variant="body" className="mt-2 font-normal text-muted">
          그 시간에 맞춰 별똥별을 보내드릴게요
        </AppText>

        {/* 2×2 시간대 그리드 */}
        <View className="mt-9 gap-4">
          <View className="flex-row gap-[18px]">
            <TimeSlot
              label={SLOTS[0]}
              on={selected.has(SLOTS[0])}
              onPress={() => toggle(SLOTS[0])}
            />
            <TimeSlot
              label={SLOTS[1]}
              on={selected.has(SLOTS[1])}
              onPress={() => toggle(SLOTS[1])}
            />
          </View>
          <View className="flex-row gap-[18px]">
            <TimeSlot
              label={SLOTS[2]}
              on={selected.has(SLOTS[2])}
              onPress={() => toggle(SLOTS[2])}
            />
            <TimeSlot
              label={SLOTS[3]}
              on={selected.has(SLOTS[3])}
              onPress={() => toggle(SLOTS[3])}
            />
          </View>
        </View>

        {/* 마스코트 — 하단 바닥 이미지 위쪽에 위치 */}
        <View className="flex-1 items-center justify-end pb-2">
          <Image
            source={require('../assets/images/notify-mascot.png')}
            style={{ width: 160, height: 120 }}
            contentFit="contain"
          />
        </View>
      </View>

      {/* 하단 완료 버튼 + 취소할게요 */}
      <View className="gap-3 pb-8 pt-4">
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          className={`h-[52px] items-center justify-center rounded-[30px] active:opacity-90 ${
            canSubmit ? 'bg-primary' : 'bg-disabled'
          }`}
        >
          <Text
            className={`text-[16px] font-semibold leading-[21px] ${
              canSubmit ? 'text-ink' : 'text-body-muted'
            }`}
          >
            확인
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          hitSlop={8}
          className="self-center py-1 active:opacity-70"
        >
          <Text className="text-[14px] font-medium leading-[18px] text-muted">다르게 할게요</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
