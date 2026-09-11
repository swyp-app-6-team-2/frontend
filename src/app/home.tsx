import { useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecommendPopup } from '@/components/recommend-popup';
import { TabBar } from '@/components/tab-bar';
import { AppText } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useIngredients, useRecipes } from '@/hooks/use-api';
import type { RecipeListItem } from '@/lib/api/types';

const RECO = ['랜덤으로 골라줘', '내재료로 골라줘'];

// 저장 레시피 중 랜덤 1개(재추천 시 직전과 다르게). 없으면 null.
// 모듈 레벨(react-compiler가 렌더 내 Math.random을 impure로 막는다).
function pickRandomRecipe(recipes: RecipeListItem[], excludeId?: number): RecipeListItem | null {
  const pool = recipes.filter((r) => r.recipeId !== excludeId);
  const list = pool.length > 0 ? pool : recipes;
  return list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null;
}

export default function HomeScreen() {
  const router = useRouter();
  // 나의 레시피 화면과 같은 쿼리 키(sort:'LATEST')를 써서 캐시를 공유 → 탭 진입 즉시 표시.
  const { data } = useRecipes({ sort: 'LATEST' });
  const recipes = data?.recipes ?? [];
  useIngredients(); // 재료관리 탭 워밍업(staleTime Infinity라 세션당 1회만 fetch)
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
      {/* 산 배경 + 캐릭터 — 애셋 네이티브 비율 유지(왜곡 방지) */}
      <View pointerEvents="none" className="absolute inset-0">
        {/* 왼쪽 봉우리 (뒤) — 캐릭터가 앉는 산 */}
        <Image
          source={require('../assets/images/mountain2.png')}
          style={{
            position: 'absolute',
            bottom: 10,
            left: '45%', // 화면 폭 기준(≈180/402) — 기종별 폭 변화에 대응
            width: '58%',
            aspectRatio: 253 / 119,
          }}
          contentFit="contain"
        />
        {/* 앞쪽 큰 산 (바닥 전체) */}
        <Image
          source={require('../assets/images/mountain.png')}
          style={{
            position: 'absolute',
            bottom: -45,
            left: '-8%',
            width: '116%',
            aspectRatio: 328 / 176,
          }}
          contentFit="cover"
        />
        {/* 캐릭터 — 왼쪽 봉우리(mountain2) crest 위에 */}
        <Image
          source={require('../assets/images/character.png')}
          style={{ position: 'absolute', left: '19%', bottom: 178, width: 49, height: 46 }}
          contentFit="contain"
        />
      </View>

      {/* 빈 하늘 더블탭 영역 */}
      <Pressable className="absolute inset-0" onPress={onSkyTap} accessibilityLabel="밤하늘" />

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
    </View>
  );
}
