import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type Slice = { label: string; value: number; color: string };

// Donut chart. Slices start at 12 o'clock and run clockwise, largest first as given.
export function PieChart({ data, size = 140, thickness = 28, background }: { data: Slice[]; size?: number; thickness?: number; background: string }) {
  const total = data.reduce((n, d) => n + d.value, 0);
  const r = size / 2;
  const inner = r - thickness;
  const label = data.map(d => `${d.label} ${total ? Math.round((d.value / total) * 100) : 0}%`).join(', ');

  if (total === 0) {
    return null;
  }
  // A single 100% slice can't be drawn as an arc, so draw a ring.
  if (data.filter(d => d.value > 0).length === 1) {
    const only = data.find(d => d.value > 0)!;
    return (
      <Svg width={size} height={size} accessibilityLabel={label}>
        <Circle cx={r} cy={r} r={r - thickness / 2} stroke={only.color} strokeWidth={thickness} fill="none" />
      </Svg>
    );
  }

  const point = (rad: number, a: number) => [r + rad * Math.sin(a), r - rad * Math.cos(a)];
  let start = 0;
  return (
    <Svg width={size} height={size} accessibilityLabel={label}>
      {data.map(d => {
        const sweep = (d.value / total) * Math.PI * 2;
        const end = start + sweep;
        const big = sweep > Math.PI ? 1 : 0;
        const [x0, y0] = point(r, start);
        const [x1, y1] = point(r, end);
        const [x2, y2] = point(inner, end);
        const [x3, y3] = point(inner, start);
        const path = `M${x0} ${y0} A${r} ${r} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${inner} ${inner} 0 ${big} 0 ${x3} ${y3} Z`;
        start = end;
        // A thin stroke in the card colour separates neighbouring slices.
        return d.value > 0 ? <Path key={d.label} d={path} fill={d.color} stroke={background} strokeWidth={2} /> : null;
      })}
    </Svg>
  );
}
