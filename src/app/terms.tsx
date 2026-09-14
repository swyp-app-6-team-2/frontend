import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText, Chevron, Screen } from '@/components/ui';
import { useSignup } from '@/hooks/use-api';
import { ApiError } from '@/lib/api';

// 서비스 이용 동의 — 소셜 로그인 후 신규 회원 가입 절차(약관 동의). Figma 619:9650.
type Key = 'age' | 'tos' | 'privacy' | 'notify' | 'marketing';

const ITEMS: { key: Key; label: string }[] = [
  { key: 'age', label: '(필수) 만 14세 이상입니다.' },
  { key: 'tos', label: '(필수) 서비스 이용약관' },
  { key: 'privacy', label: '(필수) 개인정보 처리방침' },
  { key: 'notify', label: '(선택) 서비스 알림 수신 동의' },
  { key: 'marketing', label: '(선택) 마케팅 정보 수신동의' },
];
const REQUIRED: Key[] = ['age', 'tos', 'privacy'];

// 체크 표시 — Figma Component 12 이미지(off=흐린 회색, on=흰색).
function CheckMark({ on }: { on: boolean }) {
  return (
    <Image
      source={
        on
          ? require('../assets/images/checkbox-on.png')
          : require('../assets/images/checkbox-off.png')
      }
      style={{ width: 24, height: 24 }}
      contentFit="contain"
    />
  );
}

export default function TermsScreen() {
  const router = useRouter();
  // 로그인 화면이 넘겨준 signupToken(신규 소셜 사용자 식별). 없으면 정상 진입이 아님.
  const { signupToken } = useLocalSearchParams<{ signupToken?: string }>();
  const signup = useSignup();
  const [checked, setChecked] = useState<Record<Key, boolean>>({
    age: false,
    tos: false,
    privacy: false,
    notify: false,
    marketing: false,
  });

  const allOn = ITEMS.every((i) => checked[i.key]);
  const canSubmit = REQUIRED.every((k) => checked[k]);

  const toggle = (k: Key) => setChecked((p) => ({ ...p, [k]: !p[k] }));
  const toggleAll = () => {
    const next = !allOn;
    setChecked({ age: next, tos: next, privacy: next, notify: next, marketing: next });
  };

  const onSubmit = async () => {
    if (!canSubmit || signup.isPending) return;
    if (!signupToken) {
      Alert.alert('세션 만료', '로그인을 다시 진행해주세요.', [
        { text: '확인', onPress: () => router.replace('/login') },
      ]);
      return;
    }
    // 백엔드 필드 매핑: notify=서비스 알림(serviceAgreed), marketing=마케팅 수신.
    try {
      await signup.mutateAsync({
        signupToken,
        ageOver14Agreed: checked.age,
        serviceTermsAgreed: checked.tos,
        privacyAgreed: checked.privacy,
        marketingAgreed: checked.marketing,
        serviceAgreed: checked.notify,
      });
      // 가입 완료 → 토큰 저장됨(useSignup). 신규 가입 흐름: 약관 → 알림 시간대 설정.
      router.replace('/notify-setup');
    } catch (e) {
      Alert.alert('가입 실패', e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <Screen title="" back bgImage={require('../assets/images/terms-bg.png')}>
      <View className="flex-1">
        {/* 제목 */}
        <AppText variant="title" className="mt-2">
          서비스 이용 동의
        </AppText>

        {/* 동의 블록 (Frame 397: gap 20) */}
        <View className="mt-[60px] gap-5">
          {/* 약관 전체동의 */}
          <Pressable
            onPress={toggleAll}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: allOn }}
            className="h-6 flex-row items-center gap-2 active:opacity-80"
          >
            <CheckMark on={allOn} />
            <Text className="text-[16px] font-medium leading-[19px] text-foreground">
              약관 전체동의
            </Text>
          </Pressable>

          {/* 구분선 (Figma #989AA0 계열) */}
          <View className="h-px bg-muted" />

          {/* 개별 항목 (gap 32) */}
          <View className="gap-8">
            {ITEMS.map((it) => (
              <Pressable
                key={it.key}
                onPress={() => toggle(it.key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: checked[it.key] }}
                className="h-6 flex-row items-center gap-2 active:opacity-80"
              >
                <CheckMark on={checked[it.key]} />
                <Text className="flex-1 text-[16px] font-medium leading-[19px] text-foreground">
                  {it.label}
                </Text>
                <Chevron className="text-muted" />
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* 하단 완료 버튼 — off: 비활성화 라인 아웃라인·비활성 글자, on: 골드·ink 글자 */}
      <View className="pb-8 pt-4">
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit || signup.isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit || signup.isPending }}
          className={`h-[52px] items-center justify-center rounded-[30px] active:opacity-90 ${
            canSubmit ? 'bg-primary' : 'bg-disabled'
          }`}
        >
          <Text
            className={`text-[16px] font-semibold leading-[21px] ${
              canSubmit ? 'text-ink' : 'text-body-muted'
            }`}
          >
            확인
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
