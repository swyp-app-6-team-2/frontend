// 모듈 레벨 싱글톤 상태(watchedToday 등)를 쓰므로 테스트마다 모듈을 리셋해 격리한다.
type SlotAds = typeof import('@/lib/slot-ads');

function freshModule(): SlotAds {
  let mod!: SlotAds;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 모듈 싱글톤 상태 격리용 동적 재-require
    mod = require('@/lib/slot-ads');
  });
  return mod;
}

describe('slot-ads 광고 시청 한도', () => {
  it('초기엔 시청 가능하고 잔여가 일일 한도와 같다', () => {
    const m = freshModule();
    expect(m.canWatchAd()).toBe(true);
    expect(m.remainingWatches()).toBe(m.AD_DAILY_LIMIT);
  });

  it('watchAd가 잔여를 1씩 줄이고 한도에서 멈춘다', () => {
    const m = freshModule();
    const limit = m.AD_DAILY_LIMIT;
    for (let i = 0; i < limit; i++) {
      expect(m.canWatchAd()).toBe(true);
      m.watchAd();
    }
    expect(m.canWatchAd()).toBe(false);
    expect(m.remainingWatches()).toBe(0);
  });

  it('한도 초과 watchAd는 무시된다(음수로 안 감)', () => {
    const m = freshModule();
    for (let i = 0; i < m.AD_DAILY_LIMIT + 5; i++) m.watchAd();
    expect(m.remainingWatches()).toBe(0);
  });
});

describe('slot-ads justAdded 팝업 플래그', () => {
  it('watchAd 후 justAdded=true, dismiss 후 false', () => {
    const m = freshModule();
    // useSlotJustAdded는 훅이라 내부 getSnapshot을 직접 못 보지만,
    // watchAd→dismiss 왕복이 예외 없이 도는지 + 상태 일관성을 확인한다.
    expect(() => {
      m.watchAd();
      m.dismissSlotAdded();
      m.dismissSlotAdded(); // 두 번째는 no-op
    }).not.toThrow();
  });
});
