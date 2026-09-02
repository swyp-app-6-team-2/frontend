import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { palette } from '@/constants/tokens';

import { AppText } from './app-text';

export type ScreenHeaderProps = {
  title: string;
  /** Show a back chevron that pops the navigation stack. */
  back?: boolean;
  /** Show an X (close) icon that pops the stack — for modal-like pages. Ignored if `back`. */
  close?: boolean;
  /** Override the close(X)/back action. Defaults to router.back(). */
  onClose?: () => void;
  /** Optional trailing action (icon button, text). */
  right?: ReactNode;
};

// Figma: 헤더 — Bold 24 (title), h72, margin 20. Leading back chevron or close(X) optional.
export function ScreenHeader({ title, back, close, onClose, right }: ScreenHeaderProps) {
  const router = useRouter();
  // 딥링크로 직접 진입해 back 스택이 비면 router.back()은 no-op이므로 홈 허브로 폴백.
  const dismiss = onClose ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));

  return (
    <View className="h-[72px] flex-row items-center gap-2 px-screen">
      {back ? (
        <Pressable
          onPress={dismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Image
            source={require('../../assets/images/ic-arrow-left.png')}
            style={{ width: 24, height: 24 }}
            tintColor={palette.foreground}
            contentFit="contain"
          />
        </Pressable>
      ) : close ? (
        <Pressable
          onPress={dismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <Image
            source={require('../../assets/images/ic-close.png')}
            style={{ width: 24, height: 24 }}
            tintColor={palette.foreground}
            contentFit="contain"
          />
        </Pressable>
      ) : null}
      <AppText variant="title" className="flex-1">
        {title}
      </AppText>
      {right}
    </View>
  );
}
