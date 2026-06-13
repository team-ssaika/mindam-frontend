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
const googleServicesFile = path.join(__dirname, 'google-services.json');
const hasGoogleServicesFile = fs.existsSync(googleServicesFile);

module.exports = {
  ...appJson.expo,
  ios: {
    ...appJson.expo.ios,
    bundleIdentifier: 'com.ssaika.ssiren',
    infoPlist: {
      ...appJson.expo.ios.infoPlist,
      NSLocationWhenInUseUsageDescription:
        '현재 위치 주변의 이슈를 지도에서 확인하기 위해 위치 권한이 필요합니다.',
    },
  },
  android: {
    ...appJson.expo.android,
    package: 'com.ssaika.ssiren',
    ...(hasGoogleServicesFile ? { googleServicesFile: './google-services.json' } : {}),
    permissions: [
      ...new Set([
        ...(appJson.expo.android.permissions ?? []),
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'POST_NOTIFICATIONS',
      ]),
    ],
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
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
    [
      'expo-image-picker',
      {
        cameraPermission: '민원 현장을 사진으로 촬영해 첨부하기 위해 카메라 권한이 필요합니다.',
        photosPermission: '민원에 첨부할 사진을 선택하기 위해 사진 접근 권한이 필요합니다.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './src/assets/icon.png',
        color: '#7EC8F7',
      },
    ],
  ],
};
