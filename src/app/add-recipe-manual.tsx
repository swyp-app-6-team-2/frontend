import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SearchBar } from '@/components/ui';
import { palette } from '@/constants/tokens';

const CATEGORIES = ['한식', '양식', '중식', '일식', '분식', '아시안', '기타'];

// 18 레시피 직접 입력 — 대표 사진 + 이름 + 카테고리 (Figma 619:9650).
export default function AddRecipeManualScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('한식');

  return (
    <Screen title="레시피 직접 입력" back scroll>
      {/* 대표 사진 추가 (선택) — 정사각 field 박스, 중앙 카메라+안내 */}
      <Pressable
        className="aspect-square w-full items-center justify-center rounded-[12px] bg-field active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel="대표 사진 추가"
      >
        <View className="flex-row items-center gap-[10px]">
          <Image
            source={require('../assets/images/ic-camera.png')}
            style={{ width: 24, height: 24 }}
            tintColor={palette.muted}
            contentFit="contain"
          />
          <AppText variant="body" className="font-normal text-muted">
            대표 사진 추가 (선택)
          </AppText>
        </View>
      </Pressable>

      {/* 이름 */}
      <View className="gap-2">
        <AppText variant="body" className="text-foreground">
          이름
        </AppText>
        <SearchBar placeholder="레시피명" leftIcon={null} />
      </View>

      {/* 카테고리 — 선택 칩(골드)·나머지 outline */}
      <View className="gap-2">
        <AppText variant="body" className="text-foreground">
          카테고리
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                accessibilityRole="button"
                className={`h-9 items-center justify-center rounded-pill border border-field px-4 active:opacity-80 ${
                  on ? 'bg-primary' : ''
                }`}
              >
                <Text
                  className={`text-[14px] leading-[17px] ${on ? 'text-surface' : 'text-foreground'}`}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button label="저장하기" onPress={() => router.replace('/recipe-view')} />
    </Screen>
  );
}
