import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ListRow, Screen } from '@/components/ui';

// 로그인 관리 — 로그아웃 / 회원 탈퇴(파괴적).
export default function LoginManageScreen() {
  const router = useRouter();

  return (
    <Screen title="로그인 관리" back>
      <View className="gap-8 pt-2">
        {/* 실제 로그아웃/탈퇴는 확인 다이얼로그 + 인증 API 연동 필요 (현재 UI 자리) */}
        <ListRow label="로그아웃" onPress={() => router.replace('/login')} />
        <ListRow label="회원 탈퇴" labelClassName="text-error" onPress={() => {}} />
      </View>
    </Screen>
  );
}
