import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

export type KakaoMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type KakaoMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  kind: 'report' | 'officer' | 'search';
  iconUri?: string;
  label?: string;
  reportCount?: number;
};

export type KakaoMapPolygon = {
  id: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  fillColor: string;
  strokeColor: string;
};

export type KakaoMapCircle = {
  id: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  fillColor: string;
  strokeColor: string;
};

export type KakaoPlaceSearchResult = {
  id: string;
  placeName: string;
  addressName: string;
  roadAddressName: string;
  latitude: number;
  longitude: number;
};

export type KakaoPlaceSearchOptions = {
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
};

export type KakaoMapViewHandle = {
  animateToRegion: (region: KakaoMapRegion, duration?: number) => void;
  searchPlaces: (
    keyword: string,
    options?: KakaoPlaceSearchOptions
  ) => Promise<KakaoPlaceSearchResult[]>;
};

type KakaoMapViewProps = {
  initialRegion: KakaoMapRegion;
  markers?: KakaoMapMarker[];
  polygons?: KakaoMapPolygon[];
  circles?: KakaoMapCircle[];
  region: KakaoMapRegion;
  searchMarker?: KakaoMapMarker | null;
  showsUserLocation?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
  onMapDragStart?: () => void;
  onMapPress?: () => void;
  onMarkerPress?: (markerId: string) => void;
  onRegionChangeComplete?: (region: KakaoMapRegion) => void;
  style?: object;
};

type PendingSearch = {
  reject: (reason?: unknown) => void;
  resolve: (results: KakaoPlaceSearchResult[]) => void;
};

const KAKAO_SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';

function getKakaoMapJsKey() {
  return (
    process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY?.trim() ||
    process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ||
    ''
  );
}

function regionToLevel(region: KakaoMapRegion) {
  const delta = Math.max(region.latitudeDelta, region.longitudeDelta);
  if (delta <= 0.004) return 3;
  if (delta <= 0.008) return 4;
  if (delta <= 0.016) return 5;
  if (delta <= 0.032) return 6;
  if (delta <= 0.064) return 7;
  if (delta <= 0.12) return 8;
  return 9;
}

function serializeForInjection(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export const KakaoMapView = forwardRef<KakaoMapViewHandle, KakaoMapViewProps>(
  (
    {
      initialRegion,
      markers = [],
      onMapDragStart,
      onMapPress,
      onMarkerPress,
      onRegionChangeComplete,
      circles = [],
      polygons = [],
      region,
      searchMarker,
      showsUserLocation = false,
      style,
      userLocation,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView | null>(null);
    const pendingSearches = useRef<Record<string, PendingSearch>>({});
    const jsKey = getKakaoMapJsKey();

    const html = useMemo(() => buildKakaoMapHtml(jsKey, initialRegion), [initialRegion, jsKey]);

    const injectState = useCallback(
      (nextRegion: KakaoMapRegion, duration = 0, moveCamera = true) => {
        const allMarkers = searchMarker ? [...markers, searchMarker] : markers;
        const state = {
          circles,
          duration,
          markers: allMarkers,
          moveCamera,
          polygons,
          region: nextRegion,
          showsUserLocation,
          userLocation,
        };
        webViewRef.current?.injectJavaScript(
          `window.SSIREN_SET_STATE && window.SSIREN_SET_STATE(${serializeForInjection(state)}); true;`
        );
      },
      [circles, markers, polygons, searchMarker, showsUserLocation, userLocation]
    );

    useImperativeHandle(
      ref,
      () => ({
        animateToRegion(nextRegion, duration = 600) {
          injectState(nextRegion, duration, true);
        },
        searchPlaces(keyword, options = {}) {
          const trimmed = keyword.trim();
          if (!trimmed) {
            return Promise.resolve([]);
          }

          const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const payload = { keyword: trimmed, options, requestId };

          return new Promise<KakaoPlaceSearchResult[]>((resolve, reject) => {
            pendingSearches.current[requestId] = { resolve, reject };
            webViewRef.current?.injectJavaScript(
              `window.SSIREN_SEARCH_PLACES && window.SSIREN_SEARCH_PLACES(${serializeForInjection(payload)}); true;`
            );
          });
        },
      }),
      [injectState]
    );

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);

        if (payload.type === 'READY') {
          injectState(region, 0, true);
          return;
        }

        if (payload.type === 'REGION_CHANGE_COMPLETE') {
          onRegionChangeComplete?.(payload.region);
          return;
        }

        if (payload.type === 'MAP_DRAG_START') {
          onMapDragStart?.();
          return;
        }

        if (payload.type === 'MAP_PRESS') {
          onMapPress?.();
          return;
        }

        if (payload.type === 'MARKER_PRESS') {
          onMarkerPress?.(payload.markerId);
          return;
        }

        if (payload.type === 'SEARCH_RESULTS') {
          const pending = pendingSearches.current[payload.requestId];
          if (pending) {
            delete pendingSearches.current[payload.requestId];
            pending.resolve(payload.results ?? []);
          }
          return;
        }

        if (payload.type === 'SEARCH_ERROR') {
          const pending = pendingSearches.current[payload.requestId];
          if (pending) {
            delete pendingSearches.current[payload.requestId];
            pending.reject(new Error(payload.message ?? 'kakao_place_search_failed'));
          }
        }
      } catch (error) {
        console.log('[KakaoMap] message parse failed', error);
      }
    };

    useEffect(() => {
      injectState(region, 0, false);
    }, [injectState, region]);

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={(nextRef) => {
            webViewRef.current = nextRef;
          }}
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          androidLayerType="hardware"
          setSupportMultipleWindows={false}
          onMessage={handleMessage}
        />
      </View>
    );
  }
);

