import type { ComponentRef, ReactNode, Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRefresh } from '@/hooks/use-refresh';

import { AppRefreshControl } from './app-refresh-control';
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
  /** 당겨서 새로고침 — `scroll`일 때만 동작. 화면의 활성 쿼리를 다시 불러온다. */
  pullToRefresh?: boolean;
  /** Ref to the inner ScrollView (only with `scroll`) — e.g. to scrollToEnd. */
  scrollRef?: Ref<ScreenScrollRef>;
  /** Extra classes on the body container / scroll content. */
  contentClassName?: string;
  /** Full-bleed background image behind content (e.g. require('...')). */
  bgImage?: ImageSource | number;
  /** Decorative image pinned to the bottom edge, behind content (402×257 기준). */
  bgBottomImage?: ImageSource | number;
  /** 하단 푸터(예: 저장 CTA). 스크롤 콘텐츠의 마지막 요소로 배치돼 콘텐츠와 함께 스크롤·이동한다.
   *  키보드가 올라오면 콘텐츠와 함께 위로 밀려 올라가 가리지 않는다. */
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
  pullToRefresh,
  scrollRef,
  contentClassName,
  bgImage,
  bgBottomImage,
  footer,
}: ScreenProps) {
  const refresh = useRefresh();
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
          // 스크롤 화면: KeyboardAwareScrollView가 키보드가 뜨면 포커스 입력창을 키보드 위로
          // (bottomOffset만큼 여유 두고) 올린다. footer는 떠 있는 오버레이가 아니라 스크롤 콘텐츠의
          // 마지막 요소로 흐름에 넣어 콘텐츠와 함께 스크롤·이동하고 절대 겹치지 않는다.
          <KeyboardAwareScrollView
            ref={scrollRef}
            className="flex-1"
            refreshControl={pullToRefresh ? <AppRefreshControl {...refresh} /> : undefined}
            // 포커스된 입력란을 키보드 위로 넉넉히(입력 박스+주변 버튼까지) 띄운다. 값이 작으면
            // 입력란이 키보드 경계에 딱 붙어 박스 아랫부분이 가린다.
            bottomOffset={140}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerClassName={`gap-4 px-screen py-4 ${contentClassName ?? ''}`}
          >
            {children}
            {footer ? <View className="pt-2">{footer}</View> : null}
          </KeyboardAwareScrollView>
        ) : (
          // 비스크롤 화면: 키보드가 올라오면 본문+푸터를 키보드 높이만큼 위로 밀어 올린다.
          // keyboard-controller의 KeyboardAvoidingView는 실제 키보드 애니메이션에 맞춰 부드럽게
          // 따라 올라가고 안드로이드에서도 동작한다(RN 기본 padding은 사실상 iOS 전용).
          <KeyboardAvoidingView className="flex-1" behavior="padding">
            <View className={`flex-1 px-screen ${contentClassName ?? ''}`}>{children}</View>
            {footer ? <View className="px-screen pb-4 pt-3">{footer}</View> : null}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}
