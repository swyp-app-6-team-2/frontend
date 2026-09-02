import type { ReactNode } from 'react';
import { View, type PressableProps } from 'react-native';

import { AppText } from './app-text';
import { Chevron } from './chevron';
import { PressableScale } from './pressable-scale';

export type ListRowProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  /** Optional secondary line under the label. */
  subtitle?: string;
  /** Leading element (icon/avatar). Icons are a separate subsystem — pass one in. */
  leftIcon?: ReactNode;
  /** Trailing element (value text, switch, badge). Overrides the chevron when set. */
  right?: ReactNode;
  /** Show the default `›` chevron. Ignored when `right` is provided. Default true. */
  showChevron?: boolean;
  /** Extra classes on the label text — e.g. `text-error` for destructive rows. */
  labelClassName?: string;
};

// Figma: 서비스 이용약관 등 리스트 행 — label Medium 16, chevron at right.
// No icon library yet → typographic chevron `›` (swap for a real icon later).
export function ListRow({
  label,
  subtitle,
  leftIcon,
  right,
  showChevron = true,
  className,
  labelClassName,
  ...rest
}: ListRowProps) {
  const trailing =
    right ?? (showChevron ? <Chevron direction="right" className="text-muted" /> : null);

  // 넓은 행이라 축소는 약하게(0.98). active:opacity 대신 스케일로 피드백 통일.
  return (
    <PressableScale
      accessibilityRole="button"
      scaleTo={0.98}
      className={`min-h-6 w-full flex-row items-center gap-3 ${className ?? ''}`}
      {...rest}
    >
      {leftIcon}
      <View className="flex-1">
        <AppText variant="body" className={labelClassName}>
          {label}
        </AppText>
        {subtitle ? (
          <AppText variant="chip" className="mt-0.5 text-muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </PressableScale>
  );
}
