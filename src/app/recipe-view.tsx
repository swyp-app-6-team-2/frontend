import { Fragment } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText, Button, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';

// 21 레시피 상세 — 저장된 레시피 보기 (Figma). mock 데이터.
const CATEGORY = '한식';
const TITLE = '들기름 막국수';
const SERVINGS = '2인분';
const TIME = '15분';

const INGREDIENTS: [string, string][] = [
  ['메밀면', '200g'],
  ['들기름', '1.5큰술'],
  ['간장', '1큰술'],
  ['김', '2장'],
  ['대파', '0.5단'],
];

const STEPS = [
  '끓는 물에 메밀면을 3분 삶는다.',
  '볼에 들기름과 간장을 섞어 소스를 만든다.',
  '삶은 면을 찬물에 헹궈 물기를 완전히 뺀다.',
  '소스에 면을 버무리고 김을 부숴 올린다.',
];

export default function RecipeViewScreen() {
  const router = useRouter();

  return (
    <Screen title="" back>
      <View className="flex-1">
        <ScrollView contentContainerClassName="pb-4" showsVerticalScrollIndicator={false}>
          {/* 대표 이미지 362x362 */}
          <Image
            source={require('../assets/images/food-sample.png')}
            style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }}
            contentFit="cover"
          />

          {/* 카테고리 칩 */}
          <View className="mt-6 self-start rounded-[4px] bg-field px-3 py-1">
            <Text className="text-[14px] leading-[17px] text-muted">{CATEGORY}</Text>
          </View>

          {/* 제목 */}
          <Text className="mt-3 text-[24px] font-bold leading-[29px] text-foreground">{TITLE}</Text>

          {/* 인분 / 시간 */}
          <View className="mt-3 flex-row items-center gap-4">
            <View className="flex-row items-center gap-2">
              <Feather name="user" size={22} color={palette.muted} />
              <Text className="text-[16px] leading-[19px] text-foreground">{SERVINGS}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Feather name="clock" size={22} color={palette.muted} />
              <Text className="text-[16px] leading-[19px] text-foreground">{TIME}</Text>
            </View>
          </View>

          {/* 재료 카드 — 이름/수량 행 + 구분선 */}
          <View className="mt-7 gap-4 rounded-[12px] bg-field px-4 py-5">
            {INGREDIENTS.map(([name, amount], i) => (
              <Fragment key={name}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[16px] font-medium leading-[21px] text-foreground">
                    {name}
                  </Text>
                  <Text className="text-[16px] font-medium leading-[21px] text-muted">
                    {amount}
                  </Text>
                </View>
                {i < INGREDIENTS.length - 1 ? <View className="h-px bg-disabled" /> : null}
              </Fragment>
            ))}
          </View>

          {/* 레시피(조리 순서) */}
          <AppText variant="body" className="mt-9 font-normal">
            레시피
          </AppText>
          <View className="mt-4 gap-6">
            {STEPS.map((step, i) => (
              <View key={step} className="flex-row items-start gap-4">
                <View
                  className="h-5 w-5 items-center justify-center rounded-full bg-surface"
                  style={{ borderWidth: 1, borderColor: palette.primary }}
                >
                  <Text className="text-[14px] leading-[18px] text-primary">{i + 1}</Text>
                </View>
                <Text className="flex-1 text-[16px] leading-[21px] text-foreground">{step}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 하단 고정 완료 버튼 */}
      <View className="pb-8 pt-4">
        <Button label="완료하기" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
