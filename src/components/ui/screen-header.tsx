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

// Figma: 서브/모달 헤더(헤더2·헤더3) — Bold 18 (title), 아이콘 20~24, h72, margin 20.
// 큰 페이지 제목(24)은 각 화면이 AppText variant="title"로 직접 렌더한다(여기와 별개).
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
            style={{ width: 20, height: 20 }}
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
            style={{ width: 16, height: 16 }}
            tintColor={palette.foreground}
            contentFit="contain"
          />
        </Pressable>
      ) : null}
      <AppText variant="title" className="flex-1" style={{ fontSize: 18, lineHeight: 21 }}>
        {title}
      </AppText>
      {right}
    </View>
  );
}
