import type { ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { palette } from '@/constants/tokens';

export type SearchBarProps = TextInputProps & {
  /** Leading icon element. Defaults to a 🔍 glyph; pass `null` to hide it. */
  leftIcon?: ReactNode;
  containerClassName?: string;
};

// Figma: 검색바 — field bg #1E2230, pill, px16 py10, icon gap10 (24px icon),
// placeholder #A4A4A4 16px. Default icon is a glyph (~24px) until a real icon
// system lands.
const defaultIcon = (
  <Text className="text-muted" style={{ fontSize: 22 }}>
    🔍
  </Text>
);

export function SearchBar({
  leftIcon = defaultIcon,
  containerClassName,
  placeholder = '재료명을 검색해보세요',
  ...rest
}: SearchBarProps) {
  return (
    <View
      className={`flex-row items-center gap-2.5 rounded-pill bg-field px-4 py-2.5 ${
        containerClassName ?? ''
      }`}
    >
      {leftIcon}
      <TextInput
        className="flex-1 text-body text-foreground"
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        {...rest}
      />
    </View>
  );
}
