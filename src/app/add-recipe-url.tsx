import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SearchBar } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useCreateIngestionJob } from '@/hooks/use-api';
import { ApiError } from '@/lib/api';

// expo-clipboard는 네이티브 모듈 → dev client 리빌드 전이면 로드가 throw할 수 있어 lazy require로 격리.
// 리빌드 전이면 클립보드를 못 읽어 붙여넣기 제안이 안 뜰 뿐, 크래시하지 않는다(직접 입력은 그대로 됨).
type ClipboardModule = typeof import('expo-clipboard');
let clipboardMod: ClipboardModule | null | undefined;
function getClipboard(): ClipboardModule | null {
  if (clipboardMod !== undefined) return clipboardMod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 지연 로드 필수(정적 import 불가)
    clipboardMod = require('expo-clipboard') as ClipboardModule;
  } catch {
    clipboardMod = null;
  }
  return clipboardMod;
}

const isUrl = (s: string) => /^https?:\/\/\S+/i.test(s.trim());

// 16 URL로 등록 — 링크 입력 → AI 분석 로딩으로.
export default function AddRecipeUrlScreen() {
  const router = useRouter();
  const createJob = useCreateIngestionJob();
  const [url, setUrl] = useState('');
  const [clip, setClip] = useState<string | null>(null); // 클립보드의 실제 URL(있을 때만)
  const [showPaste, setShowPaste] = useState(true);

  // 진입 시 실제 클립보드를 읽어 URL이면 붙여넣기 제안. 없으면 제안 안 함.
  useEffect(() => {
    let active = true;
    (async () => {
      const cb = getClipboard();
      if (!cb) return;
      try {
        const text = await cb.getStringAsync();
        if (active && isUrl(text)) setClip(text.trim());
      } catch {
        // 클립보드 접근 실패 — 제안 생략(직접 입력 가능).
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const canSubmit = url.trim().length > 0;

  const onSubmit = async () => {
    try {
      const { ingestionJobId } = await createJob.mutateAsync({
        inputType: 'URL',
        url: url.trim(),
      });
      router.push({
        pathname: '/add-recipe-loading',
        params: { jobId: String(ingestionJobId), inputType: 'URL' },
      });
    } catch (e) {
      Alert.alert('요청 실패', e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.');
    }
  };

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

          {/* 클립보드 붙여넣기 제안 — 클립보드에 실제 URL이 있고, 링크 미입력 시에만 */}
          {showPaste && !canSubmit && clip ? (
            <Pressable
              onPress={() => {
                setUrl(clip);
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
                  {clip}
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
        <Button label="등록하기" disabled={!canSubmit || createJob.isPending} onPress={onSubmit} />
      </View>
    </Screen>
  );
}
