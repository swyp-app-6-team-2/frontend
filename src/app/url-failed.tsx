import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AlertDialog } from '@/components/ui';
import { palette } from '@/constants/tokens';

// 19-1 URL 등록 실패 — 지원하지 않는 링크.
export default function UrlFailedScreen() {
  const router = useRouter();
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
      title="지원하지 않는 링크입니다"
      message={'다른 링크로 다시 시도하거나\n직접 입력해주세요'}
      actions={[
        {
          label: '직접 입력',
          variant: 'secondary',
          className: 'border-transparent bg-field',
          onPress: () => router.replace('/add-recipe-manual'),
        },
        { label: '다시 시도', className: 'bg-error', onPress: () => router.back() },
      ]}
    />
  );
}
