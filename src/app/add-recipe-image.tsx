import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText, Button, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useCreateIngestionJob } from '@/hooks/use-api';
import { ApiError, uploadImage } from '@/lib/api';
import { ImagePickerUnavailableError, pickImage, type PickedImage } from '@/lib/pick-image';

// 17 이미지로 등록 — 캡처 이미지 업로드 → OCR 로딩으로.
export default function AddRecipeImageScreen() {
  const router = useRouter();
  const createJob = useCreateIngestionJob();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  // 선택한 사진들을 INGESTION_INPUT으로 업로드 → objectKey들로 분석 요청 → 로딩(폴링) 화면.
  const onSubmit = async () => {
    setUploading(true);
    try {
      const inputImageKeys = await Promise.all(
        images.map((img) => uploadImage('INGESTION_INPUT', img)),
      );
      const { ingestionJobId } = await createJob.mutateAsync({
        inputType: 'IMAGE',
        inputImageKeys,
      });
      router.push({
        pathname: '/add-recipe-loading',
        params: { jobId: String(ingestionJobId), inputType: 'IMAGE' },
      });
    } catch (e) {
      Alert.alert(
        '요청 실패',
        e instanceof ApiError ? e.message : '사진 업로드 또는 요청에 실패했어요.',
      );
    } finally {
      setUploading(false);
    }
  };

  // 갤러리에서 원본 사진 선택(OCR용이라 크롭 안 함). 여러 장은 반복 탭.
  const addImage = async () => {
    try {
      const picked = await pickImage();
      if (picked) setImages((prev) => [...prev, picked]);
    } catch (e) {
      if (e instanceof ImagePickerUnavailableError) {
        Alert.alert('사진 기능 준비 중', '앱을 다시 빌드하면 사진 추가를 사용할 수 있어요.');
        return;
      }
      Alert.alert('오류', '사진을 불러오지 못했어요.');
    }
  };
  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  return (
    <Screen title="이미지로 등록" back>
      <View className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-4 pt-2">
          {/* 제목 + 부제 (title top126 / subtitle top165 → 간격 8) */}
          <View className="gap-2">
            <AppText variant="title">레시피 이미지를 올려주세요</AppText>
            <AppText variant="body" className="font-normal text-muted">
              이미지를 통해 AI가 레시피와 자료를 추출해{'\n'}쉽게 등록이 가능합니다
            </AppText>
          </View>

          {/* 업로드 박스 — 362×362 정사각, field, r20, 카메라24+텍스트 중앙 (부제 아래 20) */}
          <Pressable
            onPress={addImage}
            className="mt-5 aspect-square w-full flex-row items-center justify-center gap-2 rounded-[20px] bg-field active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel="대표 사진 추가"
          >
            <Image
              source={require('../assets/images/ic-camera.png')}
              style={{ width: 24, height: 24 }}
              tintColor={palette.muted}
              contentFit="contain"
            />
            <Text className="text-body text-muted">대표 사진 추가 (선택)</Text>
          </Pressable>

          {/* 썸네일 그리드 — 3열 청킹(기기 폭 무관), r12, 열16/행20 (업로드 박스 아래 20) */}
          {images.length > 0 ? (
            <View className="mt-5 gap-5">
              {Array.from({ length: Math.ceil(images.length / 3) }, (_, r) => (
                <View key={r} className="flex-row gap-4">
                  {[0, 1, 2].map((c) => {
                    const idx = r * 3 + c;
                    const img = images[idx];
                    // 빈 칸은 스페이서로 채워 마지막 줄 셀 크기·좌측정렬 유지
                    if (!img) return <View key={c} className="flex-1" />;
                    return (
                      <View key={c} className="aspect-square flex-1">
                        <Image
                          source={{ uri: img.uri }}
                          style={{ width: '100%', height: '100%', borderRadius: 12 }}
                          contentFit="cover"
                        />
                        {/* 삭제 배지 — 우상단 8px 인셋, 20원 border primary, X primary */}
                        <Pressable
                          onPress={() => removeImage(idx)}
                          hitSlop={6}
                          accessibilityRole="button"
                          accessibilityLabel="이미지 삭제"
                          className="absolute right-2 top-2 h-5 w-5 items-center justify-center rounded-full border border-primary bg-surface active:opacity-80"
                        >
                          <Feather name="x" size={13} color={palette.primary} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>

      <View className="pb-4">
        <Button
          label={uploading ? '업로드 중…' : '등록하기'}
          disabled={images.length === 0 || uploading || createJob.isPending}
          onPress={onSubmit}
        />
      </View>
    </Screen>
  );
}
