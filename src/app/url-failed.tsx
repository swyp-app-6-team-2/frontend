import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AlertDialog } from '@/components/ui';
import { palette } from '@/constants/tokens';
import type { IngestionFailureCode } from '@/lib/api';

// 실패 원인(failureCode)별 안내 문구. 로딩 화면이 job.failureCode를 `code`로 넘긴다.
// code가 비어 있으면 폴링 GET 자체가 실패한 것(네트워크/통신 오류)이다.
const COPY: Record<IngestionFailureCode, { title: string; message: string }> = {
  SOURCE_UNAVAILABLE: {
    title: '지원하지 않는 링크입니다',
    message: '링크를 열 수 없어요.\n다른 링크로 다시 시도하거나 직접 입력해주세요',
  },
  CONTENT_NOT_RECOGNIZED: {
    title: '레시피를 인식하지 못했어요',
    message: '링크에서 재료·조리 순서를 찾지 못했어요.\n다른 링크로 다시 시도해주세요',
  },
  MULTIPLE_RECIPES: {
    title: '레시피가 여러 개 감지됐어요',
    message: '한 번에 하나의 레시피만 등록할 수 있어요.\n하나만 담긴 링크를 올려주세요',
  },
  PROCESSING_FAILED: {
    title: '분석 중 오류가 발생했어요',
    message: '잠시 후 다시 시도하거나\n직접 입력해주세요',
  },
};

const NETWORK_FALLBACK = {
  title: '지원하지 않는 링크입니다',
  message: '다른 링크로 다시 시도하거나\n직접 입력해주세요',
};

// 19-1 URL 등록 실패 — failureCode에 따라 원인별 안내.
export default function UrlFailedScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const copy = (code && COPY[code as IngestionFailureCode]) || NETWORK_FALLBACK;

  return (
    <AlertDialog
      icon={
        <Image
          source={require('../assets/images/ic-link-off.png')}
          style={{ width: 28, height: 28 }}
          tintColor={palette.error}
          contentFit="contain"
        />
      }
      title={copy.title}
      message={copy.message}
      actions={[
        { label: '직접 입력', onPress: () => router.replace('/add-recipe-manual') },
        { label: '다시 시도', tone: 'danger', onPress: () => router.back() },
      ]}
    />
  );
}
