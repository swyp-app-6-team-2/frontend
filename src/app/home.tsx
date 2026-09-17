import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecommendPopup } from '@/components/recommend-popup';
import { SlotAddedPopup } from '@/components/slot-added-popup';
import { TabBar } from '@/components/tab-bar';
import { palette } from '@/constants/tokens';
import { useIngredients, useProfile, useRecipes, useRecommendRecipe } from '@/hooks/use-api';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { ApiError } from '@/lib/api';
import type { RecipeListItem } from '@/lib/api/types';
import { recommendationModeFor, recommendationToListItem } from '@/lib/recommend';
import { dismissSlotAdded, useSlotJustAdded } from '@/lib/slot-ads';

const RECO = ['랜덤으로 골라줘', '내재료로 골라줘'];

// 레시피 수만큼 밤하늘에 흩뿌리는 반짝이별 — 시야를 안 가리게 상단~중앙 하늘 영역에만.
const MAX_STARS = 24;
type StarSpec = {
  left: number;
  top: number;
  size: number;
  bright: number;
  delay: number;
  dur: number;
};
// 모듈 레벨(react-compiler가 렌더 내 Math.random을 막는다). 위치는 무작위·비겹침 지향.
// Figma: 별 = radial 글로우 2종 — 큰별 60px(밝게) / 작은별 40px(흐리게).
function makeStars(count: number): StarSpec[] {
  return Array.from({ length: Math.min(Math.max(count, 0), MAX_STARS) }, () => {
    const big = Math.random() < 0.4; // 큰별 약 40%
    return {
      left: 14 + Math.random() * 56, // 14%~70% (큰 별이 좌우 가장자리에 안 붙게 안쪽으로)
      top: 15 + Math.random() * 48, // 15%~63% (제목 아래 ~ 캐릭터/드롭다운 위)
      size: big ? 60 : 40, // 큰별 60 / 작은별 40
      bright: big ? 1 : 0.7, // 큰별 밝게 / 작은별 살짝 흐리게(개수는 셀 수 있게 유지)
      delay: Math.random() * 2200,
      dur: 1600 + Math.random() * 1600, // 1.6~3.2s 반짝임 주기
    };
  });
}

