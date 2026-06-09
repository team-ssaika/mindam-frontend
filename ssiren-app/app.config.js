const appJson = require('./app.json');
const fs = require('fs');
const path = require('path');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return env;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      return {
        ...env,
        [key]: value,
      };
    }, {});
}

const localEnv = loadLocalEnv();
const kakaoNativeAppKey =
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ??
  localEnv.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ??
  '';
const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  localEnv.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  '';

module.exports = {
  ...appJson.expo,
  ios: {
    ...appJson.expo.ios,
    bundleIdentifier: 'com.ssaika.ssiren',
    config: {
      ...appJson.expo.ios.config,
      googleMapsApiKey,
    },
  },
  android: {
    ...appJson.expo.android,
    package: 'com.ssaika.ssiren',
    googleServicesFile: './google-services.json',
    config: {
      ...appJson.expo.android.config,
      googleMaps: { apiKey: googleMapsApiKey },
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: [
            'https://devrepo.kakao.com/nexus/content/groups/public/',
          ],
        },
      },
    ],
    [
      '@react-native-kakao/core',
      {
        nativeAppKey: kakaoNativeAppKey,
        android: {
          authCodeHandlerActivity: true,
        },
        ios: {
          handleKakaoOpenUrl: true,
        },
      },
    ],
  ],
};
