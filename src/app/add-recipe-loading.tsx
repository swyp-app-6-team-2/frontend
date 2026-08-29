import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';

// [stub] 16-2 콘텐츠 확인 중 — AI가 영상/이미지를 레시피로 정리하는 로딩.
const STEPS = ['영상 정보 불러오기', '재료 · 수량 인식하기', '조리 순서 정리하기'];

export default function AddRecipeLoadingScreen() {
  const router = useRouter();
  return (
    <Screen title="콘텐츠를 확인하고 있어요" back scroll>
      <View className="items-center gap-2 py-8">
        <Text className="text-[40px]">✨</Text>
        <AppText variant="body" className="text-center text-muted">
          AI가 재료와 조리 순서를 레시피로 정리하고 있어요
        </AppText>
      </View>
      <View className="gap-3">
        {STEPS.map((s) => (
          <AppText key={s} variant="body">
            ○ {s}
          </AppText>
        ))}
      </View>
      <Button label="완료 (내용 확인으로)" onPress={() => router.replace('/recipe-detail')} />
    </Screen>
  );
}
