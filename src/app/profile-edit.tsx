import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';

const NICK_MAX = 6;

// 프로필 수정 — 프로필 사진 변경 + 닉네임 편집.
export default function ProfileEditScreen() {
  const router = useRouter();
  const [nick, setNick] = useState('별따먹는사람');

  return (
    <Screen title="프로필 수정" back>
      <View className="flex-1">
        {/* 프로필 사진 (120x120) + 카메라 아이콘 — 이미지 자산 없음, 이모지 임시 */}
        <View className="items-center pt-12">
          <Pressable
            className="h-[120px] w-[120px] items-center justify-center rounded-full bg-disabled active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="프로필 사진 변경"
            onPress={() => {}}
          >
            <Text style={{ fontSize: 26 }}>📷</Text>
          </Pressable>
        </View>

        {/* 닉네임 — Frame 298 라벨행(padding 8/16/8/8) + input(h44, 세로중앙, 글자수 카운터) */}
        <View className="mt-11">
          <View className="flex-row items-center gap-[10px] py-2 pl-2 pr-4">
            <AppText variant="body">닉네임</AppText>
          </View>
          <View className="h-11 flex-row items-center justify-between rounded-pill bg-field px-4">
            <TextInput
              className="flex-1 text-foreground"
              style={{ fontSize: 16, lineHeight: 21, paddingVertical: 0 }}
              value={nick}
              onChangeText={setNick}
              maxLength={NICK_MAX}
              autoCapitalize="none"
            />
            <AppText variant="chip" className="ml-2 font-medium text-muted">
              {nick.length}/{NICK_MAX}
            </AppText>
          </View>
        </View>
      </View>

      {/* 하단 고정 완료 버튼 */}
      <View className="pb-4 pt-4">
        <Button label="완료하기" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
