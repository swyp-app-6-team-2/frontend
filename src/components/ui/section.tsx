import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from './app-text';

export type SectionProps = {
  /** Subheading title (22px bold). */
  title: string;
  children: ReactNode;
  className?: string;
};

// 큰 소제목(subheading) + 그룹 콘텐츠 블록. cf. SectionTitle(작은 캡션 라벨 + 수정 액션).
export function Section({ title, children, className }: SectionProps) {
  return (
    <View className={`gap-3 ${className ?? ''}`}>
      <AppText variant="subheading">{title}</AppText>
      <View className="gap-3">{children}</View>
    </View>
  );
}
