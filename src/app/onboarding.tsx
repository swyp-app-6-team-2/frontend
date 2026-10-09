import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddRecipeMenu } from '@/components/add-recipe-menu';
import { AppText, Button, SearchBar } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useCompleteOnboarding } from '@/hooks/use-api';

const TABS = [
  { key: 'home', icon: require('../assets/images/ic-tab-home.png'), label: '홈' },
  { key: 'recipes', icon: require('../assets/images/ic-tab-recipes.png'), label: '나의 레시피' },
  { key: 'fridge', icon: require('../assets/images/ic-tab-fridge.png'), label: '재료관리' },
  { key: 'my', icon: require('../assets/images/ic-tab-my.png'), label: '마이' },
];

// 코치마크 6단계 — header: 오버레이 대상 화면 · spot: 강조 요소
const STEPS = [
  {
    title: '나의 레시피를 모아보세요',
    sub: '하단 "나의레시피"를 통해 이동할 수 있어요',
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
    title: '어떤 방법으로 메뉴를 골라줄까요?',
    sub: '랜덤으로도, 내 재료로도 고를 수 있어요',
    header: '별따먹자',
    spot: 'dropdown',
  },
  {
    title: '오늘은 이거 어때요?',
    sub: '레시피가 늘어날수록 뭐 먹을지 고민도 줄어들어요',
    header: '별따먹자',
    spot: 'reco-card',
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
      {/* 구름 배경 (홈과 동일) — 바닥 고정 + 위로 확대, bottom:20. 화면 비율 무관하게 하단 앵커. */}
      <Image
        source={require('../assets/images/sky-bg.png')}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 20, height: '122%' }}
        contentFit="cover"
        contentPosition="bottom"
      />
      {/* 홈 헤더 (배경) — 홈과 동일: 별따먹자 로고 이미지 + '남은 별' 칩 */}
      <View
        className="absolute left-5 right-5 flex-row items-center justify-between"
        style={{ top: insets.top + 8 }}
      >
        <Image
          source={require('../assets/images/home-title.png')}
          style={{ width: 84, height: 24 }}
          contentFit="contain"
          accessibilityLabel="별따먹자"
        />
        <View className="h-[38px] flex-row items-center gap-1 rounded-pill border border-primary bg-star-chip px-4">
          <Image
            source={require('../assets/images/star-chip.png')}
            style={{ width: 15, height: 15 }}
            contentFit="contain"
          />
          <Text className="text-[14px] font-medium leading-[18px] text-foreground">남은 별</Text>
          <Text className="text-[14px] font-medium leading-[18px] text-foreground">10</Text>
        </View>
      </View>
      {/* 바닥 돔(지평선) */}
      <View className="absolute inset-0 justify-end">
        <Image
          source={require('../assets/images/notify-bottom.png')}
          style={{ width: '100%', aspectRatio: 402 / 257 }}
          contentFit="cover"
        />
      </View>
      {/* 캐릭터 — 홈과 동일 좌표/크기(중앙 44%, translateX -55로 실제 중심 정렬) */}
      <Image
        source={require('../assets/images/mascot-blob.png')}
        style={{
          position: 'absolute',
          left: '30%',
          bottom: 120,
          width: 110,
          height: 110,
          transform: [{ translateX: -55 }],
        }}
        contentFit="contain"
      />
    </View>
  );
}

