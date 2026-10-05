import type { MeResponse } from '../api/types';
import { GUEST_SLOT_LIMIT, guestRemainingSlots, remainingSlots } from '../slots';

describe('remainingSlots (회원)', () => {
  const me = { recipeSlotLimit: 10 } as MeResponse;

  it('한도 − 등록 수 (음수는 0으로 clamp)', () => {
    expect(remainingSlots(me, 0)).toBe(10);
    expect(remainingSlots(me, 7)).toBe(3);
    expect(remainingSlots(me, 10)).toBe(0);
    expect(remainingSlots(me, 12)).toBe(0); // clamp
  });

  it('프로필 로딩 전(undefined)이면 0', () => {
    expect(remainingSlots(undefined, 3)).toBe(0);
  });
});

describe('guestRemainingSlots (게스트)', () => {
  it('게스트 한도는 5', () => {
    expect(GUEST_SLOT_LIMIT).toBe(5);
  });

  it('5 − 로컬 레시피 수, 음수는 0으로 clamp', () => {
    expect(guestRemainingSlots(0)).toBe(5);
    expect(guestRemainingSlots(4)).toBe(1);
    expect(guestRemainingSlots(5)).toBe(0); // 도달 → 로그인 유도 경계
    expect(guestRemainingSlots(6)).toBe(0); // clamp
  });
});