function buildKakaoMapHtml(jsKey: string, initialRegion: KakaoMapRegion) {
  if (!jsKey) {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#333;">
          <div style="padding:24px;text-align:center;">
            EXPO_PUBLIC_KAKAO_MAP_JS_KEY가 설정되지 않았습니다.
          </div>
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
          html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
          button { appearance: none; border: 0; margin: 0; padding: 0; background: transparent; }
          .marker-report-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
            transform: translateY(-10px);
          }
          .marker-report {
            position: relative;
            min-width: 104px;
            height: 84px;
            padding: 0;
            display: inline-block;
            overflow: visible;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,.14));
          }
          .marker-report-body {
            position: relative;
            z-index: 2;
            min-width: 104px;
            height: 58px;
            padding: 0 18px 0 16px;
            border-radius: 999px;
            background: #9BDCF4;
            border: 4px solid #fff;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #050505;
            font: 500 21px system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            letter-spacing: -0.5px;
            white-space: nowrap;
          }
          .marker-report-tail-outer {
            position: absolute;
            left: 50%;
            bottom: 0;
            width: 0;
            height: 0;
            border-left: 26px solid transparent;
            border-right: 26px solid transparent;
            border-top: 30px solid #fff;
            transform: translateX(-50%);
            z-index: 1;
          }
          .marker-report-tail-inner {
            position: absolute;
            left: 50%;
            bottom: 5px;
            width: 0;
            height: 0;
            border-left: 21px solid transparent;
            border-right: 21px solid transparent;
            border-top: 25px solid #9BDCF4;
            transform: translateX(-50%);
            z-index: 3;
          }
          .marker-report.marker-one,
          .marker-report.marker-one .marker-report-body {
            min-width: 88px;
          }
          .marker-report.marker-one .marker-report-body {
            padding: 0 15px 0 14px;
            gap: 6px;
            font-size: 18px;
          }
          .marker-report.marker-large,
          .marker-report.marker-large .marker-report-body {
            min-width: 122px;
          }
          .marker-report.marker-large .marker-report-body {
            padding: 0 20px 0 18px;
            font-size: 23px;
          }
          .marker-report-icon {
            width: 33px;
            height: 33px;
            object-fit: contain;
            flex: 0 0 auto;
          }
          .marker-report.marker-one .marker-report-icon {
            width: 28px;
            height: 28px;
          }
          .marker-report.marker-large .marker-report-icon {
            width: 36px;
            height: 36px;
          }
          .marker-officer {
            min-width: 32px; min-height: 32px; padding: 0 8px; border-radius: 999px;
            background: #7EC8F7; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.28);
            color: #fff; font: 700 13px system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex; align-items: center; justify-content: center;
          }
          .marker-search {
            transform: translateY(-8px); color: #7EC8F7;
            filter: drop-shadow(0 2px 5px rgba(0,0,0,.25));
            font-size: 34px; line-height: 34px;
          }
          .marker-user {
            width: 18px; height: 18px; border-radius: 999px; background: #E23E33;
            border: 3px solid #fff; box-shadow: 0 0 0 9px rgba(80,87,98,.14), 0 3px 8px rgba(0,0,0,.24);
            position: relative;
          }
          .marker-user::before {
            content: '';
            position: absolute;
            top: -15px;
            left: -1px;
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-bottom: 12px solid #E23E33;
            transform: rotate(-18deg);
          }
        </style>
        <script>
          function send(payload) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(payload));
            }
          }
        </script>
      </head>
      <body>
        <div id="map"></div>
        <script src="${KAKAO_SDK_URL}?appkey=${jsKey}&libraries=services&autoload=false"></script>
        <script>
          (function () {
            var map;
            var places;
            var overlays = [];
            var polygons = [];
            var circles = [];
            var userOverlay = null;
            var pendingState = null;

            function levelFromDelta(region) {
              var delta = Math.max(region.latitudeDelta || 0.01, region.longitudeDelta || 0.01);
              if (delta <= 0.004) return 3;
              if (delta <= 0.008) return 4;
              if (delta <= 0.016) return 5;
              if (delta <= 0.032) return 6;
              if (delta <= 0.064) return 7;
              if (delta <= 0.12) return 8;
              return 9;
            }

            function regionFromMap() {
              var center = map.getCenter();
              var bounds = map.getBounds();
              var sw = bounds.getSouthWest();
              var ne = bounds.getNorthEast();
              return {
                latitude: center.getLat(),
                longitude: center.getLng(),
                latitudeDelta: Math.abs(ne.getLat() - sw.getLat()),
                longitudeDelta: Math.abs(ne.getLng() - sw.getLng())
              };
            }

            function clearOverlays() {
              overlays.forEach(function (overlay) { overlay.setMap(null); });
              overlays = [];
            }

            function clearPolygons() {
              polygons.forEach(function (polygon) { polygon.setMap(null); });
              polygons = [];
            }

            function clearCircles() {
              circles.forEach(function (circle) { circle.setMap(null); });
              circles = [];
            }

            function parseColor(value, fallbackOpacity) {
              if (!value) {
                return { color: '#7EC8F7', opacity: fallbackOpacity };
              }
              var rgba = String(value).match(/^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)$/i);
              if (!rgba) {
                return { color: value, opacity: fallbackOpacity };
              }
              var r = Number(rgba[1]);
              var g = Number(rgba[2]);
              var b = Number(rgba[3]);
              var opacity = rgba[4] != null ? Number(rgba[4]) : fallbackOpacity;
              return {
                color: 'rgb(' + r + ', ' + g + ', ' + b + ')',
                opacity: opacity
              };
            }

            function renderCircles(items) {
              clearCircles();
              (items || []).forEach(function (item) {
                var fill = parseColor(item.fillColor, 0.28);
                var stroke = parseColor(item.strokeColor, 0.85);
                var circle = new kakao.maps.Circle({
                  center: new kakao.maps.LatLng(item.latitude, item.longitude),
                  radius: item.radiusMeters,
                  strokeWeight: 2,
                  strokeColor: stroke.color,
                  strokeOpacity: stroke.opacity,
                  fillColor: fill.color,
                  fillOpacity: fill.opacity
                });
                circle.setMap(map);
                circles.push(circle);
              });
            }

            function markerHtml(marker) {
              if (marker.kind === 'officer') {
                var label = marker.reportCount > 99 ? '99+' : String(marker.reportCount || 1);
                return '<button class="marker-officer" data-id="' + marker.id + '">' + label + '</button>';
              }
              if (marker.kind === 'search') {
                return '<button class="marker-search" data-id="' + marker.id + '">●</button>';
              }
              var rawCount = marker.reportCount || 1;
              var count = rawCount > 99 ? '99+' : String(rawCount);
              var sizeClass = rawCount === 1 ? 'marker-one' : rawCount >= 10 ? 'marker-large' : '';
              var icon = marker.iconUri
                ? '<img class="marker-report-icon" src="' + marker.iconUri + '" />'
                : '';
              return '<div class="marker-report-wrap"><button class="marker-report ' + sizeClass + '" data-id="' + marker.id + '"><span class="marker-report-tail-outer"></span><span class="marker-report-tail-inner"></span><span class="marker-report-body">' + icon + '<span>' + count + '개</span></span></button></div>';
            }

            function renderMarkers(markers) {
              clearOverlays();
              (markers || []).forEach(function (marker) {
                var content = document.createElement('div');
                content.innerHTML = markerHtml(marker);
                content.firstChild.addEventListener('click', function () {
                  send({ type: 'MARKER_PRESS', markerId: marker.id });
                });
                var overlay = new kakao.maps.CustomOverlay({
                  position: new kakao.maps.LatLng(marker.latitude, marker.longitude),
                  content: content,
                  yAnchor: marker.kind === 'search' ? 1 : 1
                });
                overlay.setMap(map);
                overlays.push(overlay);
              });
            }

            function renderUserLocation(state) {
              if (userOverlay) {
                userOverlay.setMap(null);
                userOverlay = null;
              }
              if (!state.showsUserLocation || !state.userLocation) {
                return;
              }
              var content = document.createElement('div');
              content.className = 'marker-user';
              userOverlay = new kakao.maps.CustomOverlay({
                position: new kakao.maps.LatLng(state.userLocation.latitude, state.userLocation.longitude),
                content: content,
                yAnchor: 0.5
              });
              userOverlay.setMap(map);
            }

            function renderPolygons(items) {
              clearPolygons();
              (items || []).forEach(function (item) {
                var path = item.coordinates.map(function (coord) {
                  return new kakao.maps.LatLng(coord.latitude, coord.longitude);
                });
                var polygon = new kakao.maps.Polygon({
                  path: path,
                  strokeWeight: 2,
                  strokeColor: item.strokeColor,
                  strokeOpacity: 0.85,
                  fillColor: item.fillColor,
                  fillOpacity: 1
                });
                polygon.setMap(map);
                polygons.push(polygon);
              });
            }

            window.SSIREN_SET_STATE = function (state) {
              if (!map) {
                pendingState = state;
                return;
              }
              if (state.region && state.moveCamera !== false) {
                var center = new kakao.maps.LatLng(state.region.latitude, state.region.longitude);
                map.setLevel(levelFromDelta(state.region), { animate: !!state.duration });
                map.panTo(center);
              }
              renderMarkers(state.markers);
              renderPolygons(state.polygons);
              renderCircles(state.circles);
              renderUserLocation(state);
            };

            window.SSIREN_SEARCH_PLACES = function (payload) {
              if (!places) {
                send({ type: 'SEARCH_ERROR', requestId: payload.requestId, message: 'kakao_places_not_ready' });
                return;
              }
              var options = {};
              if (payload.options && payload.options.latitude && payload.options.longitude) {
                options.location = new kakao.maps.LatLng(payload.options.latitude, payload.options.longitude);
                options.radius = payload.options.radiusMeters || 5000;
              }
              places.keywordSearch(payload.keyword, function (data, status) {
                if (status !== kakao.maps.services.Status.OK) {
                  send({ type: 'SEARCH_RESULTS', requestId: payload.requestId, results: [] });
                  return;
                }
                send({
                  type: 'SEARCH_RESULTS',
                  requestId: payload.requestId,
                  results: data.slice(0, 8).map(function (item) {
                    return {
                      id: item.id,
                      placeName: item.place_name,
                      addressName: item.address_name,
                      roadAddressName: item.road_address_name,
                      latitude: Number(item.y),
                      longitude: Number(item.x)
                    };
                  })
                });
              }, options);
            };

            kakao.maps.load(function () {
              var initial = ${serializeForInjection(initialRegion)};
              map = new kakao.maps.Map(document.getElementById('map'), {
                center: new kakao.maps.LatLng(initial.latitude, initial.longitude),
                level: ${regionToLevel(initialRegion)}
              });
              places = new kakao.maps.services.Places();
              kakao.maps.event.addListener(map, 'dragstart', function () {
                send({ type: 'MAP_DRAG_START' });
              });
              kakao.maps.event.addListener(map, 'click', function () {
                send({ type: 'MAP_PRESS' });
              });
              kakao.maps.event.addListener(map, 'idle', function () {
                send({ type: 'REGION_CHANGE_COMPLETE', region: regionFromMap() });
              });
              send({ type: 'READY' });
              if (pendingState) {
                window.SSIREN_SET_STATE(pendingState);
                pendingState = null;
              }
            });
          })();
        </script>
      </body>
    </html>
  `;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
});
