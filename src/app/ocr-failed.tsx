import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import type { IngestionFailureCode } from '@/lib/api';

// 실패 원인(failureCode)별 안내 문구. 로딩 화면이 job.failureCode를 `code`로 넘긴다.
// code가 비어 있으면 폴링 GET 자체가 실패한 것(네트워크/통신 오류)이다.
const COPY: Record<IngestionFailureCode, { title: string; message: string }> = {
  CONTENT_NOT_RECOGNIZED: {
    title: '레시피를 인식하지 못했어요',
    message: '이미지 속 재료·조리 순서를 찾지 못했어요.\n다른 이미지로 다시 시도해주세요',
  },
  MULTIPLE_RECIPES: {
    title: '레시피가 여러 개 감지됐어요',
    message: '한 번에 하나의 레시피만 등록할 수 있어요.\n하나만 담긴 이미지를 올려주세요',
  },
  PROCESSING_FAILED: {
    title: '분석 중 오류가 발생했어요',
    message: '잠시 후 다시 시도하거나\n직접 입력해주세요',
  },
  SOURCE_UNAVAILABLE: {
    title: '이미지를 불러오지 못했어요',
    message: '이미지 업로드에 실패했어요.\n다시 시도하거나 직접 입력해주세요',
  },
};

const NETWORK_FALLBACK = {
  title: '분석에 실패했어요',
  message: '통신 상태를 확인하고\n다시 시도하거나 직접 입력해주세요',
};

// 19-2 이미지(OCR) 등록 실패 — failureCode별 원인 안내.
// ad-failed·login-failed와 동일한 풀스크린 패턴(다크 배경 + 마스코트 + 하단 버튼)으로,
// 콘텐츠 없는 빈 라우트에 dim 모달만 떠 "무색"으로 보이던 문제를 해소한다.
export default function OcrFailedScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const copy = (code && COPY[code as IngestionFailureCode]) || NETWORK_FALLBACK;

  return (
    <Screen title="" back>
      {/* 마스코트 + 문구 (중앙) */}
      <View className="flex-1 items-center justify-center">
        <View className="items-center gap-[34px]">
          <Image
            source={require('../assets/images/mascot-confused.png')}
            style={{ width: 135, height: 119 }}
            contentFit="contain"
          />
          <View className="items-center gap-3">
            <AppText variant="subheading" className="text-center">
              {copy.title}
            </AppText>
            <AppText variant="body" className="text-center" style={{ color: palette.bodyMuted }}>
              {copy.message}
            </AppText>
          </View>
        </View>
      </View>

      {/* 하단 두 버튼 — 직접 입력(회색) / 다시 시도(골드) */}
      <View className="flex-row gap-3 pb-8 pt-4">
        <Pressable
          onPress={() => router.replace('/add-recipe-manual')}
          accessibilityRole="button"
          className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-popup-button active:opacity-80"
        >
          <Text className="text-[16px] font-semibold leading-[21px] text-popup-button-text">
            직접 입력
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-primary active:opacity-90"
        >
          <Text className="text-[16px] font-semibold leading-[21px] text-ink">다시 시도</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
