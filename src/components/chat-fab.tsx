import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppText, PressableScale } from '@/components/ui';
import { palette } from '@/constants/tokens';

// RAG 서버(server.py) 주소. 시뮬레이터는 맥의 localhost에 닿는다.
// 실기기에선 맥 LAN IP로 바꾸거나 EXPO_PUBLIC_RAG_URL로 주입.
const RAG_URL = (process.env.EXPO_PUBLIC_RAG_URL ?? 'http://localhost:8100').replace(/\/+$/, '');

type Msg = { role: 'me' | 'bot'; text: string };

const GREETING: Msg = {
  role: 'bot',
  text: '안녕하세요! 별따먹자 문서 기반으로 답해드려요. 무엇이 궁금하세요?',
};

// 오른쪽 아래 플로팅 채팅 버튼 → 채팅 모달.
export function ChatFab({ bottom = 90 }: { bottom?: number }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const toEnd = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'me', text: q }]);
    setBusy(true);
    toEnd();
    try {
      const res = await fetch(`${RAG_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        data.error
          ? { role: 'bot', text: `⚠️ 오류: ${data.error}` }
          : { role: 'bot', text: data.answer ?? '(빈 응답)' },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'bot', text: '⚠️ RAG 서버에 연결하지 못했어요. server.py가 떠 있는지 확인하세요.' },
      ]);
    } finally {
      setBusy(false);
      toEnd();
    }
  };

  return (
    <>
      {/* 플로팅 채팅 버튼 */}
      <View pointerEvents="box-none" className="absolute right-5 items-end" style={{ bottom }}>
        <PressableScale
          onPress={() => setOpen(true)}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel="AI 채팅 열기"
          className="h-14 w-14 items-center justify-center rounded-full bg-primary"
        >
          <Feather name="message-circle" size={26} color={palette.ink} />
        </PressableScale>
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <SafeAreaProvider>
          <View className="flex-1 bg-background">
            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
              {/* 헤더 */}
              <View className="flex-row items-center gap-2.5 border-b border-disabled-line px-screen py-3">
                <View className="h-2.5 w-2.5 rounded-full bg-success" />
                <View>
                  <AppText variant="body" className="font-bold">
                    문서 RAG
                  </AppText>
                  <Text className="text-[12px] leading-[14px] text-muted">
                    bge-m3 · BM25 · qwen2.5
                  </Text>
                </View>
                <Pressable
                  onPress={() => setOpen(false)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="닫기"
                  className="ml-auto"
                >
                  <Feather name="x" size={24} color={palette.muted} />
                </Pressable>
              </View>

              <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={8}
              >
                {/* 메시지 목록 */}
                <ScrollView
                  ref={scrollRef}
                  contentContainerClassName="gap-3 px-screen py-4"
                  onContentSizeChange={toEnd}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map((m, i) => (
                    <View key={i} className={m.role === 'me' ? 'items-end' : 'items-start'}>
                      <View
                        className={`max-w-[82%] rounded-[14px] border border-disabled-line px-3 py-2.5 ${
                          m.role === 'me'
                            ? 'rounded-br-[5px] bg-field'
                            : 'rounded-bl-[5px] bg-surface'
                        }`}
                      >
                        <Text className="text-[14.5px] leading-[22px] text-foreground">
                          {m.text}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {busy ? (
                    <View className="items-start">
                      <View className="rounded-[14px] rounded-bl-[5px] border border-disabled-line bg-surface px-4 py-3">
                        <ActivityIndicator color={palette.muted} size="small" />
                      </View>
                    </View>
                  ) : null}
                </ScrollView>

                {/* 입력 */}
                <View className="flex-row items-center gap-2 border-t border-disabled-line px-3 py-3">
                  <TextInput
                    className="flex-1 rounded-[12px] bg-field px-4 py-2.5 text-foreground"
                    style={{ fontSize: 15, lineHeight: 20 }}
                    placeholder="문서에 대해 질문하기…"
                    placeholderTextColor={palette.muted}
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={send}
                    returnKeyType="send"
                    editable={!busy}
                  />
                  <PressableScale
                    onPress={send}
                    haptic="light"
                    accessibilityRole="button"
                    accessibilityLabel="보내기"
                    className={`h-11 w-11 items-center justify-center rounded-full ${
                      input.trim() && !busy ? 'bg-primary' : 'bg-disabled'
                    }`}
                  >
                    <Feather
                      name="arrow-up"
                      size={22}
                      color={input.trim() && !busy ? palette.ink : palette.muted}
                    />
                  </PressableScale>
                </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </View>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}
