import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, PressableScale, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { fireHaptic } from '@/lib/haptics';

// 바텀시트를 화면 아래로 밀어내는 거리(px) — 닫힘 슬라이드용.
const SHEET_OFFSCREEN = 700;

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

// 시간 선택 바텀시트 — 상단 알람 전환 세그먼트 + 오전/오후·시·분 휠 + 취소/확인.
function TimeSheet({
  alarms,
  initialIndex,
  onCancel,
  onConfirm,
}: {
  alarms: { label: string; time: string }[];
  initialIndex: number;
  onCancel: () => void;
  onConfirm: (times: string[]) => void;
}) {
  const insets = useSafeAreaInsets();
  const [times, setTimes] = useState(() => alarms.map((a) => a.time));
  const [active, setActive] = useState(initialIndex);
  const p = parseTime(times[active]);
  const sel = useRef({ ampm: p.ampm, hour: p.hour, min: p.min });

  // 등장/닫힘 슬라이드 — 스르륵 위로 등장, 닫을 땐 아래로 하강 후 unmount.
  const reduceMotion = useReduceMotion();
  const ty = useSharedValue(reduceMotion ? 0 : SHEET_OFFSCREEN);
  const op = useSharedValue(reduceMotion ? 1 : 0);
  const pending = useRef<(() => void) | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      ty.value = closing ? SHEET_OFFSCREEN : 0;
      op.value = closing ? 0 : 1;
      if (closing) pending.current?.();
      return;
    }
    if (closing) {
      op.value = withTiming(0, { duration: 220 });
      ty.value = withTiming(SHEET_OFFSCREEN, { duration: 260, easing: Easing.in(Easing.cubic) });
      const done = pending.current;
      const t = setTimeout(() => done?.(), 280);
      return () => clearTimeout(t);
    }
    op.value = withTiming(1, { duration: 200 });
    ty.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [closing, reduceMotion, op, ty]);

  const requestClose = (done: () => void) => {
    pending.current = done;
    setClosing(true);
  };

  const overlayStyle = useAnimatedStyle(() => ({ opacity: op.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  // 다른 알람 칩으로 전환 — 현재 휠 값을 저장 후 그 알람 시간으로 리셋(휠은 key로 리마운트).
  const switchTo = (i: number) => {
    if (i === active) return;
    fireHaptic('selection');
    const cur = formatTime(sel.current.ampm, sel.current.hour, sel.current.min);
    setTimes((prev) => prev.map((t, k) => (k === active ? cur : t)));
    const np = parseTime(times[i]);
    sel.current = { ampm: np.ampm, hour: np.hour, min: np.min };
    setActive(i);
  };

  const confirm = () => {
    fireHaptic('success');
    const cur = formatTime(sel.current.ampm, sel.current.hour, sel.current.min);
    const result = times.map((t, k) => (k === active ? cur : t));
    requestClose(() => onConfirm(result));
  };

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => requestClose(onCancel)}
    >
      <View className="flex-1 justify-end">
        {/* 딤 — 탭하면 취소(스르륵 닫힘) */}
        <Animated.View style={[overlayStyle, { flex: 1 }]}>
          <Pressable
            className="flex-1 bg-background/85"
            onPress={() => requestClose(onCancel)}
            accessibilityLabel="닫기"
          />
        </Animated.View>

        {/* 바텀시트 */}
        <Animated.View
          className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-field"
          style={[
            sheetStyle,
            {
              paddingBottom: insets.bottom + 26,
              shadowColor: '#000000',
              shadowOpacity: 0.35,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: -9 },
            },
          ]}
        >
          <View className="items-center gap-8 px-5 pt-8">
            {/* 상단 알람 전환 세그먼트 (Frame 1437264107) */}
            <View className="w-full flex-row items-center rounded-[105px] bg-field-dark px-5 py-2">
              {alarms.map((a, i) => {
                const on = i === active;
                const short = a.label.replace('알람', '').trim();
                return (
                  <Pressable
                    key={a.label}
                    onPress={() => switchTo(i)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    className={`h-[49px] flex-1 items-center justify-center rounded-[100px] ${
                      on ? 'bg-field' : ''
                    }`}
                    style={
                      on
                        ? {
                            shadowColor: '#050816',
                            shadowOpacity: 0.25,
                            shadowRadius: 12,
                            shadowOffset: { width: 0, height: 0 },
                          }
                        : undefined
                    }
                  >
                    <Text
                      className={`text-[16px] font-medium ${on ? 'text-foreground' : 'text-disabled'}`}
                    >
                      {short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 시:분 휠 — active 바뀌면 remount되어 그 알람 시간으로 */}
            <View className="flex-row items-center justify-center gap-3">
              <Wheel
                key={`ampm-${active}`}
                items={AMPM}
                initialIndex={p.ampm}
                fontSize={24}
                width={56}
                onChange={(i) => (sel.current.ampm = i)}
              />
              <LoopWheel
                key={`hour-${active}`}
                items={HOURS}
                initialIndex={p.hour}
                fontSize={36}
                width={44}
                onChange={(i) => (sel.current.hour = i)}
              />
              <Text style={{ fontSize: 36, fontWeight: '700', color: palette.foreground }}>:</Text>
              <LoopWheel
                key={`min-${active}`}
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
                onPress={() => requestClose(onCancel)}
                accessibilityRole="button"
                className="h-[52px] flex-1 items-center justify-center rounded-pill bg-popup-button active:opacity-80"
              >
                <Text className="text-[16px] font-semibold text-popup-button-text">취소</Text>
              </Pressable>
              <Pressable
                onPress={confirm}
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

// 스와이프 진행도(0→1)에 따라 커지며 페이드인되는 원형 삭제 버튼.
function DeleteAction({
  progress,
  onPress,
  label,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
  label: string;
}) {
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, progress.value);
    return { opacity: p, transform: [{ scale: 0.5 + 0.5 * p }] };
  });
  return (
    <Animated.View style={style} className="h-full justify-center">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={12}
        className="h-11 w-[54px] items-center justify-center active:opacity-60"
      >
        <Image
          source={require('../assets/images/ic-close.png')}
          style={{ width: 16, height: 16 }}
          tintColor={palette.muted}
          contentFit="contain"
        />
      </Pressable>
    </Animated.View>
  );
}

// 알람 행 — 제목 입력 + 시간(탭하면 시트) + 왼쪽 스와이프 삭제.
function AlarmRow({
  alarm,
  editing,
  onPress,
  onDelete,
  onChangeLabel,
}: {
  alarm: { id: string; label: string; time: string };
  editing: boolean;
  onPress: () => void;
  onDelete: () => void;
  onChangeLabel: (text: string) => void;
}) {
  const ref = useRef<SwipeableMethods>(null);
  return (
    <View className="gap-2">
      <TextInput
        value={alarm.label}
        onChangeText={onChangeLabel}
        editable={editing}
        placeholder="알림 제목을 입력해주세요"
        placeholderTextColor={palette.muted}
        className="p-0 text-[16px] leading-[21px] text-muted"
      />
      <ReanimatedSwipeable
        ref={ref}
        renderRightActions={(progress) => (
          <DeleteAction
            progress={progress}
            label={`${alarm.label || '알람'} 삭제`}
            onPress={() => {
              fireHaptic('warning');
              ref.current?.close();
              onDelete();
            }}
          />
        )}
        rightThreshold={40}
        overshootRight={false}
        friction={1.6}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${alarm.label || '알람'} 시간 ${alarm.time}`}
          disabled={!editing}
          onPress={onPress}
          className={`flex-row items-center gap-2.5 rounded-pill bg-field px-4 py-2.5 active:opacity-80 ${
            editing ? 'border border-primary' : ''
          }`}
        >
          <Feather name="clock" size={24} color={palette.muted} />
          <Text className="text-[16px] leading-[21px] text-foreground">{alarm.time}</Text>
        </Pressable>
      </ReanimatedSwipeable>
    </View>
  );
}

// 마이 > 알림 설정 — 알림 수신 토글 + 시간 설정(편집·시간 휠 바텀시트) + 요일 선택.
export default function NotificationsScreen() {
  const [notifOn, setNotifOn] = useState(true);
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState<Set<number>>(() => new Set([0, 1, 2])); // 기본 일·월·화
  const [alarms, setAlarms] = useState([
    { id: 'a1', label: '아침 알람', time: '오전 8:00' },
    { id: 'a2', label: '점심 알람', time: '오후 12:00' },
    { id: 'a3', label: '저녁 알람', time: '오후 6:00' },
  ]);
  const nextId = useRef(4); // 새 알람 고유 id 생성용
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

          {/* 알람 시간 — 탭(편집)하면 시간 시트, 왼쪽으로 밀면 X로 삭제 */}
          {alarms.map((a, i) => (
            <AlarmRow
              key={a.id}
              alarm={a}
              editing={editing}
              onPress={() => setSheetFor(i)}
              onDelete={() => setAlarms((prev) => prev.filter((_, k) => k !== i))}
              onChangeLabel={(text) =>
                setAlarms((prev) => prev.map((al, k) => (k === i ? { ...al, label: text } : al)))
              }
            />
          ))}

          {/* + 추가 (편집 모드에서만 활성 느낌) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알람 추가"
            disabled={!editing}
            onPress={() =>
              setAlarms((prev) => [
                ...prev,
                { id: `a${nextId.current++}`, label: '', time: '오전 9:00' },
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
          alarms={alarms}
          initialIndex={sheetFor}
          onCancel={() => setSheetFor(null)}
          onConfirm={(times) => {
            setAlarms((prev) => prev.map((a, i) => ({ ...a, time: times[i] })));
            setSheetFor(null);
          }}
        />
      ) : null}
    </>
  );
}
