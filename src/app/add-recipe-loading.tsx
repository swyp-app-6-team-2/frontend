import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Screen } from '@/components/ui';

// 16-2 콘텐츠 확인 중 — AI가 영상/이미지를 레시피로 정리하는 로딩.
export default function AddRecipeLoadingScreen() {
  const router = useRouter();
  return (
    <Screen title="URL로 등록" back>
      <View className="flex-1 items-center justify-center gap-8">
        <View className="h-56 w-full items-center justify-center rounded-card border border-dashed border-foreground/15">
          <AppText variant="chip" className="text-muted">
            (gif or img)
          </AppText>
        </View>

        <AppText variant="body" className="text-center text-muted">
          AI가 영상 속 재료와 조리 순서를{'\n'}레시피로 정리하고 있어요
        </AppText>

        {/* 진행 바 */}
        <View className="h-2 w-full overflow-hidden rounded-full bg-field">
          <View className="h-full w-3/5 rounded-full bg-primary" />
        </View>
      </View>

      <View className="items-end pb-4">
        <Text
          className="text-chip text-muted"
          onPress={() => router.replace('/recipe-detail')}
          accessibilityRole="button"
        >
          0/1
        </Text>
      </View>
    </Screen>
  );
}
