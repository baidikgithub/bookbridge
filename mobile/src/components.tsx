import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius } from './theme';

export type Tab = 'Home' | 'Inventory' | 'Add' | 'Reports';

export function Cover({ color, uri, w = 40, h = 56 }: { color: string; uri?: string | null; w?: number; h?: number }) {
  const box = { width: w, height: h, borderRadius: radius.sm, backgroundColor: color };
  return uri ? <Image source={{ uri }} style={box} accessibilityIgnoresInvertColors /> : <View style={box} />;
}

// Loading / error / empty placeholder shared by every data-backed screen.
export function StateView({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={styles.state}>
      <Text style={styles.stateText}>{error ? `Couldn't load: ${error}` : empty}</Text>
      {error && onRetry ? (
        <Pressable onPress={onRetry} hitSlop={12}>
          <Text style={styles.stateLink}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children.toUpperCase()}</Text>;
}

export function KeyValueRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <View style={[styles.kvRow, !last && styles.kvBorder]}>
      <Text style={styles.kvKey}>{k}</Text>
      <Text style={styles.kvValue}>{v}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  tone = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'accent';
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: tone === 'accent' ? colors.accent : colors.primary, opacity: pressed ? 0.85 : 1 },
        style,
      ]}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}>
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  dark,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  dark?: boolean;
}) {
  return (
    <View style={[styles.segment, { backgroundColor: dark ? '#FFFFFF14' : colors.field }]}>
      {options.map(o => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o)}
            style={[styles.segmentItem, on && { backgroundColor: dark ? '#FFFFFF' : colors.surface }]}>
            <Text style={[styles.segmentText, { color: on ? colors.ink : dark ? '#FFFFFF' : colors.muted }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StatusPill({ available, condition }: { available: number; condition?: string }) {
  const ok = available > 0;
  return (
    <Text style={[styles.pill, { backgroundColor: ok ? colors.okBg : colors.warnBg, color: ok ? colors.okInk : colors.warnInk }]}>
      {ok ? `${available} available${condition ? ' · ' + condition : ''}` : 'All donated'}
    </Text>
  );
}

export function Bar({ pct, color = colors.primary, height = 8 }: { pct: number; color?: string; height?: number }) {
  return (
    <View style={{ flex: 1, height, borderRadius: height / 2, backgroundColor: colors.track, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const TAB_GLYPHS: Record<Tab, string> = { Home: '⌂', Inventory: '▤', Add: '⊕', Reports: '▥' };

export function TabBar({ active, onSelect, bottomInset }: { active: Tab; onSelect: (t: Tab) => void; bottomInset: number }) {
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(bottomInset, 8) }]} accessibilityRole="tablist">
      {(Object.keys(TAB_GLYPHS) as Tab[]).map(t => {
        const on = t === active;
        const color = on ? colors.primary : colors.muted;
        return (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t}
            onPress={() => onSelect(t)}
            style={styles.tabItem}>
            <Text style={[styles.tabGlyph, { color }]}>{TAB_GLYPHS[t]}</Text>
            <Text style={[styles.tabLabel, { color }]}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  state: { paddingVertical: 32, alignItems: 'center', gap: 10 },
  stateText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  stateLink: { fontSize: 15, fontWeight: '600', color: colors.primary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, minHeight: 46 },
  kvBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  kvKey: { fontSize: 15, color: colors.muted },
  kvValue: { fontSize: 15, fontWeight: '500', color: colors.ink },
  primaryBtn: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.ink },
  chipOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipText: { fontSize: 14, fontWeight: '500' },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  segmentItem: { flex: 1, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13, fontWeight: '600' },
  pill: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '600', borderRadius: 6, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFFEE', borderTopWidth: 1, borderTopColor: '#E3E1D9', paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 2, minHeight: 44 },
  tabGlyph: { fontSize: 22, lineHeight: 26 },
  tabLabel: { fontSize: 10, fontWeight: '500' },
});
