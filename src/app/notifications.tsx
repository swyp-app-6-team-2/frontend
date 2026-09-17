import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, PressableScale, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useNotificationSettings, useSaveNotificationSettings } from '@/hooks/use-api';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import type { NotificationSettings, Weekday } from '@/lib/api/types';
import { fireHaptic } from '@/lib/haptics';

// 바텀시트를 화면 아래로 밀어내는 거리(px) — 닫힘 슬라이드용.
const SHEET_OFFSCREEN = 700;

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 요일 인덱스(0=일..6=토) ↔ 백엔드 enum.
const WEEKDAY_BY_INDEX: Weekday[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];
const INDEX_BY_WEEKDAY: Record<Weekday, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

// UI 시각('오전 8:00') ↔ 서버 'HH:mm'(24h).
function uiTimeTo24(t: string): string {
  const m = t.match(/(오전|오후)\s*(\d{1,2}):(\d{2})/);
  if (!m) return '00:00';
  let h = Number(m[2]);
  const pm = m[1] === '오후';
  if (h === 12) h = pm ? 12 : 0;
  else if (pm) h += 12;
  return `${String(h).padStart(2, '0')}:${m[3]}`;
}
function time24ToUi(t: string): string {
  const [hs, min] = t.split(':');
  const h = Number(hs);
  const pm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pm ? '오후' : '오전'} ${h12}:${min ?? '00'}`;
}

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

// 휠 한 칸 높이 = 행(약 40) + 행간(약 24). 3칸(192)이 Figma 시간 휠(194)·시트 총높이(407)와 맞음.
const ITEM_H = 64;

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
  centerFontSize,
  width = 56,
}: {
  items: string[];
  initialIndex: number;
  onChange: (i: number) => void;
  fontSize?: number;
  /** 중앙(선택) 항목 폰트 크기. Figma는 선택 시:분만 40px, 나머지 36px. */
  centerFontSize?: number;
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
                fontSize: k === centerAbs ? (centerFontSize ?? fontSize) : fontSize,
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
  onConfirm: (times: string[], title: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [times] = useState(() => alarms.map((a) => a.time));
  const [active] = useState(initialIndex);
  const [title, setTitle] = useState(alarms[active]?.label ?? '');
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

  const confirm = () => {
    fireHaptic('success');
    const cur = formatTime(sel.current.ampm, sel.current.hour, sel.current.min);
    const result = times.map((t, k) => (k === active ? cur : t));
    requestClose(() => onConfirm(result, title));
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
          <View className="items-center gap-8 px-5 pt-5">
            {/* 상단 세그먼트 (Frame 1437264107) — 알림 제목 입력. [수정 아이콘] + input. padding 4/24, 높이 57 */}
            <View className="w-full flex-row items-center gap-4 rounded-[105px] bg-field-dark px-6 py-1">
              <Image
                source={require('../assets/images/ic-edit.png')}
                style={{ width: 24, height: 24 }}
                tintColor={palette.disabled}
                contentFit="contain"
              />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="알림 제목을 입력해주세요"
                placeholderTextColor={palette.disabled}
                className="h-[49px] flex-1 p-0 text-[16px] font-medium text-foreground"
              />
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
                centerFontSize={40}
                width={44}
                onChange={(i) => (sel.current.hour = i)}
              />
              <Text style={{ fontSize: 36, fontWeight: '700', color: palette.foreground }}>:</Text>
              <LoopWheel
                key={`min-${active}`}
                items={MINS}
                initialIndex={p.min}
                fontSize={36}
                centerFontSize={40}
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

// 알람 행 — 제목 입력 + 시간(탭하면 시트) + 우측 상시 X 삭제.
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
  return (
    <View className="gap-2">
      <TextInput
        value={alarm.label}
        onChangeText={onChangeLabel}
        editable={editing}
        placeholder="알림 제목을 입력해주세요"
        placeholderTextColor={palette.muted}
        className="px-2 py-0 text-[16px] leading-[21px] text-muted"
      />
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${alarm.label || '알람'} 시간 ${alarm.time}`}
          disabled={!editing}
          onPress={onPress}
          className={`flex-1 flex-row items-center gap-2.5 rounded-pill bg-field px-4 py-2.5 active:opacity-80 ${
            editing ? 'border border-primary' : 'border border-transparent'
          }`}
        >
          <Feather name="clock" size={24} color={palette.muted} />
          <Text className="text-[16px] leading-[21px] text-foreground">{alarm.time}</Text>
        </Pressable>
        {editing ? (
          <Pressable
            onPress={() => {
              fireHaptic('warning');
              onDelete();
            }}
            accessibilityRole="button"
            accessibilityLabel={`${alarm.label || '알람'} 삭제`}
            hitSlop={12}
            className="h-11 w-11 items-center justify-center active:opacity-60"
          >
            <Feather name="x" size={20} color={palette.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// 마이 > 알림 설정 — 알림 수신 토글 + 시간 설정(편집·시간 휠 바텀시트) + 요일 선택.
// 서버 알림 설정을 받아 폼을 초기화한다. 로드 후 마운트되므로 초기값을 useState로 바로 심는다
// (effect로 setState 하지 않음 → 연쇄 렌더 방지).
export default function NotificationsScreen() {
  const { data: settings, isLoading, isError } = useNotificationSettings();
  if (isLoading) {
    return (
      <Screen title="알림 설정" back>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.primary} />
        </View>
      </Screen>
    );
  }
  if (isError || !settings) {
    return (
      <Screen title="알림 설정" back>
        <View className="flex-1 items-center justify-center">
          <AppText variant="body" className="text-muted">
            알림 설정을 불러오지 못했어요.
          </AppText>
        </View>
      </Screen>
    );
  }
  return <NotificationSettingsForm initial={settings} />;
}

// timeSlots가 비어 있으면(신규 사용자) 기본 3개 알람을 시작값으로 보여준다.
const DEFAULT_ALARMS = [
  { id: 'a1', label: '아침 알람', time: '오전 8:00' },
  { id: 'a2', label: '점심 알람', time: '오후 12:00' },
  { id: 'a3', label: '저녁 알람', time: '오후 6:00' },
];

function NotificationSettingsForm({ initial }: { initial: NotificationSettings }) {
  const [notifOn, setNotifOn] = useState(initial.enabled);
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState<Set<number>>(
    () => new Set(initial.weekdays.map((w) => INDEX_BY_WEEKDAY[w])),
  );
  const [alarms, setAlarms] = useState(() =>
    initial.timeSlots.length > 0
      ? initial.timeSlots.map((s, i) => ({ id: `s${i}`, label: s.label, time: time24ToUi(s.time) }))
      : DEFAULT_ALARMS,
  );
  const nextId = useRef((initial.timeSlots.length || DEFAULT_ALARMS.length) + 1);
  const [sheetFor, setSheetFor] = useState<number | null>(null);

  // 변경 시 디바운스 저장(전체 교체 PUT). 첫 렌더(=서버값 그대로)는 건너뛴다.
  // label 빈 알람(작성 중)은 제외하고, 요일·시간대 정렬은 서버가 담당.
  const saveSettings = useSaveNotificationSettings();
  const saveMutate = saveSettings.mutate;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      const timeSlots = alarms
        .filter((a) => a.label.trim().length > 0)
        .map((a) => ({ label: a.label.trim(), time: uiTimeTo24(a.time) }));
      const weekdays = [...days].sort((x, y) => x - y).map((i) => WEEKDAY_BY_INDEX[i]);
      saveMutate({ enabled: notifOn, weekdays, timeSlots });
    }, 600);
    return () => clearTimeout(t);
  }, [notifOn, days, alarms, saveMutate]);

  // '편집 완료' = 명시적 커밋. 디바운스 저장은 라벨 없는 알람을 제외하므로, 추가만 하고 이름을
  // 안 지으면 반영되지 않았다. 여기서 빈 라벨엔 기본 이름을 채워(삭제 대신 유지) 즉시 저장한다.
  const commit = () => {
    const normalized = alarms.map((a) => (a.label.trim().length > 0 ? a : { ...a, label: '알람' }));
    // 빈 라벨이 있었을 때만 로컬 상태 갱신(불필요한 재렌더 방지). 미변경 항목은 같은 참조 유지.
    if (normalized.some((a, i) => a !== alarms[i])) setAlarms(normalized);
    const timeSlots = normalized.map((a) => ({ label: a.label.trim(), time: uiTimeTo24(a.time) }));
    const weekdays = [...days].sort((x, y) => x - y).map((i) => WEEKDAY_BY_INDEX[i]);
    saveMutate({ enabled: notifOn, weekdays, timeSlots });
  };

  const onToggleEdit = () => {
    if (editing) commit(); // 편집 → 편집 완료: 즉시 저장
    setEditing((e) => !e);
  };

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
            <View className="flex-row items-center gap-2">
              <AppText variant="body">시간 설정</AppText>
              {saveSettings.isPending ? (
                <Text className="text-[13px] leading-[17px] text-muted">저장 중…</Text>
              ) : saveSettings.isError ? (
                <Text className="text-[13px] leading-[17px] text-error">저장 실패</Text>
              ) : null}
            </View>
            <Pressable accessibilityRole="button" onPress={onToggleEdit} hitSlop={8}>
              <Text className="text-[16px] font-medium text-muted">
                {editing ? '편집 완료' : '편집'}
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
                  // rounded-full(9999px)은 Android에서 border와 함께 그릴 때 각지게 렌더 →
                  // 요소 절반값(21px=42/2)으로 명시해 양 플랫폼 모두 완전한 원.
                  className={`h-[42px] w-[42px] items-center justify-center rounded-[21px] ${
                    on ? 'border border-primary bg-surface' : 'border border-transparent'
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
          onConfirm={(times, title) => {
            setAlarms((prev) =>
              prev.map((a, i) => ({
                ...a,
                time: times[i],
                label: i === sheetFor ? title : a.label,
              })),
            );
            setSheetFor(null);
          }}
        />
      ) : null}
    </>
  );
}
