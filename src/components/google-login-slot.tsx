import { Component, lazy, Suspense, type ReactNode } from 'react';
import { Pressable } from 'react-native';
import { Image } from 'expo-image';

export type GoogleLoginSlotProps = {
  src: number;
  label: string;
  disabled?: boolean;
  onIdToken: (idToken: string) => void;
  onError: (message: string) => void;
};

// 네이티브 모듈(ExpoApplication)에 의존하는 실제 버튼은 lazy로만 로드한다.
const GoogleAuthButton = lazy(() => import('./google-auth-button'));

// 구글 iOS 로그인은 iOS client ID + 네이티브 리빌드가 있어야 동작한다.
// client ID가 없으면 native 모듈을 아예 건드리지 않고 폴백만 보여준다
// (dev에서 리빌드 안 된 바이너리의 redbox를 피함).
const GOOGLE_ENABLED = !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// expo-auth-session은 아직 리빌드 안 된 dev client에 없는 네이티브 모듈을 import 시점에
// 참조해 throw할 수 있다. 그대로 두면 앱 전체가 죽으므로, 에러 경계로 잡아
// '비활성 구글 버튼'으로 우아하게 강등한다(리빌드하면 자동 복구).
class NativeGuard extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// native 모듈이 없을 때 보여줄 폴백 — 눌러도 안내만.
function GoogleFallbackButton({ src, label, onError }: GoogleLoginSlotProps) {
  return (
    <Pressable
      onPress={() => onError('구글 로그인은 앱을 다시 빌드한 뒤 사용할 수 있어요.')}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="active:opacity-80"
    >
      <Image source={src} style={{ width: 56, height: 56 }} contentFit="contain" />
    </Pressable>
  );
}

export function GoogleLoginSlot(props: GoogleLoginSlotProps) {
  const fallback = <GoogleFallbackButton {...props} />;
  // client ID가 없으면 lazy-import 자체를 안 해 native 모듈을 건드리지 않는다.
  if (!GOOGLE_ENABLED) return fallback;
  return (
    <NativeGuard fallback={fallback}>
      <Suspense fallback={fallback}>
        <GoogleAuthButton {...props} />
      </Suspense>
    </NativeGuard>
  );
}
