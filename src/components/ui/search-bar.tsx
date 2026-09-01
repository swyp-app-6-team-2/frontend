import type { ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Image } from 'expo-image';

import { palette } from '@/constants/tokens';

export type SearchBarProps = TextInputProps & {
  /** Leading icon element. Defaults to the 돋보기 icon; pass `null` to hide it. */
  leftIcon?: ReactNode;
  containerClassName?: string;
};

// Figma: 검색바 — field bg #1E2230, pill, px16 py10, icon gap10, placeholder
// #A4A4A4 16px. Height 44px = 24px icon frame + py10×2. The icon is a fixed
// 24×24 box so it (not the text) sets the bar height.
const defaultIcon = (
  <Image
    source={require('../../assets/images/ic-search.png')}
    style={{ width: 24, height: 24 }}
    tintColor={palette.muted}
    contentFit="contain"
  />
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
        className="flex-1 text-foreground"
        // Figma: 16px / 130% (21px). Kept ≤24 so text never outgrows the icon frame.
        style={{ fontSize: 16, lineHeight: 21 }}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        {...rest}
      />
    </View>
  );
}
