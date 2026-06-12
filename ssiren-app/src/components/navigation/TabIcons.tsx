import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type TabIconProps = {
  color: string;
  size?: number;
};

export function HomeTabIcon({ color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 10.5 12 4l8 6.5v8.4A2.1 2.1 0 0 1 17.9 21H6.1A2.1 2.1 0 0 1 4 18.9v-8.4Z"
        fill="none"
        stroke={color}
        strokeWidth={2.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.2 21v-7h5.6v7"
        fill="none"
        stroke={color}
        strokeWidth={2.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChartTabIcon({ color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 20V10M10 20V4M16 20v-7M22 20H2"
        fill="none"
        stroke={color}
        strokeWidth={2.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InboxTabIcon({ color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3 2 8.5 12 14l10-5.5L12 3ZM2 13.5 12 19l10-5.5"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UserTabIcon({ color, size = 26 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={7.2} r={3.15} fill="none" stroke={color} strokeWidth={2.45} />
      <Path
        d="M5 20v-1.4c0-3 3.1-5 7-5s7 2 7 5V20H5Z"
        fill="none"
        stroke={color}
        strokeWidth={2.45}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GearTabIcon({ color, size = 28 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3.05} fill="none" stroke={color} strokeWidth={2.15} />
      <Path
        d="M19.2 13.7c.1-.55.15-1.1.15-1.7s-.05-1.15-.15-1.7l2-1.5-2-3.45-2.4.95a7.7 7.7 0 0 0-2.75-1.6L13.7 2h-3.4l-.35 2.7a7.7 7.7 0 0 0-2.75 1.6l-2.4-.95-2 3.45 2 1.5c-.1.55-.15 1.1-.15 1.7s.05 1.15.15 1.7l-2 1.5 2 3.45 2.4-.95a7.7 7.7 0 0 0 2.75 1.6l.35 2.7h3.4l.35-2.7a7.7 7.7 0 0 0 2.75-1.6l2.4.95 2-3.45-2-1.5Z"
        fill="none"
        stroke={color}
        strokeWidth={2.15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChatbotTabIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 29, height: 23, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 29,
          height: 23,
          borderRadius: 9,
          borderWidth: 2.3,
          borderColor: color,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#8D8D8D' }} />
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#8D8D8D' }} />
        </View>
        <View
          style={{
            marginTop: 4,
            width: 11,
            height: 3,
            borderRadius: 2,
            backgroundColor: '#8D8D8D',
          }}
        />
      </View>
    </View>
  );
}
