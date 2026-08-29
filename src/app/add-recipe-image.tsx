import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';

// [stub] 17 캡쳐본으로 등록 — 이미지 업로드 → OCR.
export default function AddRecipeImageScreen() {
  const router = useRouter();
  return (
    <Screen title="이미지로 등록" back scroll>
      <View className="h-48 items-center justify-center rounded-card border border-dashed border-foreground/20 bg-field">
        <Text className="text-[36px]">🖼</Text>
        <AppText variant="chip" className="text-muted">
          캡쳐 이미지 업로드
        </AppText>
      </View>
      <View className="gap-3">
        <Button label="다음" onPress={() => router.push('/add-recipe-loading')} />
        <Button
          label="(실패 시뮬)"
          variant="secondary"
          onPress={() => router.push('/ocr-failed')}
        />
      </View>
    </Screen>
  );
}
