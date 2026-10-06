// Sentry 소스맵·컴포넌트 주석 지원을 위해 getDefaultConfig 대신 getSentryExpoConfig 사용
// (반환값은 동일한 Expo metro config → NativeWind로 그대로 감싼다).
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

const config = getSentryExpoConfig(__dirname);

module.exports = withNativeWind(config, { input: './src/global.css' });
