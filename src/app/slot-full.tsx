import { Text } from 'react-native';
import { useRouter } from 'expo-router';

import { AlertDialog } from '@/components/ui';

// 23 저장 슬롯 한도 초과 안내.
export default function SlotFullScreen() {
  const router = useRouter();
  return (
    <AlertDialog
      icon={<Text className="text-[26px]">🪄</Text>}
      title="별을 다 썼어요"
      message={'남은 별을 모두 사용했어요.\n광고를 보고 별을 늘리면 계속 저장할 수 있어요.'}
      actions={[
        { label: '닫기', onPress: () => router.back() },
        { label: '슬롯 확장', tone: 'primary', onPress: () => router.replace('/slot-expand') },
      ]}
    />
  );
}
