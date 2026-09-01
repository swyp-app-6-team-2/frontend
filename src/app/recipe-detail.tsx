import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SectionTitle, Tag } from '@/components/ui';

const INGREDIENTS: [string, string][] = [
  ['양파', '1개'],
  ['대파', '2대'],
  ['김치', '반 포기'],
];

const STEPS = [
  '냄비에 잘 익은 김치와 삼겹살을 먼저 올리고',
  '김칫국물 1국자와 물 350ml를 부어주세요',
  '중불로 20분간 자작하게 끓여주세요',
  '삼겹살이 익으면 대파를 올리고 마무리해요',
];

export default function RecipeDetailScreen() {
  const router = useRouter();
  return (
    <Screen title="내용 확인" back scroll>
      {/* AI 안내 배지 */}
      <View className="self-start rounded-pill bg-primary-subtle px-3 py-1.5">
        <Text className="text-chip font-semibold text-on-primary">
          ✨ AI가 자동으로 정리했어요 · 수정할 수 있어요
        </Text>
      </View>

      {/* 요리 이미지 */}
      <View className="h-40 overflow-hidden rounded-card bg-field">
        <Image
          source={require('../assets/images/food-sample.png')}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>

      {/* 요리명 */}
      <View className="gap-1">
        <SectionTitle onEdit={() => {}}>요리명</SectionTitle>
        <AppText className="text-[18px] font-bold">누구나 성공하는 초간단 목살김치찜</AppText>
        <AppText variant="chip" className="text-muted">
          🍽 1인분
        </AppText>
      </View>

      {/* 카테고리 · 태그 */}
      <View className="gap-2">
        <SectionTitle>카테고리 · 태그</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          <Tag label="한식" active />
          <Tag label="김치" />
          <Tag label="돼지고기" />
        </View>
      </View>

      {/* 재료 */}
      <View className="gap-2">
        <SectionTitle onEdit={() => {}}>{`재료 (${INGREDIENTS.length})`}</SectionTitle>
        <View className="overflow-hidden rounded-card border border-foreground/10">
          <View className="bg-surface px-4 py-2.5">
            <Text className="text-chip font-bold text-foreground">재료</Text>
          </View>
          {INGREDIENTS.map(([name, amount]) => (
            <View
              key={name}
              className="flex-row items-center justify-between border-t border-foreground/10 px-4 py-3"
            >
              <Text className="text-body font-semibold text-foreground">{name}</Text>
              <Text className="text-body text-muted">{amount}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 조리 순서 */}
      <View className="gap-2">
        <SectionTitle onEdit={() => {}}>{`조리 순서 (${STEPS.length})`}</SectionTitle>
        <View className="gap-3">
          {STEPS.map((step, i) => (
            <View key={step} className="flex-row items-start gap-3">
              <View className="mt-0.5 size-6 items-center justify-center rounded-lg bg-field">
                <Text className="text-chip font-bold text-muted">{i + 1}</Text>
              </View>
              <AppText className="flex-1">{step}</AppText>
            </View>
          ))}
        </View>
      </View>

      {/* 하단 버튼 */}
      <View className="mt-2 flex-row gap-3 pb-6">
        <View className="flex-1">
          <Button label="다시 확인할게요" variant="secondary" onPress={() => router.back()} />
        </View>
        <View className="flex-1">
          {/* 저장 → 레시피 상세. ⭐요리완료는 상세의 "요리 완료" 액션에서 */}
          <Button label="저장하기" onPress={() => router.replace('/recipe-view')} />
        </View>
      </View>
    </Screen>
  );
}
