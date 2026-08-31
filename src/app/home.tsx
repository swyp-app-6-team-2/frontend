import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from '@/components/tab-bar';
import { AppText } from '@/components/ui';

const RECO = ['랜덤으로 골라줘', '내재료로 골라줘'];

export default function HomeScreen() {
  const [hasStar, setHasStar] = useState(true);
  const [reco, setReco] = useState(RECO[0]);
  const [open, setOpen] = useState(false);
  const lastTap = useRef(0);

  // 더블탭 → 별 토글(별똥별 떨어짐)
  const onSkyTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) setHasStar((s) => !s);
    lastTap.current = now;
  };

  return (
    <View className="flex-1 bg-background">
      {/* 밤하늘 산 (뒤쪽 밝은 산 + 앞쪽 파란 산) */}
      <View pointerEvents="none" className="absolute inset-0 justify-end">
        <Image
          source={require('../assets/images/mountain2.png')}
          style={{
            position: 'absolute',
            bottom: 128,
            left: -12,
            width: '58%',
            aspectRatio: 253 / 119,
          }}
          contentFit="contain"
        />
        <Image
          source={require('../assets/images/mountain.png')}
          style={{ width: '100%', aspectRatio: 328 / 176 }}
          contentFit="cover"
        />
      </View>

      {/* 빈 하늘 더블탭 영역 */}
      <Pressable className="absolute inset-0" onPress={onSkyTap} accessibilityLabel="밤하늘" />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']} pointerEvents="box-none">
        {/* 상단: 별따먹자 + 별 진행도 */}
        <View
          className="flex-row items-center justify-between px-screen pt-2"
          pointerEvents="box-none"
        >
          <AppText variant="title">별따먹자</AppText>
          <View className="flex-row items-center gap-1 rounded-pill border border-primary/40 bg-surface/60 px-3 py-1">
            <Text className="text-primary">★</Text>
            <Text className="font-bold text-foreground">5/10</Text>
          </View>
        </View>

        {/* 중앙 별 */}
        <View className="flex-1 items-center justify-center" pointerEvents="none">
          {hasStar ? (
            <Image
              source={require('../assets/images/star.png')}
              style={{ width: 40, height: 40 }}
              contentFit="contain"
            />
          ) : null}
        </View>

        {/* 하단: 캐릭터 + 추천 드롭다운 */}
        <View className="px-screen pb-3" pointerEvents="box-none">
          <View className="flex-row items-end justify-between" pointerEvents="box-none">
            <Image
              source={require('../assets/images/character.png')}
              style={{ width: 68, height: 64 }}
              contentFit="contain"
            />
            <View className="mb-10 items-end gap-2" pointerEvents="box-none">
              {open ? (
                <View className="w-52 overflow-hidden rounded-card bg-surface p-1">
                  {RECO.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => {
                        setReco(r);
                        setOpen(false);
                      }}
                      className="flex-row items-center gap-2 rounded-xl px-3 py-3 active:bg-field"
                    >
                      <Text className={reco === r ? 'text-primary' : 'text-transparent'}>●</Text>
                      <Text
                        className={`text-body ${reco === r ? 'text-foreground' : 'text-muted'}`}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Pressable
                onPress={() => setOpen((o) => !o)}
                className="flex-row items-center gap-2 rounded-pill border border-foreground/15 bg-surface/80 px-4 py-3 active:opacity-80"
              >
                <Text className="font-medium text-foreground">{reco}</Text>
                <Text className="text-muted">{open ? '▲' : '▼'}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* 떠 있는 탭바 */}
        <TabBar active="home" />
      </SafeAreaView>
    </View>
  );
}
