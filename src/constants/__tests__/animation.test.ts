import { STAGGER_MAX_STEPS, STAGGER_STEP, staggerDelay } from '@/constants/animation';

describe('staggerDelay', () => {
  it('index에 비례해 step만큼 증가한다', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(1)).toBe(STAGGER_STEP);
    expect(staggerDelay(3)).toBe(3 * STAGGER_STEP);
  });

  it('maxSteps에서 캡되어 무한정 늘어지지 않는다', () => {
    const capped = STAGGER_MAX_STEPS * STAGGER_STEP;
    expect(staggerDelay(STAGGER_MAX_STEPS)).toBe(capped);
    expect(staggerDelay(STAGGER_MAX_STEPS + 1)).toBe(capped);
    expect(staggerDelay(999)).toBe(capped);
  });

  it('커스텀 step/maxSteps를 존중한다', () => {
    expect(staggerDelay(10, 30, 4)).toBe(4 * 30);
    expect(staggerDelay(2, 30, 4)).toBe(2 * 30);
  });
});
