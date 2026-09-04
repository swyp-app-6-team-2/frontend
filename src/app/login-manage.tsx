import { useState } from 'react';
import { Modal, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AlertDialog, ListRow, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';

// 로그인 관리 — 로그아웃 / 회원 탈퇴(파괴적).
export default function LoginManageScreen() {
  const router = useRouter();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <>
      <Screen title="로그인 관리" back>
        <View className="gap-8 pt-2">
          {/* 실제 로그아웃/탈퇴는 인증 API 연동 필요 (현재 UI 자리) */}
          <ListRow label="로그아웃" onPress={() => setConfirmLogout(true)} />
          <ListRow
            label="회원 탈퇴"
            labelClassName="!text-error"
            onPress={() => setConfirmLeave(true)}
          />
        </View>
      </Screen>

      {/* 로그아웃 확인 팝업 — 아이콘·제목 없이 메시지 + 취소/확인(골드) */}
      <Modal
        visible={confirmLogout}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLogout(false)}
      >
        <AlertDialog
          message="정말 로그아웃 하시겠습니까?"
          actions={[
            { label: '취소', onPress: () => setConfirmLogout(false) },
            {
              label: '확인',
              tone: 'primary',
              onPress: () => {
                setConfirmLogout(false);
                router.replace('/login');
              },
            },
          ]}
        />
      </Modal>

      {/* 회원 탈퇴 확인 팝업 — 배경 dim + 중앙 카드 */}
      <Modal
        visible={confirmLeave}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLeave(false)}
      >
        <AlertDialog
          icon={
            <Image
              source={require('../assets/images/ic-trash-error.png')}
              style={{ width: 24, height: 24 }}
              tintColor={palette.error}
              contentFit="contain"
            />
          }
          title="정말 탈퇴하시겠어요?"
          message={'탈퇴하면 저장한 모든 레시피와 별 슬롯\n기록이 삭제되며 복구할 수 없어요.'}
          actions={[
            { label: '취소', onPress: () => setConfirmLeave(false) },
            {
              label: '탈퇴하기',
              tone: 'danger',
              onPress: () => {
                setConfirmLeave(false);
                router.replace('/login');
              },
            },
          ]}
        />
      </Modal>
    </>
  );
}
