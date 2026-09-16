import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AlertDialog } from '@/components/ui';
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

// 19-2 이미지(OCR) 등록 실패 — failureCode에 따라 원인별 안내.
export default function OcrFailedScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const copy = (code && COPY[code as IngestionFailureCode]) || NETWORK_FALLBACK;

  return (
    <AlertDialog
      mascot={
        <Image
          source={require('../assets/images/mascot-confused.png')}
          style={{ width: 132, height: 116 }}
          contentFit="contain"
        />
      }
      title={copy.title}
      // 진단용: 실제 실패 코드를 노출해 원인을 화면에서 바로 확인한다(원인 확정 후 제거 가능).
      message={code ? `${copy.message}\n\n오류 코드: ${code}` : copy.message}
      actions={[
        { label: '직접 입력', onPress: () => router.replace('/add-recipe-manual') },
        { label: '다시 시도', tone: 'danger', onPress: () => router.back() },
      ]}
    />
  );
}
