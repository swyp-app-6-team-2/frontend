import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  INQUIRY_TYPE_LABEL,
  InquiryTypeSheet,
  type InquiryType,
} from '@/components/inquiry-type-sheet';
import { AlertDialog, AppText, PressableScale, ScreenHeader } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useCreateInquiry, useInquiries } from '@/hooks/use-api';
import { ApiError, uploadImage } from '@/lib/api';
import { fireHaptic } from '@/lib/haptics';
import { ImagePickerUnavailableError, pickImage, type PickedImage } from '@/lib/pick-image';

// 접수 시각 표기 — 서버 UTC ISO → 로컬 "YYYY.MM.DD HH:mm".
function formatInquiryDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 문의하기 — 작성 폼 / 문의내역 확인 (좌우 페이징 스와이프).
export default function InquiryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<ScrollView>(null);

  // 키보드 높이 추적 — 작성 폼(가로 페이저 안)에서는 KeyboardAvoidingView가 프레임을
  // 제대로 못 재서 하단 고정 버튼이 가린다. 페이지 컨테이너에 키보드 높이만큼 아래 여백을
  // 줘서 입력란·버튼을 키보드 위로 밀어 올린다. safe-area 하단은 키보드가 덮으므로 뺀다.
  const [keyboardPad, setKeyboardPad] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e) =>
      setKeyboardPad(Math.max(0, e.endCoordinates.height - insets.bottom)),
    );
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardPad(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab = params.tab === 'history' ? 1 : 0; // inquiry-success에서 오면 내역 탭
  const [tab, setTab] = useState(initialTab); // 0=작성, 1=내역
  const [confirm, setConfirm] = useState<null | 'leave' | 'submit'>(null); // 확인 팝업
  const [type, setType] = useState<InquiryType | null>(null); // 문의유형 선택값
  const [typeSheet, setTypeSheet] = useState(false); // 문의유형 선택 시트
  const [title, setTitle] = useState(''); // 제목(필수)
  const [content, setContent] = useState(''); // 문의내용(필수, 최소 10자)
  // 유형·제목·내용은 필수, 내용은 공백 제외 10자 이상이어야 접수 가능.
  const canSubmit = type != null && title.trim().length > 0 && content.trim().length >= 10;

  // 문의내역(내 문의 목록) — 최근 1년, 최신순.
  const { data: historyData, isLoading: historyLoading, isError: historyError } = useInquiries();
  const inquiries = historyData?.inquiries ?? [];
  const createInquiry = useCreateInquiry();

  // 첨부 이미지(최대 5장). 선택 시 로컬로 담아두고, 접수 시점에 업로드해 objectKey로 보낸다.
  const [photos, setPhotos] = useState<PickedImage[]>([]);
  const onPickPhoto = async () => {
    if (photos.length >= 5) return;
    try {
      const img = await pickImage();
      if (img) setPhotos((prev) => [...prev, img]);
    } catch (e) {
      Alert.alert(
        '사진을 불러올 수 없어요',
        e instanceof ImagePickerUnavailableError
          ? '앱을 다시 빌드한 뒤 사용할 수 있어요.'
          : '다시 시도해주세요.',
      );
    }
  };
  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, k) => k !== i));

  // 접수 확인 팝업 '확인' → 첨부 업로드 → 서버 접수 → 완료 화면.
  const onSubmit = async () => {
    if (!canSubmit || type == null || createInquiry.isPending) return;
    setConfirm(null);
    try {
      const attachmentKeys = await Promise.all(
        photos.map((p) => uploadImage('INQUIRY_ATTACHMENT', p)),
      );
      await createInquiry.mutateAsync({
        type,
        title: title.trim(),
        content: content.trim(),
        attachmentKeys: attachmentKeys.length ? attachmentKeys : undefined,
      });
      fireHaptic('success');
      router.replace('/inquiry-success');
    } catch (e) {
      Alert.alert(
        '문의 접수 실패',
        e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.',
      );
    }
  };

  // 뒤로가기 — 작성 탭에서 작성 중이면 이탈 확인 팝업(취소 버튼을 대체), 아니면 그냥 뒤로.
  const hasDraft =
    type != null || title.trim().length > 0 || content.trim().length > 0 || photos.length > 0;
  const onBack = () => {
    if (tab === 0 && hasDraft) setConfirm('leave');
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

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
        <ScreenHeader title="문의하기" back onClose={onBack} />

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
          contentOffset={{ x: initialTab * width, y: 0 }}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onPaged}
          className="flex-1"
        >
          {/* 페이지 0 — 작성 폼. 키보드 높이만큼 아래 여백 → 입력란·하단 버튼이 키보드 위로. */}
          <View style={{ width, paddingBottom: keyboardPad }} className="flex-1">
            <ScrollView
              contentContainerClassName="gap-6 px-screen pb-6 pt-6"
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* 문의유형 (드롭다운) — Figma: 라벨행(pad 8/16/8/8) + 인풋 h44 + 24 chevron */}
              <View>
                <View className="flex-row items-center py-2 pl-2 pr-4">
                  <AppText variant="body">문의유형</AppText>
                </View>
                <Pressable
                  className="h-[44px] flex-row items-center justify-between rounded-pill bg-field px-4 active:opacity-80"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: typeSheet }}
                  onPress={() => {
                    fireHaptic('selection');
                    setTypeSheet(true);
                  }}
                >
                  <AppText
                    variant="body"
                    className={type ? 'font-normal text-foreground' : 'font-normal text-muted'}
                  >
                    {type ? INQUIRY_TYPE_LABEL[type] : '문의 유형을 선택해주세요.'}
                  </AppText>
                  <Image
                    source={require('../assets/images/ic-chevron-down.png')}
                    style={{ width: 24, height: 24, tintColor: palette.muted }}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>

              {/* 제목 (필수) — Figma: 라벨행(pad 8/16/8/8) + pill input h44 */}
              <View>
                <View className="flex-row items-center py-2 pl-2 pr-4">
                  <AppText variant="body">제목</AppText>
                </View>
                <View className="h-[44px] flex-row items-center rounded-pill bg-field px-4">
                  <TextInput
                    className="flex-1 text-foreground"
                    style={{ fontSize: 16, lineHeight: 21, paddingVertical: 0 }}
                    placeholder="제목을 입력해주세요"
                    placeholderTextColor={palette.muted}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
              </View>

              {/* 문의내용 (멀티라인, 필수·최소 10자) — Figma: 박스 h177 r12 pad 10/16, 라벨 없음 */}
              <View>
                <View className="h-[177px] rounded-[12px] bg-field px-4 py-2.5">
                  <TextInput
                    className="flex-1 text-foreground"
                    style={{ fontSize: 16, lineHeight: 21 }}
                    placeholder="내용을 입력해 주세요"
                    placeholderTextColor={palette.muted}
                    multiline
                    textAlignVertical="top"
                    value={content}
                    onChangeText={setContent}
                  />
                </View>
                {content.trim().length > 0 && content.trim().length < 10 ? (
                  <Text className="mt-1 pl-2 text-[13px] leading-[17px] text-muted">
                    최소 10자 이상 입력해주세요.
                  </Text>
                ) : null}
              </View>

              {/* 사진첨부 (최대 5장) */}
              <View className="gap-2">
                <AppText variant="body">사진첨부</AppText>
                <View className="flex-row flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <View
                      key={`${p.uri}-${i}`}
                      className="h-[100px] w-[100px] overflow-hidden rounded-[12px]"
                    >
                      <Image
                        source={{ uri: p.uri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => removePhoto(i)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="첨부 사진 삭제"
                        className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-background/80"
                      >
                        <Text className="text-[14px] leading-[14px] text-foreground">×</Text>
                      </Pressable>
                    </View>
                  ))}
                  {photos.length < 5 ? (
                    <Pressable
                      className="h-[100px] w-[100px] items-center justify-center rounded-[12px] border border-dashed border-disabled active:opacity-80"
                      accessibilityRole="button"
                      accessibilityLabel="사진 첨부"
                      onPress={onPickPhoto}
                    >
                      <Text className="text-muted" style={{ fontSize: 24 }}>
                        ＋
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </ScrollView>

            {/* 하단 고정 버튼 — 완료하기(단일). 취소는 헤더 뒤로가기로 대체됨 */}
            <View className="px-screen pb-8 pt-4">
              <Pressable
                className={`h-[52px] items-center justify-center rounded-[30px] active:opacity-90 ${
                  canSubmit ? 'bg-primary' : 'bg-disabled'
                }`}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit }}
                disabled={!canSubmit}
                onPress={() => setConfirm('submit')}
              >
                <Text
                  className={`text-body font-semibold ${canSubmit ? 'text-ink' : 'text-muted'}`}
                >
                  문의접수
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 페이지 1 — 문의내역 확인 */}
          <View style={{ width }} className="flex-1">
            <ScrollView
              contentContainerClassName="gap-3 px-screen pb-6 pt-6"
              showsVerticalScrollIndicator={false}
            >
              {historyLoading ? (
                <View className="items-center py-20">
                  <ActivityIndicator color={palette.primary} />
                </View>
              ) : historyError ? (
                <View className="items-center py-20">
                  <AppText variant="body" className="text-muted">
                    문의내역을 불러오지 못했어요.
                  </AppText>
                </View>
              ) : inquiries.length === 0 ? (
                <View className="items-center py-20">
                  <AppText variant="body" className="text-muted">
                    아직 접수한 문의가 없어요.
                  </AppText>
                </View>
              ) : (
                inquiries.map((q) => {
                  const answered = q.status === 'ANSWERED';
                  return (
                    <PressableScale
                      key={q.inquiryId}
                      onPress={() =>
                        router.push({
                          pathname: '/inquiry-detail',
                          params: { id: String(q.inquiryId) },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${answered ? '답변완료' : '접수 완료'} 문의 상세`}
                      scaleTo={0.98}
                      className="gap-3 rounded-[12px] bg-field px-4 py-5"
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className={`items-center justify-center rounded-pill px-3 py-1 ${answered ? 'bg-success' : 'bg-disabled'}`}
                        >
                          <Text className="text-[12px] font-bold text-foreground">
                            {answered ? '답변완료' : '접수 완료'}
                          </Text>
                        </View>
                        <Text className="text-[14px] font-medium leading-[18px] text-muted">
                          {formatInquiryDate(q.createdAt)}
                        </Text>
                      </View>
                      <Text
                        className="text-[16px] font-medium leading-[21px] text-foreground"
                        numberOfLines={2}
                      >
                        {q.title}
                      </Text>
                    </PressableScale>
                  );
                })
              )}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* 문의유형 선택 시트 */}
      {typeSheet ? (
        <InquiryTypeSheet
          selected={type}
          onCancel={() => setTypeSheet(false)}
          onApply={(t) => {
            setType(t);
            setTypeSheet(false);
          }}
        />
      ) : null}

      {/* 확인 팝업 — 취소(작성 중단) / 문의 접수 */}
      {confirm ? (
        <View style={StyleSheet.absoluteFill}>
          {confirm === 'leave' ? (
            <AlertDialog
              mascot={
                <Image
                  source={require('../assets/images/mascot-inquiry.png')}
                  style={{ width: 150, height: 129 }}
                  resizeMode="contain"
                />
              }
              title="문의를 중단하고 나가시겠어요?"
              message="작성한 내용은 모두 사라져요"
              actions={[
                { label: '취소', onPress: () => setConfirm(null) },
                { label: '나가기', tone: 'primary', onPress: () => router.replace('/my') },
              ]}
            />
          ) : (
            <AlertDialog
              message={'작성한 내용으로\n문의를 접수할까요?'}
              actions={[
                { label: '취소', onPress: () => setConfirm(null) },
                { label: '확인', tone: 'primary', onPress: onSubmit },
              ]}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}
