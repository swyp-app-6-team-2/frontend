import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';
import { isGuest, promptGuestLogin } from '@/lib/guest';

// [stub] 15 등록 방법 선택 — URL / 이미지 / 직접 입력.
export default function AddRecipeScreen() {
  const router = useRouter();
  // AI 분석(URL·이미지)은 백엔드 계정 기능 → 게스트는 로그인 유도. 직접 등록은 로컬 저장으로 허용.
  const gateAI = (go: () => void) => () => {
    if (isGuest()) {
      promptGuestLogin(() => router.push('/login'), 'AI 자동 등록은 로그인 후 이용할 수 있어요.');
      return;
    }
    go();
  };
  return (
    <Screen title="어떻게 등록할까요?" back scroll>
      <View className="gap-3">
        <Button
          label="🔗 URL로 등록"
          variant="secondary"
          onPress={gateAI(() => router.push('/add-recipe-url'))}
        />
        <AppText variant="chip" className="text-muted">
          링크를 붙여넣으면 AI가 레시피로 만들어요
        </AppText>
        <Button
          label="🖼 이미지로 등록"
          variant="secondary"
          onPress={gateAI(() => router.push('/add-recipe-image'))}
        />
        <AppText variant="chip" className="text-muted">
          사진 속 글자에서 레시피를 불러와요
        </AppText>
        <Button
          label="✍️ 직접 등록"
          variant="secondary"
          onPress={() => router.push('/add-recipe-manual')}
        />
        <AppText variant="chip" className="text-muted">
          재료와 순서를 하나씩 직접 입력해요
        </AppText>
      </View>
    </Screen>
  );
}
