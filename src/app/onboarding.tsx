import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddRecipeMenu } from '@/components/add-recipe-menu';
import { AppText, Button, SearchBar } from '@/components/ui';
import { palette } from '@/constants/tokens';

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
    sub: 'URL, 캡처이미지로 한 번에 쉽게!',
    header: '나의 레시피',
    spot: 'add-menu',
  },
  {
    title: '첫 레시피가 담겼어요',
    sub: '쉬운 요리여도 좋아요, 나만의 레시피를 모아보세요!',
    header: '나의 레시피',
    spot: 'recipe-card',
  },
  {
    title: '밤하늘에 첫 별이 떴어요',
    sub: '밤하늘을 더블 탭 하면 별똥별이 떨어져요',
    header: '별따먹자',
    spot: 'sky',
  },
  {
    title: '뭐 먹을지 어떤 방법으로 골라줄까요?',
    sub: '랜덤으로도, 내 재료로도 고를 수 있어요',
    header: '별따먹자',
    spot: 'dropdown',
  },
] as const;

// 나의 레시피 화면 배경 (제목 + 검색바 + 필터칩) — 코치마크 dim 아래 깔림
function RecipesBackground() {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 px-screen"
      style={{ paddingTop: insets.top }}
    >
      <View className="h-[74px] justify-center">
        <AppText variant="title">나의 레시피</AppText>
      </View>
      <SearchBar placeholder="재료명을 검색해보세요" />
      <View className="mt-4 flex-row gap-2">
        {['카테고리', '재료', '최신순'].map((f) => (
          <View
            key={f}
            className="h-9 flex-row items-center gap-1 rounded-pill border border-field px-4"
          >
            <Text className="text-chip text-foreground">{f}</Text>
            <Image
              source={require('../assets/images/ic-chevron-down.png')}
              style={{ width: 16, height: 16 }}
              tintColor={palette.muted}
              contentFit="contain"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// 밤하늘 홈 배경 (별따먹자 헤더 + 산) — 코치마크 dim 아래 깔림
function NightSky() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" className="absolute inset-0">
      {/* 홈 헤더 (배경) */}
      <View
        className="absolute left-5 right-5 flex-row items-center justify-between"
        style={{ top: insets.top + 8 }}
      >
        <AppText variant="title">별따먹자</AppText>
        <View className="flex-row items-center gap-1 rounded-pill border border-primary/40 bg-surface/60 px-3 py-1">
          <Text className="text-primary">★</Text>
          <Text className="font-bold text-foreground">5/10</Text>
        </View>
      </View>
      {/* 산 */}
      <View className="absolute inset-0 justify-end">
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
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const finish = () => router.replace('/home');
  const isCard = step === STEPS.length;

  // 튜토리얼 6 — 오늘의 추천 카드 (강조 카드 + 코치 텍스트 + 완료하기)
  if (isCard) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          {/* 헤더 — 뒤로 + 건너뛰기 */}
          <View className="h-[38px] flex-row items-center justify-between px-screen">
            <Pressable onPress={() => setStep((v) => v - 1)} hitSlop={8} accessibilityLabel="이전">
              <Image
                source={require('../assets/images/ic-arrow-left.png')}
                style={{ width: 24, height: 24 }}
                tintColor={palette.foreground}
                contentFit="contain"
              />
            </Pressable>
            <Pressable
              onPress={finish}
              accessibilityRole="button"
              accessibilityLabel="건너뛰기"
              className="rounded-pill border border-body-muted bg-background px-4 py-2 active:opacity-80"
            >
              <Text className="text-body font-medium text-foreground">건너뛰기</Text>
            </Pressable>
          </View>

          <View className="flex-1 justify-center px-screen">
            {/* 강조 추천 카드 — primary 테두리 + 글로우 */}
            <View
              className="overflow-hidden rounded-[20px]"
              style={{
                borderWidth: 1,
                borderColor: palette.primary,
                shadowColor: '#FFFFFF',
                shadowOpacity: 0.2,
                shadowRadius: 34,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              {/* 음식 이미지 */}
              <View className="h-[216px] w-full overflow-hidden bg-field">
                <Image
                  source={require('../assets/images/food-sample.png')}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              {/* 하단 팝업 — 제목·재료·버튼 */}
              <View className="items-center gap-[26px] bg-field px-[18px] pb-5 pt-8">
                <View className="items-center gap-3">
                  <AppText variant="subheading">대파라면</AppText>
                  <AppText variant="body" className="text-center text-muted">
                    필수재료: 라면, 계란, 대파
                  </AppText>
                </View>
                <View className="flex-row gap-3 self-stretch">
                  <Pressable
                    onPress={finish}
                    accessibilityRole="button"
                    className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-popup-button active:opacity-80"
                  >
                    <Text className="text-[16px] font-semibold text-muted">안땡겨요</Text>
                  </Pressable>
                  <Pressable
                    onPress={finish}
                    accessibilityRole="button"
                    className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-primary active:opacity-90"
                  >
                    <Text className="text-[16px] font-semibold text-ink">좋아!</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* 코치 텍스트 — 상하 페이드 선 사이 */}
            <View className="mt-8 gap-5">
              <Image
                source={require('../assets/images/line-fade.png')}
                style={{ width: '100%', height: 1.5 }}
                contentFit="fill"
              />
              <View className="items-center gap-3">
                <AppText variant="subheading" className="text-center text-primary-subtle">
                  오늘은 이거 어때요?
                </AppText>
                <AppText variant="body" className="text-center text-muted">
                  레시피가 늘어날수록 뭐 먹을지 고민도 줄어들어요
                </AppText>
              </View>
              <Image
                source={require('../assets/images/line-fade.png')}
                style={{ width: '100%', height: 1.5 }}
                contentFit="fill"
              />
            </View>
          </View>

          {/* 완료하기 */}
          <View className="px-screen pb-8 pt-4">
            <Button label="완료하기" onPress={finish} />
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
      {/* 대상 화면 배경: 나의 레시피 단계는 레시피 화면, 그 외엔 밤하늘 */}
      {s.header === '나의 레시피' ? <RecipesBackground /> : <NightSky />}
      <View pointerEvents="none" className="absolute inset-0 bg-black/45" />

      {/* 강조된 첫 레시피 카드 — dim 위로 밝게 (Figma: 173×127, primary 테두리+글로우) */}
      {s.spot === 'recipe-card' ? (
        <View
          className="absolute left-5"
          style={{ top: insets.top + 186 }}
          pointerEvents="box-none"
        >
          {/* 카드를 눌러야 다음 챕터로 */}
          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel="대파라면 레시피"
            className="h-[127px] w-[173px] overflow-hidden rounded-[12px] bg-field active:opacity-90"
            style={{
              borderWidth: 1,
              borderColor: palette.primary,
              shadowColor: '#FFFFFF',
              shadowOpacity: 0.2,
              shadowRadius: 34,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Image
              source={require('../assets/images/food-sample.png')}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              contentFit="cover"
            />
            <View className="absolute left-1 top-1 rounded-pill bg-surface px-3 py-1">
              <Text className="text-[12px] font-bold text-foreground">BEST</Text>
            </View>
          </Pressable>
          <Text className="mt-3 text-[16px] font-bold text-foreground">대파라면</Text>
        </View>
      ) : null}

      {/* 밤하늘 별 스포트라이트 — 80 원(글로우) + 빛나는 별, 아래 더블탭 손 아이콘 */}
      {s.spot === 'sky' ? (
        <View
          className="absolute inset-x-0 items-center"
          style={{ top: insets.top + 100 }}
          pointerEvents="box-none"
        >
          {/* 별을 눌러야 다음 챕터로 */}
          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel="별"
            className="h-20 w-20 items-center justify-center rounded-full bg-background active:opacity-90"
            style={{
              borderWidth: 1,
              borderColor: palette.primary,
              shadowColor: '#FFFFFF',
              shadowOpacity: 0.2,
              shadowRadius: 34,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Image
              source={require('../assets/images/star.png')}
              style={{ width: 40, height: 40 }}
              contentFit="contain"
            />
          </Pressable>
          <Image
            source={require('../assets/images/tap.png')}
            style={{ width: 96, height: 64, marginTop: 20 }}
            contentFit="contain"
            pointerEvents="none"
          />
        </View>
      ) : null}

      <SafeAreaView className="flex-1 px-screen" edges={['top', 'bottom']} pointerEvents="box-none">
        {/* 온보딩 헤더 — 이전(뒤로) + 건너뛰기 (Figma 헤더7). 화면명은 배경이 담당 */}
        <View className="h-[38px] flex-row items-center justify-between" pointerEvents="box-none">
          {step > 0 ? (
            <Pressable onPress={() => setStep((v) => v - 1)} hitSlop={8} accessibilityLabel="이전">
              <Image
                source={require('../assets/images/ic-arrow-left.png')}
                style={{ width: 24, height: 24 }}
                tintColor={palette.foreground}
                contentFit="contain"
              />
            </Pressable>
          ) : (
            <View style={{ width: 24, height: 24 }} />
          )}
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            accessibilityLabel="건너뛰기"
            className="rounded-pill border border-body-muted bg-background px-4 py-2 active:opacity-80"
          >
            <Text className="text-body font-medium text-foreground">건너뛰기</Text>
          </Pressable>
        </View>

        {/* 코치 안내 — 상하 페이드 선 사이 텍스트 (레시피 카드 단계는 카드 아래로 내림) */}
        <View
          className="flex-1 justify-center"
          style={{ paddingTop: s.spot === 'recipe-card' ? 200 : 0 }}
          pointerEvents="none"
        >
          <View className="gap-6">
            <Image
              source={require('../assets/images/line-fade.png')}
              style={{ width: '100%', height: 1.5 }}
              contentFit="fill"
            />
            <View>
              <AppText variant="title" className="text-center text-primary-subtle">
                {s.title}
              </AppText>
              <AppText variant="body" className="mt-2 text-center text-muted">
                {s.sub}
              </AppText>
            </View>
            <Image
              source={require('../assets/images/line-fade.png')}
              style={{ width: '100%', height: 1.5 }}
              contentFit="fill"
            />
          </View>
        </View>

        {/* 하단: 2챕터는 강조된 등록 팝오버+FAB(눌러야 진행), 그 외엔 추천 드롭다운 */}
        {s.spot === 'add-menu' ? (
          <View className="items-end pb-3" pointerEvents="box-none">
            <View className="mb-[18px]">
              <AddRecipeMenu highlighted onSelect={next} />
            </View>
            <Pressable
              onPress={next}
              accessibilityRole="button"
              accessibilityLabel="레시피 등록"
              className="h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-90"
              style={{
                borderWidth: 1,
                borderColor: palette.ink,
                shadowColor: '#FFFFFF',
                shadowOpacity: 0.25,
                shadowRadius: 34,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Feather name="plus" size={24} color={palette.ink} />
            </Pressable>
          </View>
        ) : s.spot === 'recipe-card' ? (
          <View className="items-end pb-3" pointerEvents="box-none">
            {/* 플레인 FAB — 강조 대상은 레시피 카드라 진행은 카드 탭으로만 (FAB는 비활성) */}
            <Pressable
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel="레시피 등록"
              className="h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-90"
            >
              <Feather name="plus" size={24} color={palette.ink} />
            </Pressable>
          </View>
        ) : s.spot === 'dropdown' ? (
          // 뭐 먹을지 — 추천 드롭다운 펼침(강조 패널 + 토글 버튼)
          <View className="pb-3" pointerEvents="box-none">
            <View className="flex-row items-end justify-between" pointerEvents="box-none">
              <Image
                source={require('../assets/images/character.png')}
                style={{ width: 68, height: 64, opacity: 0.4 }}
                contentFit="contain"
              />
              <View className="mb-10 items-end gap-2" pointerEvents="box-none">
                {/* 강조된 옵션 패널 — 눌러야 온보딩 끝 (랜덤=흰색, 내재료=dim) */}
                <Pressable
                  onPress={next}
                  accessibilityRole="button"
                  className="w-[173px] rounded-[20px] bg-reco-panel p-1 active:opacity-90"
                  style={{
                    borderWidth: 1,
                    borderColor: palette.primary,
                    shadowColor: '#FFFFFF',
                    shadowOpacity: 0.2,
                    shadowRadius: 34,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <View className="h-[47px] items-center justify-center">
                    <Text className="text-[16px] leading-[19px] text-foreground">
                      랜덤으로 골라줘
                    </Text>
                  </View>
                  <View className="h-[47px] items-center justify-center">
                    <Text
                      className="text-[16px] leading-[19px]"
                      style={{ color: palette.popupButtonText }}
                    >
                      내재료로 골라줘
                    </Text>
                  </View>
                </Pressable>
                {/* 토글 버튼 (열림 = 위 화살표) */}
                <Pressable
                  onPress={next}
                  accessibilityRole="button"
                  className="h-[50px] w-[173px] flex-row items-center justify-center gap-1.5 rounded-[99px] border border-disabled bg-reco-button active:opacity-80"
                >
                  <Text className="text-[16px] leading-[19px] text-foreground">
                    랜덤으로 골라줘
                  </Text>
                  <Image
                    source={require('../assets/images/ic-chevron-down.png')}
                    style={{ width: 24, height: 24, transform: [{ rotate: '180deg' }] }}
                    tintColor={palette.disabled}
                    contentFit="contain"
                  />
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          // 밤하늘 — 드롭다운 dim 닫힘 (강조는 상단 별 스포트라이트)
          <View className="pb-3" pointerEvents="none">
            <View className="flex-row items-end justify-between">
              <Image
                source={require('../assets/images/character.png')}
                style={{ width: 68, height: 64, opacity: 0.4 }}
                contentFit="contain"
              />
              <View className="mb-10 flex-row items-center gap-2 rounded-pill border border-foreground/15 bg-surface/50 px-4 py-3">
                <Text className="font-medium text-foreground/50">랜덤으로 골라줘</Text>
                <Text className="text-muted/50">▼</Text>
              </View>
            </View>
          </View>
        )}

        {/* 탭바 — 떠 있는 바(dim) + 강조 대상은 밝은 테두리 하이라이트 */}
        <View
          className="mx-4 mb-2 flex-row items-center rounded-3xl px-2 py-2.5"
          style={{ backgroundColor: 'rgba(18,26,48,0.7)' }}
          pointerEvents="box-none"
        >
          {TABS.map((t) => {
            const on = t.key === s.spot;
            // 현재 화면 탭은 골드 활성 (글로우 강조는 spot만). 나의 레시피 단계=레시피, 그 외=홈
            const currentKey = s.header === '나의 레시피' ? 'recipes' : 'home';
            const isCurrent = !on && t.key === currentKey;
            if (on) {
              return (
                <Pressable
                  key={t.key}
                  className="h-14 flex-1 items-center justify-center active:opacity-80"
                  onPress={next}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.label} 탭`}
                >
                  {/* 강조 칩 — 바 높이(h-14) 안에 들어가도록 컴팩트, primary 테두리+글로우 */}
                  <View
                    className="items-center justify-center gap-1 self-stretch rounded-xl py-1"
                    style={{
                      backgroundColor: palette.background,
                      borderWidth: 1,
                      borderColor: palette.primary,
                      shadowColor: '#FFFFFF',
                      shadowOpacity: 0.2,
                      shadowRadius: 34,
                      shadowOffset: { width: 0, height: 0 },
                    }}
                  >
                    <Image
                      source={t.icon}
                      style={{ width: 24, height: 24 }}
                      tintColor={palette.primary}
                      contentFit="contain"
                    />
                    <Text numberOfLines={1} className="text-[11px] font-semibold text-primary">
                      {t.label}
                    </Text>
                  </View>
                </Pressable>
              );
            }
            return (
              <View
                key={t.key}
                className="h-14 flex-1 items-center justify-center gap-1"
                pointerEvents="none"
              >
                <Image
                  source={t.icon}
                  style={{ width: 24, height: 24 }}
                  tintColor={isCurrent ? palette.primary : 'rgba(154,163,182,0.45)'}
                  contentFit="contain"
                />
                <Text
                  numberOfLines={1}
                  className={`text-[11px] ${isCurrent ? 'font-medium text-primary' : 'text-foreground/35'}`}
                >
                  {t.label}
                </Text>
              </View>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}
