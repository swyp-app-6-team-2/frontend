import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useProfile, useUpdateProfile } from '@/hooks/use-api';
import { ApiError, uploadImage } from '@/lib/api';
import type { MeResponse } from '@/lib/api/types';
import { ImagePickerUnavailableError, pickSquareImage, type PickedImage } from '@/lib/pick-image';

const NICK_MAX = 6;

// 프로필 수정 — 현재 프로필을 받아 닉네임/사진 편집 → PATCH /users/me/profile.
export default function ProfileEditScreen() {
  const { data: me, isLoading } = useProfile();
  if (isLoading) {
    return (
      <Screen title="프로필 수정" back>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.primary} />
        </View>
      </Screen>
    );
  }
  return <ProfileEditForm initial={me} />;
}

function ProfileEditForm({ initial }: { initial?: MeResponse }) {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const [nick, setNick] = useState(initial?.nickname ?? '');
  const [picked, setPicked] = useState<PickedImage | null>(null);
  // 새로 고른 사진 미리보기 우선, 없으면 기존 프로필 이미지.
  const avatarUri = picked?.uri ?? initial?.profileImageUrl ?? null;

  const onPickPhoto = async () => {
    try {
      const img = await pickSquareImage();
      if (img) setPicked(img);
    } catch (e) {
      if (e instanceof ImagePickerUnavailableError) {
        Alert.alert('사진 기능 준비 중', '앱을 다시 빌드하면 사진 변경을 사용할 수 있어요.');
        return;
      }
      Alert.alert('오류', '사진을 불러오지 못했어요.');
    }
  };

  const onSubmit = async () => {
    const nickname = nick.trim();
    if (nickname.length < 1) {
      Alert.alert('닉네임', '닉네임을 입력해주세요.');
      return;
    }
    try {
      // 새 사진이 있으면 먼저 업로드해 objectKey 확보(없으면 기존 유지).
      const profileImageKey = picked ? await uploadImage('PROFILE_IMAGE', picked) : undefined;
      await updateProfile.mutateAsync({ nickname, profileImageKey });
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', e instanceof ApiError ? e.message : '다시 시도해주세요.');
    }
  };

  return (
    <Screen title="프로필 수정" back>
      <View className="flex-1">
        {/* 프로필 사진 (120x120) — 있으면 표시, 없으면 카메라 플레이스홀더 */}
        <View className="items-center pt-12">
          <Pressable
            className="h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full bg-disabled active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="프로필 사진 변경"
            onPress={onPickPhoto}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 120, height: 120 }}
                contentFit="cover"
              />
            ) : (
              <Image
                source={require('../assets/images/ic-photo-camera.png')}
                style={{ width: 32, height: 32 }}
                contentFit="contain"
              />
            )}
          </Pressable>
        </View>

        {/* 닉네임 — 라벨행 + input(글자수 카운터) */}
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
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor={palette.muted}
            />
            <AppText variant="chip" className="ml-2 font-medium text-muted">
              {nick.length}/{NICK_MAX}
            </AppText>
          </View>
        </View>
      </View>

      {/* 하단 고정 완료 버튼 */}
      <View className="pb-4 pt-4">
        <Button
          label={updateProfile.isPending ? '저장 중…' : '완료하기'}
          onPress={onSubmit}
          disabled={updateProfile.isPending}
        />
      </View>
    </Screen>
  );
}
