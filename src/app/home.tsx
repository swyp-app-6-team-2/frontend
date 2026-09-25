import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { AppRefreshControl } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useIngredients, useProfile, useRecipes, useRecommendRecipe } from '@/hooks/use-api';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { useRefresh } from '@/hooks/use-refresh';
import { ApiError } from '@/lib/api';
import type { RecipeListItem } from '@/lib/api/types';
import { isGuest, listGuestRecipes, promptGuestLogin } from '@/lib/guest';
import { recommendationModeFor, recommendationToListItem } from '@/lib/recommend';
import { dismissSlotAdded, useSlotJustAdded } from '@/lib/slot-ads';
import { remainingSlots } from '@/lib/slots';

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
// 모듈 레벨(react-compiler가 렌더 내 Math.random을 막는다). 위치는 무작위지만 서로 안 뭉치게.
// Figma: 별 = radial 글로우 2종 — 큰별 60px(밝게) / 작은별 40px(흐리게).
// 화면이 세로로 길어(약 2.2:1) 세로 거리에 가중치를 줘야 시각적 간격이 고르다.
const V_WEIGHT = 2.2;
// best-candidate 샘플링: 새 별마다 후보 여럿 중 기존 별들과 가장 먼 위치를 골라 균등하게 퍼뜨린다.
function makeStars(count: number): StarSpec[] {
  const n = Math.min(Math.max(count, 0), MAX_STARS);
  const placed: { left: number; top: number }[] = [];
  return Array.from({ length: n }, () => {
    let best = { left: 14 + Math.random() * 56, top: 15 + Math.random() * 48 };
    let bestDist = -1;
    for (let c = 0; c < 12; c++) {
      const left = 14 + Math.random() * 56; // 14%~70% (큰 별이 좌우 가장자리에 안 붙게 안쪽으로)
      const top = 15 + Math.random() * 48; // 15%~63% (제목 아래 ~ 캐릭터/드롭다운 위)
      let minD = Infinity; // 가장 가까운 기존 별까지의 거리²
      for (const p of placed) {
        const dx = left - p.left;
        const dy = (top - p.top) * V_WEIGHT;
        minD = Math.min(minD, dx * dx + dy * dy);
      }
      if (minD > bestDist) {
        bestDist = minD;
        best = { left, top };
      }
    }
    placed.push(best);
    const big = Math.random() < 0.4; // 큰별 약 40%
    return {
      left: best.left,
      top: best.top,
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
  const guest = isGuest();
  const { data } = useRecipes({ sort: 'LATEST', size: 100 }, !guest);
  // 게스트는 로컬 레시피를 별로 표시(백엔드 미사용). 정식 세션은 서버 목록.
  const recipes = guest ? listGuestRecipes() : (data?.recipes ?? []);
  useIngredients(!guest); // 재료관리 탭 워밍업(게스트는 스킵)
  const reduceMotion = useReduceMotion(); // 밤하늘 별 = 내 레시피 수(1개당 1개, 탭 시 팝업)
  const slotAdded = useSlotJustAdded(); // 슬롯 확장에서 광고 시청 후 복귀 → 성공 팝업
  const [reco, setReco] = useState(RECO[0]);
  const [open, setOpen] = useState(false);
  const [recommend, setRecommend] = useState<RecipeListItem | null>(null);
  const recommendRecipe = useRecommendRecipe();
  const lastRecoId = useRef<number | undefined>(undefined); // 재추천 시 직전 제외용
  // 남은 별 = 슬롯 한도 − 등록된 레시피 수(별 개수와 일치). 로드 전엔 0.
  const { data: me } = useProfile();
  const remainingStars = remainingSlots(me, data?.totalCount ?? recipes.length);
  const refresh = useRefresh(); // 당겨서 새로고침 — 화면 활성 쿼리(레시피·프로필) refetch

  // 밤하늘 더블탭 → 별똥별 애니메이션(GIF)을 한 번만 재생하고 사라진다.
  // GIF는 loop=1로 패치돼(무한루프 X) 1회 재생 후 마지막 프레임에서 멈춘다. 그래서 넉넉히(2000ms)
  // 잡아도 2번째 사이클이 안 보이고, 렌더 지연이 있어도 끝(별 낙하)까지 확실히 보인 뒤 사라진다.
  // 타이머는 실제 첫 프레임 표시(onDisplay)부터 잰다.
  const SHOOTING_STAR_MS = 2000;
  const [shootingStar, setShootingStar] = useState(false);
  const lastTap = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (hideTimer.current && clearTimeout(hideTimer.current)), []);
  // GIF가 실제로 표시된 순간 호출 → 한 사이클 뒤 숨김(두 번째 루프 전에).
  // onDisplay가 중복 호출돼도 타이머를 연장하지 않도록 이미 예약됐으면 무시.
  const onShootingStarDisplay = () => {
    if (hideTimer.current) return;
    hideTimer.current = setTimeout(() => {
      setShootingStar(false);
      hideTimer.current = null; // 다음 더블탭에 다시 재생되도록 초기화
      // 별똥별이 다 떨어지면 랜덤으로 메뉴 추천 팝업을 띄운다. (게스트는 추천이 계정 기능이라 제외)
      if (!guest) void onRecommend(RECO[0]);
    }, SHOOTING_STAR_MS);
  };
  const onSkyTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) setShootingStar(true);
    lastTap.current = now;
  };

  // 추천 옵션 선택 → 백엔드 추천 API 호출 → 결과 팝업. previousRecipeId로 직전과 다르게.
  const onRecommend = async (label: string) => {
    // 추천은 백엔드(내 레시피 기반) 계정 기능 → 게스트는 로그인 유도.
    if (guest) {
      promptGuestLogin(() => router.push('/login'), '메뉴 추천은 로그인 후 이용할 수 있어요.');
      return;
    }
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
      {/* 밤하늘 전체를 bounce 스크롤로 감싸 위에서 당기면 새로고침(refetch). 별 탭·더블탭·드롭다운은
          탭이라 자식으로 통과하고, 수직 드래그만 새로고침 제스처로 잡힌다. 배경까지 함께 감싸
          당길 때 씬 전체가 따라 내려오고 상단엔 배경색이 드러난다. */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        refreshControl={<AppRefreshControl {...refresh} />}
      >
        {/* 구름 배경 + 바닥 돔 + 캐릭터 */}
        <View pointerEvents="none" className="absolute inset-0">
          {/* 바닥 고정 + 위로 확대 — 구름을 더 위로 올리되 하단에 틈이 안 생기게.
              bottom:50 으로 구름을 50 더 올린다(생기는 하단 틈은 바닥 돔이 덮는다). 비율 무관. */}
          <Image
            source={require('../assets/images/sky-bg.png')}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 20, height: '122%' }}
            contentFit="cover"
            contentPosition="bottom"
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
          {/* 캐릭터 — 하단 왼쪽(30%) 글로우 스필 위, 돔 능선에 앉은 느낌(탭바 바로 위).
              translateX -55는 110폭 정렬 보정이라 실제 중심 = 30%. bottom 120은 노치 safe-area 기준
              탭바 상단(~110) 바로 위라 안 가림. 추천 버튼은 우측이라 무관. */}
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

        {/* 밤하늘 더블탭 감지 (빈 하늘). 별·칩·드롭다운·탭바는 위 레이어라 그대로 동작 */}
        <Pressable className="absolute inset-0" onPress={onSkyTap} accessibilityLabel="밤하늘" />

        {/* 레시피 별 — 탭하면 그 레시피가 팝업으로 */}
        <StarField recipes={recipes} reduceMotion={reduceMotion} onPick={setRecommend} />

        {/* 별똥별 애니메이션 — 더블탭 시 하늘을 가로질러 재생(터치 통과) */}
        {shootingStar ? (
          <Image
            source={require('../assets/images/shooting-star.gif')}
            // contain이라 세로 중앙에 오는 GIF를 위로 올려 더 높은 데서 떨어지게 한다.
            style={[StyleSheet.absoluteFill, { transform: [{ translateY: -140 }] }]}
            contentFit="contain"
            pointerEvents="none"
            accessibilityLabel="별똥별"
            onDisplay={onShootingStarDisplay}
          />
        ) : null}

        <SafeAreaView className="flex-1" edges={['top', 'bottom']} pointerEvents="box-none">
          {/* 상단: 별따먹자 + 별 진행도. 안드로이드는 상태바 인셋이 얇아 상단 여백 보강. */}
          <View
            className={`flex-row items-center justify-between px-screen ${Platform.OS === 'android' ? 'pt-7' : 'pt-2'}`}
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
              <Text className="text-[14px] font-medium leading-[18px] text-foreground">
                남은 별
              </Text>
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
      </ScrollView>

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
