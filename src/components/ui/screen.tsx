import type { ReactNode, Ref } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from './screen-header';

export type ScreenProps = {
  children: ReactNode;
  /** When set, renders a ScreenHeader with this title. */
  title?: string;
  /** Show a back chevron in the header (requires `title`). */
  back?: boolean;
  /** Show an X (close) icon in the header instead of back (requires `title`). */
  close?: boolean;
  /** Override the close(X)/back action. Defaults to router.back(). */
  onClose?: () => void;
  /** Trailing header action (requires `title`). */
  headerRight?: ReactNode;
  /** Wrap the body in a vertical ScrollView. Default false. */
  scroll?: boolean;
  /** Ref to the inner ScrollView (only with `scroll`) — e.g. to scrollToEnd. */
  scrollRef?: Ref<ScrollView>;
  /** Extra classes on the body container / scroll content. */
  contentClassName?: string;
  /** Full-bleed background image behind content (e.g. require('...')). */
  bgImage?: ImageSource | number;
  /** Decorative image pinned to the bottom edge, behind content (402×257 기준). */
  bgBottomImage?: ImageSource | number;
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
  close,
  onClose,
  headerRight,
  scroll,
  scrollRef,
  contentClassName,
  bgImage,
  bgBottomImage,
}: ScreenProps) {
  return (
    <View className="flex-1 bg-background">
      {bgImage ? (
        <Image source={bgImage} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      {bgBottomImage ? (
        <Image
          source={bgBottomImage}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            aspectRatio: 402 / 257,
          }}
          contentFit="cover"
          pointerEvents="none"
        />
      ) : null}
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {title != null ? (
          <ScreenHeader
            title={title}
            back={back}
            close={close}
            onClose={onClose}
            right={headerRight}
          />
        ) : null}
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            contentContainerClassName={`gap-4 px-screen py-4 ${contentClassName ?? ''}`}
          >
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 px-screen ${contentClassName ?? ''}`}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}
