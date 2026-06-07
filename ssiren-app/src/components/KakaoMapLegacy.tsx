import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

declare global {
  interface Window {
    kakao: any;
  }
}

const CENTER = { lat: 37.5665, lng: 126.978 };
const MAP_CONTAINER_ID = 'kakao-map';

function initializeKakaoMap() {
  if (Platform.OS !== 'web') {
    return;
  }

  const container = document.getElementById(MAP_CONTAINER_ID);
  if (!container || !window.kakao?.maps) {
    return;
  }

  const options = {
    center: new window.kakao.maps.LatLng(CENTER.lat, CENTER.lng),
    level: 3,
  };

  const map = new window.kakao.maps.Map(container, options);
  new window.kakao.maps.Marker({
    position: new window.kakao.maps.LatLng(CENTER.lat, CENTER.lng),
    map,
  });
}

/**
 * Legacy Kakao map implementation.
 * Kept for reference while switching to react-native-maps.
 */
export default function KakaoMapLegacy() {
  const [useKakaoWebFallback, setUseKakaoWebFallback] = useState(false);
  const jsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isWeb = Platform.OS === 'web';
  const kakaoWebMapUrl = `https://map.kakao.com/link/map/서울시청,${CENTER.lat},${CENTER.lng}`;
  const nativeMapHtml = useMemo(() => {
    if (!jsKey) {
      return `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;">
            <p style="font-family:sans-serif;color:#444;">EXPO_PUBLIC_GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.</p>
          </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
          <style>
            html, body, #map {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }
          </style>
          <script>
            function sendToReactNative(message) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(message);
              }
            }
          </script>
        </head>
        <body>
          <div id="map"></div>
          <script>
            (function () {
              try {
                sendToReactNative('WEBVIEW_BOOTSTRAP');

                window.addEventListener('error', function (event) {
                  sendToReactNative('JS_RUNTIME_ERROR:' + (event && event.message ? event.message : 'unknown'));
                });

                var script = document.createElement('script');
                script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&autoload=false';
                script.onload = function () {
                  sendToReactNative('KAKAO_SDK_LOADED');
                  if (!window.kakao || !window.kakao.maps) {
                    sendToReactNative('KAKAO_SDK_NOT_READY');
                    return;
                  }

                  window.kakao.maps.load(function () {
                    try {
                      var mapContainer = document.getElementById('map');
                      var center = new window.kakao.maps.LatLng(${CENTER.lat}, ${CENTER.lng});
                      var map = new window.kakao.maps.Map(mapContainer, {
                        center: center,
                        level: 3
                      });
                      var marker = new window.kakao.maps.Marker({
                        position: center
                      });
                      marker.setMap(map);
                      sendToReactNative('KAKAO_MAP_READY');
                    } catch (error) {
                      sendToReactNative('KAKAO_MAP_ERROR:' + (error && error.message ? error.message : 'unknown'));
                    }
                  });
                };
                script.onerror = function () {
                  sendToReactNative('KAKAO_SDK_LOAD_ERROR');
                };

                document.head.appendChild(script);
              } catch (error) {
                sendToReactNative('KAKAO_MAP_ERROR:' + (error && error.message ? error.message : 'unknown'));
              }
            })();
          </script>
        </body>
      </html>
    `;
  }, [jsKey]);

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    if (!jsKey) {
      console.error('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set.');
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kakao-map-sdk="true"]'
    );

    if (window.kakao?.maps) {
      initializeKakaoMap();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener('load', initializeKakaoMap);
      return () => {
        existingScript.removeEventListener('load', initializeKakaoMap);
      };
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&autoload=false`;
    script.async = true;
    script.dataset.kakaoMapSdk = 'true';
    script.onload = () => {
      window.kakao.maps.load(initializeKakaoMap);
    };
    document.head.appendChild(script);
  }, [isWeb, jsKey]);

  if (!isWeb) {
    return (
      <View style={styles.container}>
        <WebView
          originWhitelist={['*']}
          source={
            useKakaoWebFallback
              ? { uri: kakaoWebMapUrl }
              : { html: nativeMapHtml }
          }
          style={styles.mapContainer}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          onMessage={(event) => {
            const message = event.nativeEvent.data;
            if (message === 'KAKAO_SDK_LOAD_ERROR') {
              setUseKakaoWebFallback(true);
            }
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View nativeID={MAP_CONTAINER_ID} style={styles.mapContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
});
