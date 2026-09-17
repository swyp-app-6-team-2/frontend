import type { ComponentRef, ReactNode, Ref } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from './screen-header';

// scrollRef 대상 — KeyboardAwareScrollView(내부 ScrollView) 인스턴스. scrollToEnd 등 지원.
export type ScreenScrollRef = ComponentRef<typeof KeyboardAwareScrollView>;

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
  scrollRef?: Ref<ScreenScrollRef>;
  /** Extra classes on the body container / scroll content. */
  contentClassName?: string;
  /** Full-bleed background image behind content (e.g. require('...')). */
  bgImage?: ImageSource | number;
  /** Decorative image pinned to the bottom edge, behind content (402×257 기준). */
  bgBottomImage?: ImageSource | number;
  /** 하단 고정 푸터(예: 저장 CTA). scroll 화면에서도 ScrollView 밖·폰 하단에 고정된다. */
  footer?: ReactNode;
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
  footer,
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
          // 스크롤 화면: KeyboardAwareScrollView가 포커스된 입력창을 키보드 위로 자동 스크롤한다.
          // footer가 있으면 그만큼(bottomOffset) 더 띄워 입력창이 footer에도 가리지 않게 하고,
          // footer 자체는 KeyboardStickyView로 키보드 위에 붙여 둘 다 보이게 한다.
          <View className="flex-1">
            <KeyboardAwareScrollView
              ref={scrollRef}
              className="flex-1"
              bottomOffset={footer ? 88 : 16}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerClassName={`gap-4 px-screen py-4 ${contentClassName ?? ''}`}
            >
              {children}
            </KeyboardAwareScrollView>
            {footer ? (
              <KeyboardStickyView>
                <View className="px-screen pb-4 pt-3">{footer}</View>
              </KeyboardStickyView>
            ) : null}
          </View>
        ) : (
          // 비스크롤 화면: 하단 고정 입력란은 키보드가 올라오면 위로 밀어 올린다(iOS padding).
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className={`flex-1 px-screen ${contentClassName ?? ''}`}>{children}</View>
            {footer ? <View className="px-screen pb-4 pt-3">{footer}</View> : null}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}
