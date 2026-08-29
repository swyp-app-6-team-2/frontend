import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from './screen-header';

export type ScreenProps = {
  children: ReactNode;
  /** When set, renders a ScreenHeader with this title. */
  title?: string;
  /** Show a back chevron in the header (requires `title`). */
  back?: boolean;
  /** Trailing header action (requires `title`). */
  headerRight?: ReactNode;
  /** Wrap the body in a vertical ScrollView. Default false. */
  scroll?: boolean;
  /** Extra classes on the body container / scroll content. */
  contentClassName?: string;
};

/**
 * Standard page shell — dark background, top safe-area, 20px screen margin,
 * optional header. Build a new page with:
 *
 *   export default function Foo() {
 *     return <Screen title="제목" scroll>{...}</Screen>;
 *   }
 *
 * Then register it in the home hub's PAGES list to make it navigable.
 */
export function Screen({
  children,
  title,
  back,
  headerRight,
  scroll,
  contentClassName,
}: ScreenProps) {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {title != null ? <ScreenHeader title={title} back={back} right={headerRight} /> : null}
        {scroll ? (
          <ScrollView contentContainerClassName={`gap-4 px-screen py-4 ${contentClassName ?? ''}`}>
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 px-screen ${contentClassName ?? ''}`}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}
