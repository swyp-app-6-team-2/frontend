import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button } from '@/components/ui';

const TABS = [
  { key: 'home', icon: require('../assets/images/ic-tab-home.png'), label: '홈' },
  { key: 'fridge', icon: require('../assets/images/ic-tab-fridge.png'), label: '재료관리' },
  { key: 'recipes', icon: require('../assets/images/ic-tab-recipes.png'), label: '나의 레시피' },
  { key: 'my', icon: require('../assets/images/ic-tab-my.png'), label: '마이' },
];

// 코치마크 4단계 — header: 오버레이 대상 화면 · spot: 강조 요소
const STEPS = [
  {
    title: '나의 레시피를 등록해보세요',
    sub: '하단 "나의 레시피"를 통해 이동할 수 있습니다',
    header: '별따먹자',
    spot: 'recipes',
  },
  {
    title: '간편하게 레시피를 등록할 수 있어요',
    sub: 'URI, 캡처이미지로 한 번에 쉽게!',
    header: '나의 레시피',
    spot: 'recipes',
  },
  {
    title: '첫 레시피가 담겼어요',
    sub: '쉬운 요리여도 좋아요, 나만의 레시피를 모아보세요!',
    header: '나의 레시피',
    spot: 'recipes',
  },
  {
    title: '밤하늘에 첫 별이 떴어요!',
    sub: '하단 추천 방법 선택 후, 홈화면을 더블 탭 하면 별똥별이 떨어져요',
    header: '별따먹자',
    spot: 'dropdown',
  },
] as const;

// 밤하늘 산 (홈과 동일: 뒤쪽 밝은 산 + 앞쪽 파란 산)
function NightSky() {
  return (
    <View pointerEvents="none" className="absolute inset-0 justify-end">
      <Image
        source={require('../assets/images/mountain2.png')}
        style={{
          position: 'absolute',
          bottom: 128,
          left: -12,
          width: '58%',
          aspectRatio: 253 / 119,
        }}
        contentFit="contain"
      />
      <Image
        source={require('../assets/images/mountain.png')}
        style={{ width: '100%', aspectRatio: 328 / 176 }}
        contentFit="cover"
      />
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const finish = () => router.replace('/home');
  const isCard = step === STEPS.length;

  // 튜토리얼 5 — 오늘의 추천 카드
  if (isCard) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1 px-screen" edges={['top', 'bottom']}>
          <View className="h-12 flex-row items-center justify-end">
            <Pressable onPress={finish} hitSlop={8} accessibilityLabel="건너뛰기">
              <Text className="text-[24px] text-foreground">✕</Text>
            </Pressable>
          </View>
          <View className="flex-1 justify-center gap-6">
            <View className="items-center gap-4 rounded-card border border-foreground/10 bg-surface p-5">
              <View className="h-40 w-full items-center justify-center rounded-card bg-field">
                <Text className="text-[40px]">🍜</Text>
              </View>
              <AppText variant="title">대파라면</AppText>
              <AppText variant="chip" className="text-muted">
                필수재료: 라면, 계란, 대파
              </AppText>
              <View className="w-full flex-row gap-3">
                <View className="flex-1">
                  <Button label="안땡겨요" variant="secondary" onPress={() => {}} />
                </View>
                <View className="flex-1">
                  <Button label="좋아!" onPress={() => {}} />
                </View>
              </View>
            </View>
            <View className="items-center gap-1">
              <AppText variant="subheading">오늘은 이거 어때요?</AppText>
              <AppText variant="chip" className="text-center text-muted">
                레시피가 늘어날수록 뭐 먹을지 고민도 줄어들어요!
              </AppText>
            </View>
            <Button label="시작하기" onPress={finish} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // 튜토리얼 1~4 — 홈 위 코치마크 오버레이
  const s = STEPS[step];
  const next = () => setStep((v) => v + 1);

  return (
    <View className="flex-1 bg-background">
      {/* 어두워진 홈 배경 */}
      <NightSky />
      <View pointerEvents="none" className="absolute inset-0 bg-black/45" />
      {/* 어디든 탭하면 다음 (버튼·요소 아래 레이어) */}
      <Pressable className="absolute inset-0" onPress={next} accessibilityLabel="다음" />

      <SafeAreaView className="flex-1 px-screen" edges={['top', 'bottom']} pointerEvents="box-none">
        {/* 헤더: 대상 화면명(dim) + 별(dim) + ✕(밝게) */}
        <View className="h-12 flex-row items-center justify-between" pointerEvents="box-none">
          <Text className="text-body font-bold text-foreground/40">{s.header}</Text>
          <View className="flex-row items-center gap-3" pointerEvents="box-none">
            <View className="flex-row items-center gap-1 rounded-pill border border-primary/25 px-3 py-1">
              <Text className="text-primary/50">★</Text>
              <Text className="font-bold text-foreground/40">5/10</Text>
            </View>
            <Pressable onPress={finish} hitSlop={8} accessibilityLabel="건너뛰기">
              <Text className="text-[24px] text-foreground">✕</Text>
            </Pressable>
          </View>
        </View>

        {/* 코치 안내 — 상하 hairline 사이 텍스트 */}
        <View className="flex-1 justify-center" pointerEvents="none">
          {step === 3 ? <Text className="mb-5 text-center text-[40px]">☄️</Text> : null}
          <View className="border-y border-foreground/15 py-7">
            <AppText variant="title" className="text-center">
              {s.title}
            </AppText>
            <AppText variant="body" className="mt-2 text-center text-muted">
              {s.sub}
            </AppText>
          </View>
        </View>

        {/* 하단: 추천 드롭다운 (spot이면 밝게) */}
        <View className="pb-3" pointerEvents="none">
          <View className="flex-row items-end justify-between">
            <Image
              source={require('../assets/images/character.png')}
              style={{ width: 68, height: 64, opacity: s.spot === 'dropdown' ? 1 : 0.4 }}
              contentFit="contain"
            />
            <View
              className={`mb-10 flex-row items-center gap-2 rounded-pill border border-foreground/15 px-4 py-3 ${
                s.spot === 'dropdown' ? 'bg-surface' : 'bg-surface/50'
              }`}
            >
              <Text
                className={`font-medium ${s.spot === 'dropdown' ? 'text-foreground' : 'text-foreground/50'}`}
              >
                랜덤으로 골라줘
              </Text>
              <Text className={s.spot === 'dropdown' ? 'text-muted' : 'text-muted/50'}>▼</Text>
            </View>
          </View>
        </View>

        {/* 탭바 — 떠 있는 바(dim) + 강조 대상은 밝은 테두리 하이라이트 */}
        <View
          className="mx-4 mb-2 flex-row items-center rounded-3xl px-2 py-2.5"
          style={{ backgroundColor: 'rgba(18,26,48,0.7)' }}
          pointerEvents="none"
        >
          {TABS.map((t) => {
            const on = t.key === s.spot;
            if (on) {
              return (
                <View key={t.key} className="flex-1 items-center">
                  <View className="items-center gap-1 rounded-2xl border border-white/70 bg-white/5 px-4 py-2">
                    <Image
                      source={t.icon}
                      style={{ width: 24, height: 24 }}
                      tintColor="#FFFFFF"
                      contentFit="contain"
                    />
                    <Text className="text-[11px] font-semibold text-white">{t.label}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View key={t.key} className="flex-1 items-center gap-1">
                <Image
                  source={t.icon}
                  style={{ width: 24, height: 24 }}
                  tintColor="rgba(154,163,182,0.45)"
                  contentFit="contain"
                />
                <Text className="text-[11px] text-foreground/35">{t.label}</Text>
              </View>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}
