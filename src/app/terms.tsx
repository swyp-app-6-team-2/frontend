import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText, Chevron, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';

// 서비스 이용 동의 — 소셜 로그인 후 신규 회원 가입 절차(약관 동의). Figma 619:9650.
type Key = 'age' | 'tos' | 'privacy' | 'marketing';

const ITEMS: { key: Key; label: string }[] = [
  { key: 'age', label: '(필수) 만 14세 이상입니다.' },
  { key: 'tos', label: '(필수) 서비스 이용약관' },
  { key: 'privacy', label: '(필수) 개인정보 처리방침' },
  { key: 'marketing', label: '(선택) 마케팅 정보 수신동의' },
];
const REQUIRED: Key[] = ['age', 'tos', 'privacy'];

// 체크 표시 — off는 비활성화 라인색(#292A30), on은 흰색(Figma Component 12 Vector).
function CheckMark({ on }: { on: boolean }) {
  return (
    <Feather name="check-circle" size={24} color={on ? palette.foreground : palette.disabledLine} />
  );
}

export default function TermsScreen() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<Key, boolean>>({
    age: false,
    tos: false,
    privacy: false,
    marketing: false,
  });

  const allOn = ITEMS.every((i) => checked[i.key]);
  const canSubmit = REQUIRED.every((k) => checked[k]);

  const toggle = (k: Key) => setChecked((p) => ({ ...p, [k]: !p[k] }));
  const toggleAll = () => {
    const next = !allOn;
    setChecked({ age: next, tos: next, privacy: next, marketing: next });
  };

  const onSubmit = () => {
    if (!canSubmit) return;
    // TODO: 회원가입 완료 API(signupToken + 동의내역)가 백엔드에 생기면 호출.
    // 신규 가입 흐름: 약관 → 알림 시간대 설정.
    router.replace('/notify-setup');
  };

  return (
    <Screen title="" back>
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

          {/* 구분선 */}
          <View className="h-px bg-disabled" />

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
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          className={`h-[52px] items-center justify-center rounded-pill active:opacity-90 ${
            canSubmit ? 'bg-primary' : ''
          }`}
          style={canSubmit ? undefined : { borderWidth: 1, borderColor: palette.disabledLine }}
        >
          <Text
            className={`text-[16px] font-semibold leading-[21px] ${
              canSubmit ? 'text-ink' : 'text-disabled'
            }`}
          >
            완료하기
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
