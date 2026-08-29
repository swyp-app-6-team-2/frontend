import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SearchBar } from '@/components/ui';

// [stub] 16 URL로 등록 — 링크 입력 → AI 분석.
export default function AddRecipeUrlScreen() {
  const router = useRouter();
  return (
    <Screen title="URL로 등록" back scroll>
      <AppText variant="body" className="text-muted">
        유튜브·인스타 요리 영상은 AI가 레시피로 만들고, 일반 링크는 원본 그대로 보관해요
      </AppText>
      <SearchBar placeholder="레시피 링크를 넣어주세요" leftIcon={null} />
      <View className="gap-3">
        <Button label="다음" onPress={() => router.push('/add-recipe-loading')} />
        <Button
          label="(실패 시뮬)"
          variant="secondary"
          onPress={() => router.push('/url-failed')}
        />
      </View>
    </Screen>
  );
}
