import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

/**
 * Line icon set (24×24), ported 1:1 from the ssaika-design system (ds.jsx).
 * Stroke-based by default; pass `fill` for solid glyphs (marker, send, sparkle…).
 */
export const ICON_PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5',
  chat: 'M4 5h16v11H9l-4 4v-4H4z',
  plus: 'M12 5v14M5 12h14',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 3.6-6.5 8-6.5S20 17 20 21',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 1h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 23h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
  filter: 'M3 5h18M6 12h12M10 19h4',
  sort: 'M7 4v16M7 20l-3-3M7 4 4 7M17 4v16M17 4l3 3M17 20l3-3',
  camera: 'M4 8h3l1.5-2h7L17 8h3v12H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  pin: 'M12 2c-3.9 0-7 3-7 6.8C5 14 12 22 12 22s7-8 7-13.2C19 5 15.9 2 12 2Zm0 9.5a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Z',
  location: 'M12 2v3M12 19v3M2 12h3M19 12h3M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  chevR: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  chevL: 'M15 6l-6 6 6 6',
  check: 'M5 12.5 10 17l9-10',
  checkCircle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM8 12l3 3 5-6',
  x: 'M6 6l12 12M18 6 6 18',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 21h4',
  headset:
    'M4 13v-1a8 8 0 0 1 16 0v1M4 13a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 0-2-2h-1v5h1a2 2 0 0 0 2-2Zm0 0v3a4 4 0 0 1-4 4h-2',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 11v6M12 7.5h.01',
  image: 'M4 5h16v14H4zM4 16l4.5-4.5 3 3L16 10l4 4M9 9.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 7v5l3.5 2',
  refresh: 'M20 11a8 8 0 0 0-14-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14 4.5L20 16M20 20v-4h-4',
  alert: 'M12 3 2 20h20L12 3ZM12 10v4M12 17.5h.01',
  arrowL: 'M19 12H5M11 6l-6 6 6 6',
  send: 'M4 12l16-7-7 16-2.5-6.5L4 12Z',
  tag: 'M3 11V4h7l10 10-7 7L3 11Zm4-3.5h.01',
  layers: 'M12 3 2 8.5 12 14l10-5.5L12 3ZM2 13.5 12 19l10-5.5',
  building: 'M5 21V5l7-2 7 2v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6v4H9z',
  sparkle:
    'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  marker: 'M12 2c-3.9 0-7 3-7 6.8C5 14 12 22 12 22s7-8 7-13.2C19 5 15.9 2 12 2Z',
} as const;

export type IconName = keyof typeof ICON_PATHS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** Stroke width for line glyphs (ignored when `fill`). */
  strokeWidth?: number;
  /** Render as a solid glyph instead of a stroked outline. */
  fill?: boolean;
};

export default function Icon({
  name,
  size = 22,
  color = colors.ink,
  strokeWidth = 1.8,
  fill = false,
}: IconProps) {
  const d = ICON_PATHS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={d}
        fill={fill ? color : 'none'}
        stroke={fill ? 'none' : color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
