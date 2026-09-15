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
import { AppText } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useIngredients, useRecipes } from '@/hooks/use-api';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import type { RecipeListItem } from '@/lib/api/types';
import { dismissSlotAdded, useSlotJustAdded } from '@/lib/slot-ads';

const RECO = ['랜덤으로 골라줘', '내재료로 골라줘'];

// 저장 레시피 중 랜덤 1개(재추천 시 직전과 다르게). 없으면 null.
// 모듈 레벨(react-compiler가 렌더 내 Math.random을 impure로 막는다).
function pickRandomRecipe(recipes: RecipeListItem[], excludeId?: number): RecipeListItem | null {
  const pool = recipes.filter((r) => r.recipeId !== excludeId);
  const list = pool.length > 0 ? pool : recipes;
  return list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null;
}

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
      bright: big ? 1 : 0.45, // 큰별 밝게 / 작은별 흐리게
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
    // 큰별/작은별 밝기 차이(spec.bright)를 반짝임 위에 곱한다.
    opacity: (0.08 + v.value * 0.92) * spec.bright,
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
  // 나의 레시피 화면과 같은 쿼리 키(sort:'LATEST')를 써서 캐시를 공유 → 탭 진입 즉시 표시.
  const { data } = useRecipes({ sort: 'LATEST' });
  const recipes = data?.recipes ?? [];
  useIngredients(); // 재료관리 탭 워밍업(staleTime Infinity라 세션당 1회만 fetch)
  const reduceMotion = useReduceMotion(); // 밤하늘 별 = 내 레시피 수(1개당 1개, 탭 시 팝업)
  const slotAdded = useSlotJustAdded(); // 슬롯 확장에서 광고 시청 후 복귀 → 성공 팝업
  const [hasStar, setHasStar] = useState(true);
  const [reco, setReco] = useState(RECO[0]);
  const [open, setOpen] = useState(false);
  const [recommend, setRecommend] = useState<RecipeListItem | null>(null);
  const lastTap = useRef(0);

  // 추천 옵션 선택 → 랜덤 레시피 팝업 (저장 레시피 없으면 안내)
  const onRecommend = (label: string) => {
    setReco(label);
    setOpen(false);
    const rec = pickRandomRecipe(recipes);
    if (rec) setRecommend(rec);
    else Alert.alert('추천할 레시피가 없어요', '먼저 레시피를 저장해주세요.');
  };

  // 더블탭 → 별 토글(별똥별 떨어짐)
  const onSkyTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) setHasStar((s) => !s);
    lastTap.current = now;
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

      {/* 빈 하늘 더블탭 영역 */}
      <Pressable className="absolute inset-0" onPress={onSkyTap} accessibilityLabel="밤하늘" />

      {/* 레시피 별 — 탭하면 그 레시피가 팝업으로 (더블탭 하늘 위 레이어) */}
      <StarField recipes={recipes} reduceMotion={reduceMotion} onPick={setRecommend} />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']} pointerEvents="box-none">
        {/* 상단: 별따먹자 + 별 진행도 */}
        <View
          className="flex-row items-center justify-between px-screen pt-2"
          pointerEvents="box-none"
        >
          <AppText variant="title">별따먹자</AppText>
          <View className="flex-row items-center gap-1 rounded-pill border border-primary/40 bg-surface/60 px-3 py-1">
            <Text className="text-primary">★</Text>
            <Text className="font-bold text-foreground">5/10</Text>
          </View>
        </View>

        {/* 중앙 별 */}
        <View className="flex-1 items-center justify-center" pointerEvents="none">
          {hasStar ? (
            <Image
              source={require('../assets/images/star.png')}
              style={{ width: 40, height: 40 }}
              contentFit="contain"
            />
          ) : null}
        </View>

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
          onReroll={() => setRecommend((cur) => pickRandomRecipe(recipes, cur?.recipeId) ?? cur)}
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
