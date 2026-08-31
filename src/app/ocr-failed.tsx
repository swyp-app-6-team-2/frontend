import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AlertDialog } from '@/components/ui';
import { palette } from '@/constants/tokens';

// 19-2 이미지(OCR) 등록 실패 — 텍스트 인식 실패.
export default function OcrFailedScreen() {
  const router = useRouter();
  return (
    <AlertDialog
      icon={
        <Image
          source={require('../assets/images/ic-x.png')}
          style={{ width: 26, height: 26 }}
          tintColor={palette.error}
          contentFit="contain"
        />
      }
      title="텍스트 인식에 실패했어요"
      message={'다른 이미지로 다시 시도하거나\n직접 입력해주세요'}
      actions={[
        { label: '직접 입력', onPress: () => router.replace('/add-recipe-manual') },
        { label: '다시 시도', tone: 'danger', onPress: () => router.back() },
      ]}
    />
  );
}