// 추천 카드 (대파라면) — 온보딩 6·7단계 공용. 두 버튼 모두 onSelect 실행.
function RecoCard({ onSelect }: { onSelect: () => void }) {
  return (
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
            onPress={onSelect}
            accessibilityRole="button"
            className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-popup-button active:opacity-80"
          >
            <Text className="text-[16px] font-semibold text-muted">안땡겨요</Text>
          </Pressable>
          <Pressable
            onPress={onSelect}
            accessibilityRole="button"
            className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-primary active:opacity-90"
          >
            <Text className="text-[16px] font-semibold text-ink">좋아!</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const completeOnboarding = useCompleteOnboarding();
  // 튜토리얼 종료 → 백엔드에 온보딩 완료 기록(재진입 시 온보딩 스킵) 후 홈으로.
  // 기록 실패해도 홈 진입은 막지 않는다(다음 진입에서 다시 시도됨).
  const finish = () => {
    completeOnboarding.mutate();
    router.replace('/home');
  };
  const isCard = step === STEPS.length;

  // 튜토리얼 7 — 오늘의 추천 카드 (강조 카드 + 코치 텍스트 + 시작하기)
  if (isCard) {
    return (
      <View className="flex-1 bg-background">
        {/* 뒷배경 — 홈과 동일한 밤하늘(1~6단계 '별따먹자' 배경과 통일) */}
        <NightSky />
        {/* 딤 — 밤하늘 단계(1·4·5·6)와 동일하게 #060A19 85% */}
        <View pointerEvents="none" className="absolute inset-0 bg-background/85" />
        {/* 화면 아무 곳이나 탭해도 완료(홈으로) — 버튼은 위 레이어에서 각자 처리 */}
        <Pressable className="absolute inset-0" onPress={finish} accessibilityLabel="다음" />
        <SafeAreaView className="flex-1" edges={['top', 'bottom']} pointerEvents="box-none">
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
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="건너뛰기"
              className="active:opacity-80"
            >
              <Image
                source={require('../assets/images/ic-close.png')}
                style={{ width: 16, height: 16 }}
                tintColor={palette.foreground}
                contentFit="contain"
              />
            </Pressable>
          </View>

          {/* 중앙 스페이서 — 시작하기를 하단에 고정(카드는 스텝6과 동일 위치로 아래 절대배치) */}
          <View className="flex-1" pointerEvents="none" />

          {/* 시작하기 — 카드(사진)와 134px 간격 */}
          <View className="px-screen pb-8 pt-[134px]">
            <Button label="시작하기" onPress={finish} />
          </View>
        </SafeAreaView>

        {/* 강조 추천 카드 — 스텝 6과 동일 위치(top insets.top+140)로 절대배치. 여기선 딤 위(강조). */}
        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 items-center px-screen"
          style={{ top: insets.top + 140 }}
        >
          <View className="w-full max-w-[362px]">
            <RecoCard onSelect={finish} />
          </View>
        </View>

        {/* 홈의 추천 드롭다운(닫힘) — 스텝 6과 동일 위치(안전영역 하단 +128)로 절대배치해 배경 연속성 유지.
            강조 대상이 아니므로 딤을 덮어 배경처럼 어둡게(다른 단계와 통일). */}
        <View
          pointerEvents="none"
          className="absolute inset-x-0 flex-row items-end justify-end px-screen"
          style={{ bottom: insets.bottom + 128 }}
        >
          <View>
            <View className="h-[50px] w-[173px] flex-row items-center justify-center gap-1.5 rounded-[99px] border border-disabled bg-reco-button">
              <Text className="text-[16px] leading-[19px] text-foreground">랜덤으로 골라줘</Text>
              <Image
                source={require('../assets/images/ic-chevron-down.png')}
                style={{ width: 24, height: 24 }}
                tintColor={palette.foreground}
                contentFit="contain"
              />
            </View>
            <View
              className="absolute inset-0 rounded-[99px] bg-background/85"
              pointerEvents="none"
            />
          </View>
        </View>
      </View>
    );
  }

  // 튜토리얼 1~4 — 홈 위 코치마크 오버레이
  const s = STEPS[step];
  const next = () => setStep((v) => v + 1);
  // 딤 오퍼시티(디자인 확정): 나의 레시피 배경(2·3)과 온보딩 1(step 0)은 #060A19 75%, 그 외(4·5·6)는 85%.
  const dimClass =
    s.header === '나의 레시피' || step === 0 ? 'bg-background/75' : 'bg-background/85';

  // 코치 문구 (상하 페이드 선 사이) — Figma Frame …044. 여러 위치에서 재사용.
  const coachText = (
    <View className="w-full gap-6">
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
  );

  return (
    <View className="flex-1 bg-background">
      {/* 대상 화면 배경: 나의 레시피 단계는 레시피 화면, 그 외엔 밤하늘 */}
      {s.header === '나의 레시피' ? <RecipesBackground /> : <NightSky />}

      {/* 온보딩 6 — 추천 결과 팝업을 딤 아래 backdrop로 깔아 함께 어둡게 (Figma 2329:5118) */}
      {s.spot === 'reco-card' ? (
        <View
          pointerEvents="none"
          className="absolute inset-x-0 items-center px-screen"
          style={{ top: insets.top + 140 }}
        >
          <View className="w-full max-w-[362px]">
            <RecoCard onSelect={next} />
          </View>
        </View>
      ) : null}

      {/* 딤 — 디자인 확정 오퍼시티(dimClass): 나의 레시피(2·3) 75% / 그 외(1·4·5·6) 85%. */}
      <View pointerEvents="none" className={`absolute inset-0 ${dimClass}`} />

      {/* 아무 데나 탭해도 다음 (강조 요소·헤더 버튼은 각자 처리) */}
      <Pressable className="absolute inset-0" onPress={next} accessibilityLabel="다음" />

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

      {/* 밤하늘 별 스포트라이트 — 별 원(글로우)과 더블탭 손 아이콘은 위치가 독립적 */}
      {s.spot === 'sky' ? (
        <>
          {/* 별 원 — Figma Overlay+Shadow: 80×80, left 210 / top 160 (중앙 아님). 눌러야 다음 챕터로 */}
          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel="별"
            className="absolute h-20 w-20 items-center justify-center rounded-full bg-background active:opacity-90"
            style={{
              top: 160,
              left: 210,
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
          {/* 더블탭 손 — Figma image806: 96×64, 가로 중앙 / top 245 */}
          <View
            className="absolute inset-x-0 items-center"
            style={{ top: 245 }}
            pointerEvents="none"
          >
            <Image
              source={require('../assets/images/tap.png')}
              style={{ width: 96, height: 64 }}
              contentFit="contain"
            />
          </View>
        </>
      ) : null}

      {/* 온보딩 6 — 딤 위 코치 오버레이: 음식 이미지 위 코치 문구 + 버튼 위 더블탭 손 */}
      {s.spot === 'reco-card' ? (
        <>
          {/* 코치 문구 — 음식 이미지 하단부(카드 상단 +149, Figma Frame …044). 탭은 아래 Pressable로 통과 */}
          <View
            pointerEvents="none"
            className="absolute inset-x-0 px-screen"
            style={{ top: insets.top + 140 + 149 }}
          >
            {coachText}
          </View>
          {/* 더블탭 손 — 버튼 위 (Figma image806 104×69) */}
          <View
            pointerEvents="none"
            className="absolute inset-x-0 items-center"
            style={{ top: insets.top + 140 + 289 }}
          >
            <Image
              source={require('../assets/images/tap.png')}
              style={{ width: 104, height: 69 }}
              contentFit="contain"
            />
          </View>
        </>
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
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="건너뛰기"
            className="active:opacity-80"
          >
            <Image
              source={require('../assets/images/ic-close.png')}
              style={{ width: 18, height: 18 }}
              tintColor={palette.foreground}
              contentFit="contain"
            />
          </Pressable>
        </View>

        {/* 코치 안내 — 레시피 카드 단계는 카드 아래로, 그 외엔 화면 세로 중앙 −35px 고정
            (하단 블록 높이와 무관하게 챕터 간 위치 통일 — Figma: top 50% − 104/2 − 35). */}
        {s.spot === 'recipe-card' ? (
          <View className="flex-1 justify-center" style={{ paddingTop: 200 }} pointerEvents="none">
            {coachText}
          </View>
        ) : s.spot === 'reco-card' ? (
          // 온보딩 6 — 코치/카드는 딤 오버레이로 처리(위). 여기선 스페이서만(네비바 하단 고정)
          <View className="flex-1" pointerEvents="none" />
        ) : (
          <>
            {/* 하단 블록을 바닥에 고정하는 스페이서 */}
            <View className="flex-1" pointerEvents="none" />
            <View
              pointerEvents="none"
              className="absolute inset-x-0 items-center justify-center px-screen"
              style={{ top: 0, bottom: 0, paddingBottom: 70 }}
            >
              {coachText}
            </View>
          </>
        )}

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
            {/* 홈의 + FAB — 이 단계 강조 대상은 레시피 카드이므로 + 버튼은 딤 뒤로(배경처럼 어둡게) */}
            <View>
              <Pressable
                onPress={next}
                accessibilityRole="button"
                accessibilityLabel="레시피 등록"
                className="h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-90"
              >
                <Feather name="plus" size={24} color={palette.ink} />
              </Pressable>
              <View
                className={`absolute inset-0 rounded-full ${dimClass}`}
                pointerEvents="none"
              />
            </View>
          </View>
        ) : s.spot === 'dropdown' ? (
          // 뭐 먹을지 — 추천 드롭다운 펼침(강조 패널 + 토글 버튼)
          <View className="pb-3" pointerEvents="box-none">
            <View className="flex-row items-end justify-end" pointerEvents="box-none">
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
          // 밤하늘 — 실제 홈의 추천 드롭다운(닫힘)과 동일한 버튼. 강조 대상이 아니므로
          // 네비바와 동일하게 그 위에 #060A19 75% 딤을 덮어 배경처럼 어둡게 통일.
          <View className="pb-3" pointerEvents="none">
            <View className="flex-row items-end justify-end">
              <View className="mb-10">
                <View className="h-[50px] w-[173px] flex-row items-center justify-center gap-1.5 rounded-[99px] border border-disabled bg-reco-button">
                  <Text className="text-[16px] leading-[19px] text-foreground">랜덤으로 골라줘</Text>
                  <Image
                    source={require('../assets/images/ic-chevron-down.png')}
                    style={{ width: 24, height: 24 }}
                    tintColor={palette.foreground}
                    contentFit="contain"
                  />
                </View>
                <View
                  className={`absolute inset-0 rounded-[99px] ${dimClass}`}
                  pointerEvents="none"
                />
              </View>
            </View>
          </View>
        )}

        {/* 탭바 — Figma 네비게이션바: pill(field) + 현재 화면 탭=primary, 나머지=tab-inactive.
            padding 13/20/13/19, h68, 그림자 0 20 40 rgba(0,0,0,.35). 아무 데나 탭=다음이라 non-interactive. */}
        <View className="mb-2" pointerEvents="none">
          <View
            className="flex-row items-center justify-between rounded-pill bg-field"
            style={{
              height: 68,
              paddingTop: 13,
              paddingBottom: 13,
              paddingLeft: 20,
              paddingRight: 19,
              shadowColor: '#000000',
              shadowOpacity: 0.35,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 20 },
            }}
          >
            {/* 탭이 강조 대상인 단계(1) — 필바 '배경'만 #060A19 75%로 어둡게(탭은 아래 map에서 위로 올라와 그대로 강조) */}
            {TABS.some((t) => t.key === s.spot) ? (
              <View
                className={`absolute inset-0 rounded-pill ${dimClass}`}
                pointerEvents="none"
              />
            ) : null}
            {TABS.map((t) => {
              // 현재 화면 탭만 골드. 나의 레시피 단계=레시피, 그 외=홈.
              const currentKey = s.header === '나의 레시피' ? 'recipes' : 'home';
              const active = t.key === currentKey;
              // 온보딩 강조 대상 — 흰색 아이콘/글자 + 골드 테두리 글로우 칩. 활성(홈)만 골드.
              const spot = t.key === s.spot;
              const color = active
                ? palette.primary
                : spot
                  ? palette.foreground
                  : palette.tabInactive;
              const textClass = active
                ? 'font-medium text-primary'
                : spot
                  ? 'font-medium text-foreground'
                  : 'text-tab-inactive';
              return (
                <View
                  key={t.key}
                  className={
                    spot ? 'items-center justify-center gap-1' : 'w-[65px] items-center gap-1'
                  }
                  // 강조 박스는 Figma Overlay+Shadow: 80×68(바 높이 꽉 채움), bg=background, primary 테두리, 화이트 글로우
                  style={
                    spot
                      ? {
                          width: 80,
                          height: 68,
                          backgroundColor: palette.background,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: palette.primary,
                          shadowColor: '#FFFFFF',
                          shadowOpacity: 0.2,
                          shadowRadius: 34,
                          shadowOffset: { width: 0, height: 0 },
                        }
                      : undefined
                  }
                >
                  <Image
                    source={t.icon}
                    style={{ width: 24, height: 24 }}
                    tintColor={color}
                    contentFit="contain"
                  />
                  <Text numberOfLines={1} className={`text-[12px] leading-[14px] ${textClass}`}>
                    {t.label}
                  </Text>
                </View>
              );
            })}
          </View>
          {/* spot이 네비 탭이 아니면(2~5챕터) 네비바도 딤 아래로 — #060A19 75%로 통일(Figma 0.75) */}
          {!TABS.some((t) => t.key === s.spot) ? (
            <View className={`absolute inset-0 rounded-pill ${dimClass}`} pointerEvents="none" />
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}
