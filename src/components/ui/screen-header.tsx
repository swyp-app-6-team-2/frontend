import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from './app-text';
import { Chevron } from './chevron';

export type ScreenHeaderProps = {
  title: string;
  /** Show a back chevron that pops the navigation stack. */
  back?: boolean;
  /** Optional trailing action (icon button, text). */
  right?: ReactNode;
};

// Figma: 헤더 — Bold 24 (title), h72, margin 20. Back chevron optional.
export function ScreenHeader({ title, back, right }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="h-[72px] flex-row items-center gap-2 px-screen">
      {back ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Chevron direction="left" className="text-foreground" />
        </Pressable>
      ) : null}
      <AppText variant="title" className="flex-1">
        {title}
      </AppText>
      {right}
    </View>
  );
}
