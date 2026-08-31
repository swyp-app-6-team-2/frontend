import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, ScreenHeader } from '@/components/ui';
import { palette } from '@/constants/tokens';

// 문의하기 — 문의 유형/닉네임/내용/사진첨부 폼 + 하단 취소·제출 버튼.
export default function InquiryScreen() {
  const router = useRouter();
  const [nick, setNick] = useState('');
  const [content, setContent] = useState('');

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScreenHeader title="문의하기" back />

        {/* 탭: 문의하기(활성) / 문의내역 확인(비활성) */}
        <View className="flex-row border-b border-field px-screen">
          <View className="flex-1 items-center border-b-2 border-foreground pb-2.5">
            <AppText variant="body">문의하기</AppText>
          </View>
          <View className="flex-1 items-center pb-2.5">
            <AppText variant="body" className="font-semibold text-disabled">
              문의내역 확인
            </AppText>
          </View>
        </View>

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
                className="text-body font-normal text-foreground"
                placeholder="닉네임을 입력해주세요"
                placeholderTextColor={palette.muted}
                value={nick}
                onChangeText={setNick}
              />
            </View>
          </View>

          {/* 내용 (멀티라인) */}
          <View className="h-[177px] rounded-card bg-field px-4 py-2.5">
            <TextInput
              className="flex-1 text-body font-normal text-foreground"
              placeholder="내용을 입력해 주세요"
              placeholderTextColor={palette.muted}
              value={content}
              onChangeText={setContent}
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

        {/* 하단 고정 버튼 (취소 / 제출하기) */}
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
            onPress={() => router.back()}
          >
            <Text className="text-body font-semibold text-ink">제출하기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
