#!/usr/bin/env node
// Sentry 새 에러 → Discord 상세 알림.
// Sentry 무료 플랜은 Discord 통합(유료 Team)을 못 쓰므로, API로 "새로 생긴 이슈"를 읽어
// Discord 웹훅으로 직접 쏜다. GitHub Actions 스케줄에서 호출(= Amplitude→Discord와 동일 구조).
//
// 각 이슈의 "최신 이벤트"를 한 번 더 조회해 스택트레이스·태그에서
// 화면/파일:줄/함수/기기/OS/앱버전까지 뽑아 담는다.
//
// 필요한 환경변수:
//   SENTRY_AUTH_TOKEN   User Auth Token (스코프 org:read, project:read, event:read)
//   SENTRY_ORG          조직 슬러그 (URL sentry.io/organizations/<여기>/)
//   SENTRY_PROJECT_ID   프로젝트 숫자 ID (DSN 끝 숫자). 기본값은 별따먹자 프로젝트.
//   DISCORD_WEBHOOK_URL 에러 알림 받을 Discord 웹훅
//   SENTRY_BASE_URL     (선택) 리전 호스트. org 토큰은 us/eu 필요. 기본 https://sentry.io
//   SENTRY_STATE_FILE   (선택) 이미 보낸 이슈 ID 저장 파일 — 중복 방지(Actions 캐시로 영속)
//   LOOKBACK_MIN        (선택) 새 이슈 판정 창(분). 기본 20 (cron 15분 + 버퍼)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.SENTRY_AUTH_TOKEN;
const ORG = process.env.SENTRY_ORG;
// org 토큰(sntrys_)은 리전 호스트를 써야 함(us/eu). 기본은 공용 라우터(sentry.io).
const BASE_URL = (process.env.SENTRY_BASE_URL || 'https://sentry.io').replace(/\/$/, '');
const PROJECT_ID = process.env.SENTRY_PROJECT_ID || '4512207470919680';
const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const STATE_FILE = process.env.SENTRY_STATE_FILE;
const LOOKBACK_MIN = Number(process.env.LOOKBACK_MIN || '20');

if (!TOKEN || !ORG || !WEBHOOK) {
  console.error('환경변수 누락(SENTRY_AUTH_TOKEN/SENTRY_ORG/DISCORD_WEBHOOK_URL) — 생략');
  process.exit(0);
}

// 레벨 → Discord embed 색상(좌측 바).
const LEVEL_COLOR = {
  fatal: 0x8b0000,
  error: 0xe03131,
  warning: 0xf59f00,
  info: 0x4dabf7,
  debug: 0x868e96,
};

// ── Sentry API 공통 GET ──────────────────────────────────────────────
async function api(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Sentry API ${res.status} (${path}): ${await res.text()}`);
  return res.json();
}

// ── 이미 보낸 이슈 ID 로드/저장(중복 알림 방지) ─────────────────────────
function loadSeen() {
  if (!STATE_FILE || !existsSync(STATE_FILE)) return new Set();
  try {
    return new Set(JSON.parse(readFileSync(STATE_FILE, 'utf8')));
  } catch {
    return new Set();
  }
}
function saveSeen(seen) {
  if (!STATE_FILE) return;
  writeFileSync(STATE_FILE, JSON.stringify([...seen].slice(-500)));
}

// ── Discord 전송 — urllib는 UA 없으면 403. curl + UA로 우회(검증된 패턴) ──
function postDiscord(payload) {
  execFileSync(
    'curl',
    [
      '-sS',
      '-X',
      'POST',
      '-H',
      'Content-Type: application/json',
      '-H',
      'User-Agent: byeol-sentry-bot/1.0',
      '-d',
      JSON.stringify(payload),
      WEBHOOK,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
}

// ── 이벤트에서 상세 추출 헬퍼 ─────────────────────────────────────────
const tagOf = (ev, key) => (ev?.tags || []).find((t) => t.key === key)?.value;

// 예외 엔트리에서 "인앱 최상위 프레임"(우리 코드)을 찾아 파일:줄·함수 반환.
function topFrame(ev) {
  const exc = (ev?.entries || []).find((e) => e.type === 'exception');
  const values = exc?.data?.values || [];
  const frames = values[values.length - 1]?.stacktrace?.frames || [];
  // in_app 프레임 우선, 없으면 마지막 프레임. 스택은 호출순이라 뒤에서부터 찾는다.
  const f = [...frames].reverse().find((fr) => fr.inApp) || frames[frames.length - 1];
  if (!f) return null;
  const file = (f.filename || f.absPath || '').split('/').pop();
  return { file, func: f.function, line: f.lineNo };
}

// 상대 시간("3분 전").
function ago(iso) {
  if (!iso) return '—';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}초 전`;
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}

function field(name, value, inline = true) {
  return { name, value: String(value ?? '—').slice(0, 1024) || '—', inline };
}