// 별 하나 — 투명↔불투명을 천천히 왕복(반짝임). 탭하면 매핑된 레시피를 연다.
function TwinkleStar({
  spec,
  reduceMotion,
  onPress,
}: {
  spec: StarSpec;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const v = useSharedValue(reduceMotion ? 0.8 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    v.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: spec.dur * 0.5, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.08, { duration: spec.dur * 0.5, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [reduceMotion, v, spec.delay, spec.dur]);
  const style = useAnimatedStyle(() => ({
    // 반짝여도 최소 밝기를 유지해 별 개수가 항상 셀 수 있게 한다(사라지지 않음).
    // 큰별/작은별 밝기 차이(spec.bright)는 곱으로 유지.
    opacity: spec.bright * (0.6 + v.value * 0.4),
    transform: [{ scale: 0.65 + v.value * 0.35 }],
  }));
  return (
    <Pressable
      onPress={onPress}
      hitSlop={16}
      accessibilityRole="button"
      accessibilityLabel="레시피 별"
      style={{ position: 'absolute', left: `${spec.left}%`, top: `${spec.top}%` }}
    >
      <Animated.View style={style}>
        <Image
          source={require('../assets/images/star.png')}
          style={{ width: spec.size, height: spec.size }}
          contentFit="contain"
        />
      </Animated.View>
    </Pressable>
  );
}

// 레시피 1개당 별 1개(로드된 목록). 탭하면 onPick(recipe).
function StarField({
  recipes,
  reduceMotion,
  onPick,
}: {
  recipes: RecipeListItem[];
  reduceMotion: boolean;
  onPick: (r: RecipeListItem) => void;
}) {
  const stars = useMemo(() => makeStars(recipes.length), [recipes.length]);
  return (
    <View pointerEvents="box-none" className="absolute inset-0">
      {stars.map((s, i) => (
        <TwinkleStar
          key={i}
          spec={s}
          reduceMotion={reduceMotion}
          onPress={() => onPick(recipes[i])}
        />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  // 별 = 내 레시피(1개당 1개, 최대 MAX_STARS). '나의 레시피' 화면과 같은 쿼리(size:100)를 써서
  // 캐시를 공유 → 별 개수가 목록의 '총 N개'와 항상 일치. recipes[i] 로 각 별이 레시피에 매핑된다.
  const { data } = useRecipes({ sort: 'LATEST', size: 100 });
  const recipes = data?.recipes ?? [];
  useIngredients(); // 재료관리 탭 워밍업(staleTime Infinity라 세션당 1회만 fetch)
  const reduceMotion = useReduceMotion(); // 밤하늘 별 = 내 레시피 수(1개당 1개, 탭 시 팝업)
  const slotAdded = useSlotJustAdded(); // 슬롯 확장에서 광고 시청 후 복귀 → 성공 팝업
  const [reco, setReco] = useState(RECO[0]);
  const [open, setOpen] = useState(false);
  const [recommend, setRecommend] = useState<RecipeListItem | null>(null);
  const recommendRecipe = useRecommendRecipe();
  const lastRecoId = useRef<number | undefined>(undefined); // 재추천 시 직전 제외용
  // 남은 별 개수 = 남은 레시피 저장 슬롯(GET /users/me). 로드 전엔 0.
  const { data: me } = useProfile();
  const remainingStars = me?.remainingRecipeSlots ?? 0;

  // 추천 옵션 선택 → 백엔드 추천 API 호출 → 결과 팝업. previousRecipeId로 직전과 다르게.
  const onRecommend = async (label: string) => {
    setReco(label);
    setOpen(false);
    const recommendationMode = recommendationModeFor(label, RECO);
    try {
      const r = await recommendRecipe.mutateAsync({
        recommendationMode,
        previousRecipeId: lastRecoId.current,
      });
      // 후보 없음(200 + null) — 방식별로 다른 안내. 전체 랜덤으로 자동 전환하지 않는다(백엔드 계약).
      if (!r) {
        Alert.alert(
          '추천할 레시피가 없어요',
          recommendationMode === 'INGREDIENT_BASED'
            ? '보유 재료와 맞는 레시피가 없어요.\n재료를 추가하거나 랜덤으로 골라보세요.'
            : '먼저 레시피를 저장해주세요.',
        );
        return;
      }
      lastRecoId.current = r.recipeId;
      setRecommend(recommendationToListItem(r));
    } catch (e) {
      Alert.alert(
        '추천을 불러오지 못했어요',
        e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.',
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* 구름 배경 + 바닥 돔 + 캐릭터 */}
      <View pointerEvents="none" className="absolute inset-0">
        <Image
          source={require('../assets/images/sky-bg.png')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {/* 바닥 돔 — 하단 전체 */}
        <Image
          source={require('../assets/images/notify-bottom.png')}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            aspectRatio: 402 / 257,
          }}
          contentFit="cover"
        />
        {/* 캐릭터 — 바닥 위 왼쪽(추천 드롭다운과 겹치지 않게) */}
        <Image
          source={require('../assets/images/mascot-blob.png')}
          style={{ position: 'absolute', left: '14%', bottom: 138, width: 110, height: 110 }}
          contentFit="contain"
        />
      </View>

      {/* 레시피 별 — 탭하면 그 레시피가 팝업으로 */}
      <StarField recipes={recipes} reduceMotion={reduceMotion} onPick={setRecommend} />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']} pointerEvents="box-none">
        {/* 상단: 별따먹자 + 별 진행도 */}
        <View
          className="flex-row items-center justify-between px-screen pt-2"
          pointerEvents="box-none"
        >
          <Image
            source={require('../assets/images/home-title.png')}
            style={{ width: 84, height: 24 }}
            contentFit="contain"
            accessibilityLabel="별따먹자"
          />
          {/* 남은 별 칩 — Figma: 골드 테두리 pill(#1E1E20) + 별 아이콘 15 + '남은 별' + 개수 */}
          <View className="h-[38px] flex-row items-center gap-1 rounded-pill border border-primary bg-star-chip px-4">
            <Image
              source={require('../assets/images/star-chip.png')}
              style={{ width: 15, height: 15 }}
              contentFit="contain"
            />
            <Text className="text-[14px] font-medium leading-[18px] text-foreground">남은 별</Text>
            <Text className="text-[14px] font-medium leading-[18px] text-foreground">
              {remainingStars}
            </Text>
          </View>
        </View>

        {/* 중앙 여백 — 헤더와 하단 추천 사이 (예전 중앙 별 자리) */}
        <View className="flex-1" pointerEvents="none" />

        {/* 하단: 추천 드롭다운 (캐릭터는 배경 오버레이로 이동) */}
        <View className="px-screen pb-3" pointerEvents="box-none">
          <View className="flex-row items-end justify-end" pointerEvents="box-none">
            <View className="mb-10 items-end gap-2" pointerEvents="box-none">
              {open ? (
                <View className="w-[173px] gap-[10px] rounded-[20px] bg-reco-panel px-1 py-2">
                  {RECO.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => onRecommend(r)}
                      className="h-[47px] items-center justify-center active:opacity-80"
                    >
                      <Text className="text-[16px] leading-[19px] text-foreground">{r}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Pressable
                onPress={() => setOpen((o) => !o)}
                className="h-[50px] w-[173px] flex-row items-center justify-center gap-1.5 rounded-[99px] border border-disabled bg-reco-button active:opacity-80"
              >
                <Text className="text-[16px] leading-[19px] text-foreground">{reco}</Text>
                <Image
                  source={require('../assets/images/ic-chevron-down.png')}
                  style={{
                    width: 24,
                    height: 24,
                    transform: [{ rotate: open ? '180deg' : '0deg' }],
                  }}
                  tintColor={open ? palette.disabled : palette.foreground}
                  contentFit="contain"
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* 떠 있는 탭바 */}
        <TabBar active="home" />
      </SafeAreaView>

      {/* 메뉴 추천 결과 팝업 */}
      {recommend ? (
        <RecommendPopup
          recipe={recommend}
          onView={() => {
            const id = recommend.recipeId;
            setRecommend(null);
            router.push({ pathname: '/recipe-view', params: { id: String(id) } });
          }}
          onClose={() => setRecommend(null)}
        />
      ) : null}

      {/* 슬롯 확장에서 광고 시청 후 복귀 시 성공 팝업 */}
      <SlotAddedPopup visible={slotAdded} onClose={dismissSlotAdded} />
    </View>
  );
}
