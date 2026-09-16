import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppText, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useIngestionJob } from '@/hooks/use-api';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

// 인디케이터 세그먼트 폭(트랙 대비 비율)
const SEG = 0.4;

// 16-2 콘텐츠 확인 중 — AI가 영상/이미지를 레시피로 정리하는 로딩.
export default function AddRecipeLoadingScreen() {
  const router = useRouter();
  const { jobId, inputType } = useLocalSearchParams<{ jobId?: string; inputType?: string }>();
  const numJobId = jobId ? Number(jobId) : null;
  const isImage = inputType === 'IMAGE';
  const { data: job, isError } = useIngestionJob(numJobId);
  const reduceMotion = useReduceMotion();
  const [trackW, setTrackW] = useState(0);
  const progress = useSharedValue(0); // 0→1 왕복(무한)

  // 폴링 결과에 따라 분기: 성공 → 내용 확인(수동 폼 프리필), 실패/만료 → 실패 안내.
  // 네트워크 에러(isError)도 실패로 간주. inputType으로 URL/이미지 실패 화면을 고른다.
  const status = job?.status;
  useEffect(() => {
    if (status === 'RESULT_READY') {
      router.replace({
        pathname: '/add-recipe-manual',
        params: {
          draft: JSON.stringify(job?.result ?? null),
          previewImageUrl: job?.previewImageUrl ?? '',
        },
      });
    } else if (status === 'FAILED' || status === 'EXPIRED' || isError) {
      router.replace({
        pathname: isImage ? '/ocr-failed' : '/url-failed',
        params: { code: job?.failureCode ?? '' },
      });
    }
  }, [status, isError, isImage, job?.result, job?.previewImageUrl, job?.failureCode, router]);

  // 진행 상황이 "살아있음"을 보여주는 무한 인디케이터. 실제 진행률 API가
  // 붙으면 withRepeat 대신 withTiming(progress)로 교체(백엔드 연동 지점).
  // reduce-motion이면 애니메이션 없이 정적 바로 대체.
  useEffect(() => {
    if (reduceMotion || trackW === 0) return;
    progress.set(0);
    progress.set(
      withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, false),
    );
    return () => cancelAnimation(progress);
  }, [reduceMotion, trackW, progress]);

  const segStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -trackW * SEG + progress.get() * (trackW * (1 + SEG)) }],
  }));

  return (
    <Screen title={isImage ? '이미지로 등록' : 'URL로 등록'} back>
      <View className="flex-1 items-center justify-center gap-8">
        <Image
          source={require('../assets/images/mascot-analyzing.png')}
          style={{ width: 220, height: 200 }}
          contentFit="contain"
        />

        <AppText variant="body" className="text-center text-muted">
          {isImage
            ? 'AI가 이미지 속 재료와 조리 순서를\n레시피로 정리하고 있어요'
            : 'AI가 영상 속 재료와 조리 순서를\n레시피로 정리하고 있어요'}
        </AppText>

        {/* 진행 바 — reduce-motion이면 정적 부분 채움, 아니면 움직이는 인디케이터 */}
        <View
          className="h-2 w-full overflow-hidden rounded-full bg-field"
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        >
          {reduceMotion ? (
            <View className="h-full w-3/5 rounded-full bg-primary" />
          ) : (
            <Animated.View
              style={[
                {
                  height: '100%',
                  width: `${SEG * 100}%`,
                  borderRadius: 999,
                  backgroundColor: palette.primary,
                },
                segStyle,
              ]}
            />
          )}
        </View>
      </View>

      <View className="items-end pb-4">
        <Text className="text-chip text-muted">{status === 'QUEUED' ? '대기 중' : '분석 중'}</Text>
      </View>
    </Screen>
  );
}
