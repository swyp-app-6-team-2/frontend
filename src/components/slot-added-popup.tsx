import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui';
import { fireHaptic } from '@/lib/haptics';

// 슬롯 2개 추가 성공 팝업 — 광고 시청 후 홈에서 노출.
export function SlotAddedPopup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (visible) fireHaptic('success');
  }, [visible]);

  if (!visible) return null;

  return (
    <View className="absolute inset-0 items-center justify-center px-[10px]">
      <Animated.View
        entering={FadeIn.duration(150)}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <View className="flex-1 bg-black/70" />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.springify().damping(18).mass(0.85)}
        style={{ width: '100%', maxWidth: 362 }}
      >
        <View
          className="w-full items-center rounded-[20px] bg-field"
          style={{
            paddingTop: 30,
            paddingHorizontal: 18,
            paddingBottom: 20,
            gap: 26,
            shadowColor: '#000000',
            shadowOpacity: 0.35,
            shadowRadius: 40,
            shadowOffset: { width: 0, height: 20 },
          }}
        >
          <View className="items-center" style={{ gap: 20 }}>
            {/* 아이콘 원 60 · primary 10% */}
            <View
              className="items-center justify-center bg-primary/10"
              style={{ width: 60, height: 60, borderRadius: 99 }}
            >
              <Image
                source={require('../assets/images/star.png')}
                style={{ width: 30, height: 30 }}
                contentFit="contain"
              />
            </View>
            <View className="items-center" style={{ gap: 12 }}>
              <Text
                className="text-center font-bold text-foreground"
                style={{ fontSize: 22, lineHeight: 22 * 1.3 }}
              >
                슬롯 2개가 추가됐어요!
              </Text>
              <Text
                className="text-center font-medium text-body-muted"
                style={{ fontSize: 16, lineHeight: 21 }}
              >
                새로운 별 레시피를 더 저장할 수 있어요
              </Text>
            </View>
          </View>

          <Button label="확인" onPress={onClose} className="rounded-[30px]" />
        </View>
      </Animated.View>
    </View>
  );
}