// ── 이슈 1건 → 상세 임베드 ───────────────────────────────────────────
async function buildEmbed(issue) {
  // 최신 이벤트 조회(태그·스택트레이스). 실패해도 기본 정보로 폴백.
  let ev = null;
  try {
    ev = await api(
      `/api/0/organizations/${encodeURIComponent(ORG)}/issues/${issue.id}/events/latest/`,
    );
  } catch (e) {
    console.error(`최신 이벤트 조회 실패(${issue.shortId}): ${e.message}`);
  }

  const meta = issue.metadata || {};
  const type = meta.type || '';
  const value = meta.value || issue.title || '(제목 없음)';
  const title = (type ? `${type}: ${value}` : value).slice(0, 240);

  // 화면: 커스텀 screen 태그 → transaction 태그 → issue.culprit 순.
  const screen = tagOf(ev, 'screen') || tagOf(ev, 'transaction') || issue.culprit || '—';
  const frame = topFrame(ev);
  const location = frame
    ? `${frame.func || '?'} (${frame.file || '?'}${frame.line ? ':' + frame.line : ''})`
    : issue.culprit || '—';

  const os = tagOf(ev, 'os') || tagOf(ev, 'os.name');
  const device = tagOf(ev, 'device') || tagOf(ev, 'device.family');
  const deviceOs = [device, os].filter(Boolean).join(' · ') || '—';
  const release = String(tagOf(ev, 'release') || tagOf(ev, 'app.version') || '—').replace(
    /^.*@/,
    '',
  );
  const env = tagOf(ev, 'environment') || 'production';

  // 세션 리플레이 — 에러 직전 화면 녹화. 대시보드 URL은 permalink 호스트에서 유도.
  const replayId = ev?.contexts?.replay?.replay_id || tagOf(ev, 'replayId');
  let replayUrl = null;
  try {
    if (replayId) {
      const origin = new URL(issue.permalink).origin;
      replayUrl = `${origin}/replays/${replayId}/?project=${PROJECT_ID}`;
    }
  } catch {
    /* permalink 파싱 실패 시 리플레이 링크 생략 */
  }

  // AI 수정 명령 — Sentry 정보로 미리 채운 프롬프트. Discord 코드블록은 탭 한 번에 복사됨.
  const fixPrompt =
    '```\n별따먹자 운영 에러 고쳐줘.\n' +
    `화면: ${screen}\n` +
    `위치: ${location}\n` +
    `에러: ${title}\n` +
    `Sentry: ${issue.permalink}\n` +
    '그 파일의 해당 줄을 열어 원인을 찾고, 널 가드/옵셔널 체이닝으로 재발 방지까지 해줘. ' +
    '끝나면 pnpm typecheck && pnpm lint:fix 돌려줘.\n```';

  const fields = [
    field('📍 화면', `\`${screen}\``),
    field('🧩 위치', `\`${location}\``),
    field('레벨', issue.level || 'error'),
    field('환경', env),
    field('앱 버전', release),
    field('기기 / OS', deviceOs),
    field('발생 횟수', issue.count ?? '—'),
    field('영향 사용자', issue.userCount ?? 0),
    field('최근 발생', ago(issue.lastSeen)),
  ];
  if (replayUrl)
    fields.push(field('🎬 세션 리플레이', `[에러 직전 화면 보기](${replayUrl})`, false));

  return {
    title: `🐛 ${title}`,
    url: issue.permalink,
    color: LEVEL_COLOR[issue.level] ?? LEVEL_COLOR.error,
    description: `🤖 **Claude Code에 붙여넣기 → 바로 수정**\n${fixPrompt}`,
    fields,
    footer: { text: `${issue.shortId || ''} · 별따먹자` },
  };
}

// ── 메인 ─────────────────────────────────────────────────────────────
async function main() {
  // 새 이슈만: age 필터로 firstSeen이 최근 LOOKBACK_MIN 안인 미해결 이슈.
  const issues = await api(
    `/api/0/organizations/${encodeURIComponent(ORG)}/issues/` +
      `?project=${encodeURIComponent(PROJECT_ID)}` +
      `&query=${encodeURIComponent(`is:unresolved age:-${LOOKBACK_MIN}m`)}` +
      `&sort=new&statsPeriod=24h&limit=25`,
  );
  console.log(`새 이슈 후보: ${issues.length}건 (최근 ${LOOKBACK_MIN}분)`);

  const seen = loadSeen();
  const fresh = issues.filter((i) => !seen.has(i.id));
  if (fresh.length === 0) {
    console.log('보낼 새 이슈 없음.');
    return;
  }

  // 오래된 것부터(시간순) 전송.
  for (const i of fresh.reverse()) {
    const embed = await buildEmbed(i);
    postDiscord({ username: '별따먹자 Sentry', embeds: [embed] });
    seen.add(i.id);
    console.log(`전송: ${i.shortId} ${embed.title}`);
  }

  saveSeen(seen);
  console.log(`완료 — ${fresh.length}건 전송.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
