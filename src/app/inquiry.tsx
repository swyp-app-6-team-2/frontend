import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, PressableScale, ScreenHeader } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { fireHaptic } from '@/lib/haptics';

// 문의내역 목업 — status: 답변완료(success) / 접수(disabled)
type Inquiry = { status: '답변완료' | '접수'; date: string; text: string };

const HISTORY: Inquiry[] = [
  {
    status: '답변완료',
    date: '2026.08.16 18:45',
    text: '미디엄팩을 결제했는데 슬롯 개수가 그대로예요. 확인 부탁드려요.',
  },
  { status: '접수', date: '2026.07.02 11:20', text: '환불 문의 드립니다.' },
  { status: '접수', date: '2026.07.02 11:20', text: '환불 문의 드립니다.' },
];

// 문의하기 — 작성 폼 / 문의내역 확인 (좌우 페이징 스와이프).
export default function InquiryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState(0); // 0=작성, 1=내역

  const goTab = (i: number) => {
    fireHaptic('selection');
    setTab(i);
    pagerRef.current?.scrollTo({ x: i * width, animated: true });
  };
  const onPaged = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== tab) setTab(i);
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader title="문의하기" back />

        {/* 탭: 문의하기 / 문의내역 확인 */}
        <View className="flex-row border-b border-field px-screen">
          <Pressable
            className={`flex-1 items-center pb-2.5 ${tab === 0 ? 'border-b-2 border-foreground' : ''}`}
            accessibilityRole="button"
            onPress={() => goTab(0)}
          >
            <AppText variant="body" className={tab === 0 ? 'font-semibold' : 'text-disabled'}>
              문의하기
            </AppText>
          </Pressable>
          <Pressable
            className={`flex-1 items-center pb-2.5 ${tab === 1 ? 'border-b-2 border-foreground' : ''}`}
            accessibilityRole="button"
            onPress={() => goTab(1)}
          >
            <AppText variant="body" className={tab === 1 ? 'font-semibold' : 'text-disabled'}>
              문의내역 확인
            </AppText>
          </Pressable>
        </View>

        {/* 좌우 페이징 — 작성 폼 / 내역 */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onPaged}
          className="flex-1"
        >
          {/* 페이지 0 — 작성 폼 */}
          <View style={{ width }} className="flex-1">
            <ScrollView contentContainerClassName="gap-6 px-screen pb-6 pt-6">
              {/* 문의유형 (드롭다운 선택) */}
              <View className="gap-2">
                <AppText variant="body">문의유형</AppText>
                <Pressable
                  className="flex-row items-center justify-between rounded-pill bg-field px-4 py-2.5 active:opacity-80"
                  accessibilityRole="button"
                  onPress={() => {}}
                >
                  <AppText variant="body" className="font-normal text-muted">
                    문의 유형을 선택해주세요.
                  </AppText>
                  <Text className="text-muted" style={{ fontSize: 12 }}>
                    ▾
                  </Text>
                </Pressable>
              </View>

              {/* 닉네임 */}
              <View className="gap-2">
                <AppText variant="body">닉네임</AppText>
                <View className="rounded-pill bg-field px-4 py-2.5">
                  <TextInput
                    className="text-foreground"
                    style={{ fontSize: 16, lineHeight: 21, paddingVertical: 0 }}
                    placeholder="닉네임을 입력해주세요"
                    placeholderTextColor={palette.muted}
                  />
                </View>
              </View>

              {/* 내용 (멀티라인) */}
              <View className="h-[177px] rounded-card bg-field px-4 py-2.5">
                <TextInput
                  className="flex-1 text-foreground"
                  style={{ fontSize: 16, lineHeight: 21 }}
                  placeholder="내용을 입력해 주세요"
                  placeholderTextColor={palette.muted}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* 사진첨부 */}
              <View className="gap-2">
                <AppText variant="body">사진첨부</AppText>
                <Pressable
                  className="h-[100px] w-[100px] items-center justify-center rounded-card border border-dashed border-disabled active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="사진 첨부"
                  onPress={() => {}}
                >
                  <Text className="text-muted" style={{ fontSize: 24 }}>
                    ＋
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            {/* 하단 고정 버튼 (취소 / 문의 접수) */}
            <View className="flex-row gap-3 px-screen pb-2 pt-4">
              <Pressable
                className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-popup-button active:opacity-90"
                accessibilityRole="button"
                onPress={() => router.back()}
              >
                <Text className="text-body font-semibold text-popup-button-text">취소</Text>
              </Pressable>
              <Pressable
                className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-primary active:opacity-90"
                accessibilityRole="button"
                onPress={() => {
                  fireHaptic('success');
                  router.back();
                }}
              >
                <Text className="text-body font-semibold text-ink">문의 접수</Text>
              </Pressable>
            </View>
          </View>

          {/* 페이지 1 — 문의내역 확인 */}
          <View style={{ width }} className="flex-1">
            <ScrollView
              contentContainerClassName="gap-3 px-screen pb-6 pt-6"
              showsVerticalScrollIndicator={false}
            >
              {HISTORY.map((q, i) => {
                const answered = q.status === '답변완료';
                return (
                  <PressableScale
                    key={`${q.date}-${i}`}
                    onPress={() => router.push('/inquiry-detail')}
                    accessibilityRole="button"
                    accessibilityLabel={`${q.status} 문의 상세`}
                    scaleTo={0.98}
                    className="gap-3 rounded-[12px] bg-field px-4 py-5"
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`items-center justify-center rounded-pill px-3 py-1 ${answered ? 'bg-success' : 'bg-disabled'}`}
                      >
                        <Text className="text-[12px] font-bold text-foreground">{q.status}</Text>
                      </View>
                      <Text className="text-[14px] font-medium leading-[18px] text-muted">
                        {q.date}
                      </Text>
                    </View>
                    <Text className="text-[16px] font-medium leading-[21px] text-foreground">
                      {q.text}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
