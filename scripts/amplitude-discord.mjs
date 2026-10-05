#!/usr/bin/env node
// 별따먹자 — Amplitude → Discord 지표 알림 (A: 알림 / B: 일일 리포트 / C: 이벤트 집계)
//
// 환경변수 (필수):
//   AMPLITUDE_API_KEY      전송·조회 공용 API 키
//   AMPLITUDE_SECRET_KEY   Amplitude → 설정 → Projects → Secret Key (조회에 필수)
//   DISCORD_WEBHOOK_URL    디스코드 채널 웹훅 URL
//
// 실행:
//   node amplitude-discord.mjs daily    # B: 어제 하루 요약 리포트 (매일 1회 cron)
//   node amplitude-discord.mjs alert    # A: DAU 급락 / 가입 급증 감지 (1~3시간마다 cron)
//
// cron 예 (매일 오전 9시 리포트 + 매시간 알림):
//   0 9 * * *  cd /path && node amplitude-discord.mjs daily
//   0 * * * *  cd /path && node amplitude-discord.mjs alert

const API = process.env.AMPLITUDE_API_KEY;
const SECRET = process.env.AMPLITUDE_SECRET_KEY;
const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
// US 프로젝트 기준(api2.amplitude.com로 수집 중). EU면 analytics.eu.amplitude.com 로 교체.
const BASE = 'https://amplitude.com/api/2';

// 리포트에 담을 핵심 이벤트(= 앱에 심은 것들)
const EVENTS = [
  { key: 'Login', label: '🔑 로그인' },
  { key: 'Guest Entered', label: '👋 게스트 진입' },
  { key: 'Signup Completed', label: '📝 가입 완료' },
  { key: 'Recipe Created', label: '📖 레시피 생성' },
  { key: 'Cook Completed', label: '🍳 요리 완료' },
  { key: 'Ad Reward Granted', label: '🎬 광고 보상' },
];
// A(알림) 임계값
const DAU_DROP_ALERT = 0.4; // 전일 대비 40% 이상 급락 시 알림
const SIGNUP_SPIKE = 30; // 하루 가입 30건 이상이면 "급증" 알림

if (!API || !SECRET || !WEBHOOK) {
  console.error('환경변수 AMPLITUDE_API_KEY / AMPLITUDE_SECRET_KEY / DISCORD_WEBHOOK_URL 필요');
  process.exit(1);
}

const auth = 'Basic ' + Buffer.from(`${API}:${SECRET}`).toString('base64');
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
const dayLabel = (d) => d.toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Amplitude 조회 API는 동시·연속 요청에 쓰로틀(429/400)이 걸린다 → 재시도 + 백오프.
async function amp(path, params, tries = 4) {
  const qs = new URLSearchParams(params).toString();
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${BASE}${path}?${qs}`, { headers: { Authorization: auth } });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status === 400 || res.status >= 500) && i < tries - 1) {
      await sleep(2500 * (i + 1)); // 쓰로틀 — 점점 길게 기다렸다 재시도
      continue;
    }
    throw new Error(`Amplitude ${path} → HTTP ${res.status}: ${await res.text()}`);
  }
}

// 이벤트 하루 총합(totals). 데이터 없으면 0.
async function eventTotal(eventType, start, end) {
  const j = await amp('/events/segmentation', {
    e: JSON.stringify({ event_type: eventType }),
    start,
    end,
    m: 'totals',
    i: 1,
  });
  const series = j?.data?.series?.[0] ?? [];
  return series.reduce((a, b) => a + (b || 0), 0);
}

// 활성 사용자(DAU) — 해당 날짜 배열의 마지막 값.
async function activeUsers(start, end) {
  const j = await amp('/users', { start, end, m: 'active', i: 1 });
  const series = j?.data?.series?.[0] ?? [];
  return series.length ? series[series.length - 1] : 0;
}

async function postDiscord(embed) {
  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'byeol-metrics-bot/1.0' },
    body: JSON.stringify({ username: '별따먹자 지표봇', embeds: [embed] }),
  });
  if (res.status !== 204 && !res.ok) throw new Error(`Discord HTTP ${res.status}: ${await res.text()}`);
}

// ── B: 일일 리포트 ───────────────────────────────────────────────
async function daily() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1); // 어제
  const s = ymd(d);
  const dau = await activeUsers(s, s);
  await sleep(1500);
  const counts = {};
  for (const e of EVENTS) {
    counts[e.key] = await eventTotal(e.key, s, s);
    await sleep(1500); // 쓰로틀 방지 — 쿼리 간 간격
  }
  await postDiscord({
    title: '📊 별따먹자 — 일일 지표 리포트',
    description: `${dayLabel(d)} (UTC)`,
    color: 0xffd457,
    fields: [
      { name: '⭐ 활성 사용자(DAU)', value: `${dau}명`, inline: true },
      ...EVENTS.map((e) => ({ name: e.label, value: `${counts[e.key]}`, inline: true })),
    ],
    footer: { text: 'Amplitude · 별따먹자' },
  });
  console.log('일일 리포트 전송 완료');
}

// ── A: 지표 알림 (DAU 급락 / 가입 급증) ──────────────────────────
async function alert() {
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  const [dT, dY, signupT] = await Promise.all([
    activeUsers(ymd(today), ymd(today)),
    activeUsers(ymd(yest), ymd(yest)),
    eventTotal('Signup Completed', ymd(today), ymd(today)),
  ]);
  const alerts = [];
  if (dY > 0 && dT < dY * (1 - DAU_DROP_ALERT)) {
    alerts.push({
      name: '🚨 DAU 급락',
      value: `오늘 ${dT}명 (어제 ${dY}명, ${Math.round((1 - dT / dY) * 100)}% ↓)`,
      inline: false,
    });
  }
  if (signupT >= SIGNUP_SPIKE) {
    alerts.push({ name: '🎉 가입 급증', value: `오늘 가입 ${signupT}건`, inline: false });
  }
  if (!alerts.length) {
    console.log('알림 조건 없음 (정상)');
    return;
  }
  await postDiscord({
    title: '⚠️ 별따먹자 — 지표 알림',
    color: 0xff6b6b,
    fields: alerts,
    footer: { text: 'Amplitude 모니터 · 별따먹자' },
  });
  console.log('알림 전송 완료');
}

const mode = process.argv[2];
(mode === 'alert' ? alert() : daily()).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
