// 동적 설정 — 베이스는 app.json. GoogleService-Info.plist는 레포에 커밋하지 않으므로
// (API 키 포함, .gitignore) EAS Build에선 file 환경변수 GOOGLE_SERVICES_INFO_PLIST로 주입한다.
// EAS Build는 그 file env var를 빌더 파일로 쓰고 경로를 process.env에 넣어주므로, 그때만 덮어쓴다.
// 로컬(env 미설정)은 app.json의 './GoogleService-Info.plist'(실제 파일)를 그대로 쓴다.
module.exports = ({ config }) => {
  const plist = process.env.GOOGLE_SERVICES_INFO_PLIST;
  if (plist) {
    config.ios = { ...config.ios, googleServicesFile: plist };
  }
  return config;
};
