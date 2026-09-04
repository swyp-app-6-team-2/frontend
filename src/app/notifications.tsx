import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, PressableScale, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { fireHaptic } from '@/lib/haptics';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 시간 휠 데이터
const AMPM = ['오전', '오후'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1)); // 1~12
const MINS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // 00~59

const parseTime = (t: string) => {
  const [ap, hm] = t.split(' ');
  const [h, m] = hm.split(':');
  return {
    ampm: Math.max(0, AMPM.indexOf(ap)),
    hour: Math.max(0, HOURS.indexOf(h)),
    min: Math.max(0, MINS.indexOf(m)),
  };
};
const formatTime = (a: number, h: number, m: number) => `${AMPM[a]} ${HOURS[h]}:${MINS[m]}`;

// 52×28 pill 토글 — on=primary, 노브(22)는 좌↔우로 슬라이드. reduce-motion은 기본값 존중.
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    x.set(withTiming(value ? 1 : 0, { duration: 160 }));
  }, [value, x]);
  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() * 24 }] }));
  return (
    <Pressable
      onPress={() => {
        fireHaptic('selection');
        onChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      className={`h-7 w-[52px] justify-center rounded-full ${value ? 'bg-primary' : 'bg-disabled'}`}
    >
      <Animated.View
        style={[
          {
            width: 22,
            height: 22,
            marginLeft: 3,
            borderRadius: 99,
            backgroundColor: palette.foreground,
            shadowColor: '#7C2500',
            shadowOpacity: 0.25,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
          },
          knobStyle,
        ]}
      />
    </Pressable>
  );
}

const ITEM_H = 48;

// 스냅 스크롤 휠 — 중앙 슬롯 항목만 흰색, 나머지는 disabled. 스크롤에 따라 onChange.
function Wheel({
  items,
  initialIndex,
  onChange,
  fontSize = 36,
  width = 56,
}: {
  items: string[];
  initialIndex: number;
  onChange: (i: number) => void;
  fontSize?: number;
  width?: number;
}) {
  const [sel, setSel] = useState(initialIndex);

  const update = (y: number) => {
    const i = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));
    setSel((prev) => {
      if (i !== prev) {
        onChange(i);
        fireHaptic('selection');
      }
      return i;
    });
  };

  return (
    <View style={{ height: ITEM_H * 3, width }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        // 마운트 시 네이티브에서 바로 초기 위치 (아이템 높이가 고정이라 안전)
        contentOffset={{ x: 0, y: initialIndex * ITEM_H }}
        onScroll={(e) => update(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
      >
        {items.map((it, i) => (
          <View key={it} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize,
                fontWeight: '500',
                color: i === sel ? palette.foreground : palette.disabled,
              }}
            >
              {it}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// 무한 루프 휠 — 항목을 여러 번 반복해 깔고, 끝에 가까워지면 같은 값의 중앙 블록으로
// 조용히 되돌려 12→1·59→00처럼 끊김 없이 이어지게 한다. 중앙 슬롯 항목만 흰색.
function LoopWheel({
  items,
  initialIndex,
  onChange,
  fontSize = 36,
  width = 56,
}: {
  items: string[];
  initialIndex: number;
  onChange: (i: number) => void;
  fontSize?: number;
  width?: number;
}) {
  const n = items.length;
  const reps = Math.max(5, Math.round(300 / n)); // 총 ~300개
  const mid = Math.floor(reps / 2);
  const total = n * reps;
  const data = useMemo(
    () => Array.from({ length: total }, (_, k) => items[k % n]),
    [items, n, total],
  );
  const ref = useRef<ScrollView>(null);
  const startAbs = mid * n + initialIndex;
  const [centerAbs, setCenterAbs] = useState(startAbs);

  const onScroll = (y: number) => {
    const abs = Math.max(0, Math.min(total - 1, Math.round(y / ITEM_H)));
    setCenterAbs((prev) => {
      if (abs !== prev) {
        if (abs % n !== ((prev % n) + n) % n) onChange(((abs % n) + n) % n);
        fireHaptic('selection');
      }
      return abs;
    });
  };
  // 끝 근처면 같은 값의 중앙 블록 위치로 순간 이동(시각적으로 동일 → 이음새 없음).
  const recenter = (y: number) => {
    const abs = Math.round(y / ITEM_H);
    if (abs < n || abs > total - n) {
      const mod = ((abs % n) + n) % n;
      const target = mid * n + mod;
      ref.current?.scrollTo({ y: target * ITEM_H, animated: false });
      setCenterAbs(target);
    }
  };

  return (
    <View style={{ height: ITEM_H * 3, width }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: startAbs * ITEM_H }}
        onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(e) => recenter(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
      >
        {data.map((it, k) => (
          <View key={k} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize,
                fontWeight: '500',
                color: k === centerAbs ? palette.foreground : palette.disabled,
              }}
            >
              {it}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// 시간 선택 바텀시트 — 딤 + 슬라이드업 + 오전/오후·시·분 휠 + 취소/확인.
function TimeSheet({
  initial,
  onCancel,
  onConfirm,
}: {
  initial: string;
  onCancel: () => void;
  onConfirm: (time: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const p = parseTime(initial);
  const sel = useRef({ ampm: p.ampm, hour: p.hour, min: p.min });

  return (
    <Modal transparent visible animationType="none" onRequestClose={onCancel}>
      <View className="flex-1 justify-end">
        {/* 딤 — 탭하면 취소 */}
        <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1 }}>
          <Pressable
            className="flex-1 bg-background/85"
            onPress={onCancel}
            accessibilityLabel="닫기"
          />
        </Animated.View>

        {/* 바텀시트 */}
        <Animated.View
          entering={SlideInDown.springify().damping(22).mass(0.9)}
          className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-field"
          style={{
            paddingBottom: insets.bottom + 26,
            shadowColor: '#000000',
            shadowOpacity: 0.35,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: -9 },
          }}
        >
          <View className="items-center gap-8 px-5 pt-8">
            {/* 시:분 휠 */}
            <View className="flex-row items-center justify-center gap-3">
              <Wheel
                items={AMPM}
                initialIndex={p.ampm}
                fontSize={24}
                width={56}
                onChange={(i) => (sel.current.ampm = i)}
              />
              <LoopWheel
                items={HOURS}
                initialIndex={p.hour}
                fontSize={36}
                width={44}
                onChange={(i) => (sel.current.hour = i)}
              />
              <Text style={{ fontSize: 36, fontWeight: '700', color: palette.foreground }}>:</Text>
              <LoopWheel
                items={MINS}
                initialIndex={p.min}
                fontSize={36}
                width={56}
                onChange={(i) => (sel.current.min = i)}
              />
            </View>

            {/* 취소 / 확인 */}
            <View className="flex-row gap-3 self-stretch">
              <Pressable
                onPress={onCancel}
                accessibilityRole="button"
                className="h-[52px] flex-1 items-center justify-center rounded-pill bg-popup-button active:opacity-80"
              >
                <Text className="text-[16px] font-semibold text-popup-button-text">취소</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  fireHaptic('success');
                  onConfirm(formatTime(sel.current.ampm, sel.current.hour, sel.current.min));
                }}
                accessibilityRole="button"
                className="h-[52px] flex-1 items-center justify-center rounded-pill bg-primary active:opacity-90"
              >
                <Text className="text-[16px] font-semibold text-ink">확인</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// 마이 > 알림 설정 — 알림 수신 토글 + 시간 설정(편집·시간 휠 바텀시트) + 요일 선택.
export default function NotificationsScreen() {
  const [notifOn, setNotifOn] = useState(true);
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState<Set<number>>(() => new Set([0, 1, 2])); // 기본 일·월·화
  const [alarms, setAlarms] = useState([
    { label: '아침 알람', time: '오전 8:00' },
    { label: '점심 알람', time: '오후 12:00' },
    { label: '저녁 알람', time: '오후 6:00' },
  ]);
  const [sheetFor, setSheetFor] = useState<number | null>(null);

  const toggleDay = (i: number) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <>
      <Screen title="알림 설정" back scroll contentClassName="gap-6">
        {/* 알림 수신 + 토글 */}
        <View className="flex-row items-center justify-between">
          <View className="gap-2">
            <AppText variant="body">알림 수신</AppText>
            <Text className="text-[14px] font-medium leading-[18px] text-body-muted">
              리마인드 알림을 받을 수 있어요.
            </Text>
          </View>
          <Toggle value={notifOn} onChange={setNotifOn} />
        </View>

        {/* 시간 설정 + 편집 토글 */}
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <AppText variant="body">시간 설정</AppText>
            <Pressable accessibilityRole="button" onPress={() => setEditing((e) => !e)} hitSlop={8}>
              <Text className="text-[16px] font-medium text-muted">
                {editing ? '완료' : '편집'}
              </Text>
            </Pressable>
          </View>

          {/* 알람 시간 — 편집 모드에서 탭하면 시간 휠 바텀시트 */}
          {alarms.map((a, i) => (
            <View key={a.label} className="gap-2">
              <Text className="text-[16px] leading-[21px] text-muted">{a.label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${a.label} 시간 ${a.time}`}
                disabled={!editing}
                onPress={() => setSheetFor(i)}
                className={`flex-row items-center gap-2.5 rounded-pill bg-field px-4 py-2.5 active:opacity-80 ${
                  editing ? 'border border-primary' : ''
                }`}
              >
                <Feather name="clock" size={24} color={palette.muted} />
                <Text className="text-[16px] leading-[21px] text-foreground">{a.time}</Text>
              </Pressable>
            </View>
          ))}

          {/* + 추가 (편집 모드에서만 활성 느낌) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알람 추가"
            disabled={!editing}
            onPress={() =>
              setAlarms((prev) => [
                ...prev,
                { label: `알람 ${prev.length + 1}`, time: '오전 9:00' },
              ])
            }
            className={`h-12 flex-row items-center justify-center gap-1 rounded-pill border border-disabled ${
              editing ? 'active:opacity-80' : 'opacity-50'
            }`}
          >
            <Feather name="plus" size={20} color={palette.muted} />
            <Text className="text-[16px] leading-[21px] text-muted">추가</Text>
          </Pressable>
        </View>

        {/* 알림 요일 설정 */}
        <View className="gap-4">
          <Text className="text-[16px] leading-[21px] text-muted">알림 요일 설정</Text>
          <View className="flex-row justify-between">
            {DAYS.map((d, i) => {
              const on = days.has(i);
              // 일=빨강(error), 토=파랑(info), 그 외 흰색 — 선택 여부와 무관하게 유지.
              const textColor = i === 0 ? 'text-error' : i === 6 ? 'text-info' : 'text-foreground';
              return (
                <PressableScale
                  key={d}
                  onPress={() => toggleDay(i)}
                  haptic="selection"
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className={`h-[42px] w-[42px] items-center justify-center rounded-full ${
                    on ? 'border border-primary bg-surface' : ''
                  }`}
                >
                  <Text className={`text-[14px] font-medium leading-[18px] ${textColor}`}>{d}</Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      </Screen>

      {/* 시간 선택 바텀시트 */}
      {sheetFor !== null ? (
        <TimeSheet
          initial={alarms[sheetFor].time}
          onCancel={() => setSheetFor(null)}
          onConfirm={(time) => {
            setAlarms((prev) => prev.map((a, i) => (i === sheetFor ? { ...a, time } : a)));
            setSheetFor(null);
          }}
        />
      ) : null}
    </>
  );
}
