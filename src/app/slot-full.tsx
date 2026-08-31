import { Text } from 'react-native';
import { useRouter } from 'expo-router';

import { AlertDialog } from '@/components/ui';

// 23 저장 슬롯 한도 초과 안내.
export default function SlotFullScreen() {
  const router = useRouter();
  return (
    <AlertDialog
      icon={<Text className="text-[26px]">🪄</Text>}
      title="저장 슬롯이 가득 찼어요"
      message={'레시피 저장 슬롯을 모두 사용했어요.\n슬롯을 확장하면 계속 저장할 수 있어요.'}
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
