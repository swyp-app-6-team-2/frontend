import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SearchBar } from '@/components/ui';
import { palette } from '@/constants/tokens';

// 클립보드 감지 목업 — 실제로는 Clipboard.getStringAsync() 로 교체.
const CLIPBOARD_URL = 'https://www.youtube.com/shorts/ldslYEbl...';

// 16 URL로 등록 — 링크 입력 → AI 분석 로딩으로.
export default function AddRecipeUrlScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [showPaste, setShowPaste] = useState(true);

  const canSubmit = url.trim().length > 0;

  return (
    <Screen title="URL로 등록" back>
      <View className="flex-1">
        <View className="gap-2 pt-2">
          <AppText variant="title">레시피 링크를 넣어주세요</AppText>
          <AppText variant="body" className="font-normal text-muted">
            유튜브·인스타 요리 영상은 Ai가 레시피로 만들고,{'\n'}일반 URL 링크는 원본 그대로
            보관해요
          </AppText>
        </View>

        {/* 부제→검색바 40, 검색바 아래(→붙여넣기 카드) 9 */}
        <View className="mt-10 gap-[9px]">
          <SearchBar
            placeholder="예) https://"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          {/* 클립보드 붙여넣기 제안 — 링크 미입력 시에만 */}
          {showPaste && !canSubmit ? (
            <Pressable
              onPress={() => {
                setUrl(CLIPBOARD_URL);
                setShowPaste(false);
              }}
              className="h-[72px] flex-row items-center gap-2 rounded-[12px] border border-primary/50 bg-primary/10 px-4 active:opacity-90"
              accessibilityRole="button"
            >
              <Image
                source={require('../assets/images/clipboard.png')}
                style={{ width: 24, height: 24 }}
                tintColor={palette.primary}
                contentFit="contain"
              />
              <View className="flex-1">
                <Text className="text-chip font-semibold text-foreground">
                  복사한 링크를 붙여넣을까요?
                </Text>
                <Text numberOfLines={1} className="text-chip text-muted">
                  {CLIPBOARD_URL}
                </Text>
              </View>
              <Pressable onPress={() => setShowPaste(false)} hitSlop={8} accessibilityLabel="닫기">
                <Text className="text-[16px] leading-none text-muted">✕</Text>
              </Pressable>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="pb-4">
        <Button
          label="등록하기"
          disabled={!canSubmit}
          onPress={() => router.push('/add-recipe-loading')}
        />
      </View>
    </Screen>
  );
}
