import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../constants/theme';

// One consistent outline icon set (24×24 grid, rounded 1.7 stroke), in the style of SF Symbols.
export type IconName =
  | 'home'
  | 'search'
  | 'plus'
  | 'chart'
  | 'user'
  | 'users'
  | 'book'
  | 'books'
  | 'gift'
  | 'box'
  | 'bell'
  | 'menu'
  | 'mail'
  | 'heart'
  | 'hand'
  | 'photo'
  | 'pencil'
  | 'chevronRight'
  | 'chevronDown'
  | 'calendar';

const PATHS: Record<IconName, React.ReactNode> = {
  home: <Path d="M4 10.2 12 4l8 6.2V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z" />,
  search: (
    <>
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="m16 16 4 4" />
    </>
  ),
  plus: (
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  chart: <Path d="M5 20V12M10 20V6M15 20v-5M20 20V9M3 20.5h18" />,
  user: (
    <>
      <Circle cx={12} cy={8.5} r={3.8} />
      <Path d="M4.5 20c.8-3.6 3.8-5.6 7.5-5.6s6.7 2 7.5 5.6" />
    </>
  ),
  users: (
    <>
      <Circle cx={9} cy={9} r={3.3} />
      <Path d="M3 19.5c.6-3.1 3-4.9 6-4.9s5.4 1.8 6 4.9M15.5 5.9a3.3 3.3 0 0 1 0 6.3M17.5 14.9c1.9.6 3.1 2.2 3.5 4.6" />
    </>
  ),
  book: <Path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 8h6" />,
  books: <Path d="M4 4.5h4v15H4zM8 4.5h4v15H8zM13.2 5.6l3.8-1 3.8 14.6-3.8 1z" />,
  gift: (
    <>
      <Rect x={4} y={9} width={16} height={11} rx={1.5} />
      <Path d="M3 9h18M12 9v11M12 9c-1.5-3.5-5.5-4-5.5-1.5S10 9 12 9zm0 0c1.5-3.5 5.5-4 5.5-1.5S14 9 12 9z" />
    </>
  ),
  box: <Path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5zM4 7.5l8 3.5 8-3.5M12 11v9" />,
  bell: <Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />,
  menu: <Path d="M4 7h16M4 12h11M4 17h14" />,
  mail: (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={3} />
      <Path d="m4 7 8 6 8-6" />
    </>
  ),
  heart: <Path d="M12 19.5s-7.5-4.4-7.5-9.7A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4c0 5.3-7.5 9.7-7.5 9.7z" />,
  hand: <Path d="M3 14h3.5l3.8 1.4h3.2a1.6 1.6 0 0 1 0 3.2H9.8M13.5 18.6l5-2.4a1.6 1.6 0 0 1 2 2.4L15 21.4a3 3 0 0 1-2.4.3L6.5 20H3M14.5 4.5a2.3 2.3 0 0 1 3.5 0 2.3 2.3 0 0 1 3.5 0c1 1 .9 2.6-.2 3.6L18 11l-3.3-2.9c-1.1-1-1.2-2.6-.2-3.6z" />,
  photo: (
    <>
      <Rect x={3.5} y={5} width={17} height={14} rx={2.5} />
      <Circle cx={9} cy={10} r={1.6} />
      <Path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" />
    </>
  ),
  pencil: <Path d="M15.5 5.5 18.5 8.5M4 20l1-4.2L15.8 5a1.8 1.8 0 0 1 2.6 0l.6.6a1.8 1.8 0 0 1 0 2.6L8.2 19z" />,
  chevronRight: <Path d="m9.5 6 6 6-6 6" />,
  chevronDown: <Path d="m6 9.5 6 6 6-6" />,
  calendar: (
    <>
      <Rect x={4} y={5.5} width={16} height={14.5} rx={2.5} />
      <Path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
};

export function Icon({ name, size = 24, color = colors.ink, strokeWidth = 1.7 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  );
}
