import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from './app-text';
import { Button, type ButtonVariant } from './button';

export type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Extra classes on the button surface (e.g. `bg-error` for a destructive action). */
  className?: string;
};

export type AlertDialogProps = {
  /** Rendered inside the top status circle — an emoji <Text> or a tinted <Image>. */
  icon: ReactNode;
  title: string;
  /** Body copy; embed `\n` for the two-line layout in the design. */
  message: string;
  /** 1–2 footer buttons, left→right. */
  actions: DialogAction[];
};

// 중앙 정렬 경고 다이얼로그 — dim 배경 위 카드.
// url-failed · ocr-failed · slot-full 세 화면이 아이콘/문구만 다르고 구조가 같아 공통화.
export function AlertDialog({ icon, title, message, actions }: AlertDialogProps) {
  return (
    <View className="flex-1 items-center justify-center bg-black/60 px-8">
      <View className="w-full items-center gap-5 rounded-card bg-field px-6 py-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-error/15">
          {icon}
        </View>
        <View className="items-center gap-2">
          <AppText variant="subheading" className="text-center">
            {title}
          </AppText>
          <AppText variant="body" className="text-center text-muted">
            {message}
          </AppText>
        </View>
        <View className="mt-1 w-full flex-row gap-3">
          {actions.map((a) => (
            <View key={a.label} className="flex-1">
              <Button
                label={a.label}
                variant={a.variant}
                className={a.className}
                onPress={a.onPress}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
