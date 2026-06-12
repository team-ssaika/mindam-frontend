declare module 'react-native-maps' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export const PROVIDER_GOOGLE: string;

  export type LatLng = {
    latitude: number;
    longitude: number;
  };

  export type Region = LatLng & {
    latitudeDelta: number;
    longitudeDelta: number;
  };

  export type MapViewProps = ViewProps & {
    provider?: string;
    region?: Region;
    onMapReady?: () => void;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    rotateEnabled?: boolean;
    pitchEnabled?: boolean;
    toolbarEnabled?: boolean;
    moveOnMarkerPress?: boolean;
    liteMode?: boolean;
    cacheEnabled?: boolean;
  };

  export default class MapView extends React.Component<MapViewProps> {
    animateToRegion(region: Region, duration?: number): void;
  }

  export const Circle: ComponentType<{
    center: LatLng;
    radius: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  }>;

  export const Marker: ComponentType<{
    coordinate: LatLng;
    anchor?: { x: number; y: number };
    children?: React.ReactNode;
  }>;
}
