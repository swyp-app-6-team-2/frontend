import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';

// 17 이미지로 등록 — 캡처 이미지 업로드 → OCR 로딩으로.
export default function AddRecipeImageScreen() {
  const router = useRouter();
  const [picked, setPicked] = useState(false);

  return (
    <Screen title="이미지로 등록" back>
      <View className="flex-1">
        <View className="gap-2 pt-2">
          <AppText variant="title">레시피 이미지를 올려주세요</AppText>
          <AppText variant="body" className="text-muted">
            이미지를 통해 AI가 레시피의 자료를 추출해{'\n'}쉽게 등록이 가능합니다
          </AppText>
        </View>

        <View className="mt-6">
          <Pressable
            onPress={() => setPicked(true)}
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/25 bg-field/30 active:opacity-90"
            accessibilityRole="button"
          >
            <Image
              source={require('../assets/images/ic-camera.png')}
              style={{ width: 20, height: 20 }}
              tintColor={palette.muted}
              contentFit="contain"
            />
            <Text className="text-body text-muted">대표 사진 추가 (선택)</Text>
          </Pressable>
        </View>
      </View>

      <View className="pb-4">
        <Button
          label="등록하기"
          disabled={!picked}
          onPress={() => router.push('/add-recipe-loading')}
        />
      </View>
    </Screen>
  );
}
