import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '../constants/theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SHEET_BOTTOM = Platform.OS === 'android' ? 56 : 34;

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
};
const todayIso = () => {
  const t = new Date();
  return toIso(t.getFullYear(), t.getMonth(), t.getDate());
};

/** Shows the chosen date in a row; tapping it opens a month calendar. Dates after `max` (default today) can't be picked. */
export function DateField({ label, value, onChange, max }: { label: string; value: string; onChange: (iso: string) => void; max?: string }) {
  const [open, setOpen] = useState(false);
  const { y, m, d } = parseIso(value);
  const display = new Date(y, m, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${display}`} onPress={() => setOpen(true)} style={s.row}>
        <Text style={type.body}>{label}</Text>
        <View style={s.valueRow}>
          <Text style={[type.body, s.value]}>{display}</Text>
          <Text style={s.chevron}>›</Text>
        </View>
      </Pressable>
      <CalendarSheet
        visible={open}
        value={value}
        max={max ?? todayIso()}
        onClose={() => setOpen(false)}
        onPick={iso => {
          onChange(iso);
          setOpen(false);
        }}
      />
    </>
  );
}

function CalendarSheet({ visible, value, max, onClose, onPick }: { visible: boolean; value: string; max: string; onClose: () => void; onPick: (iso: string) => void }) {
  const sel = parseIso(value);
  const [view, setView] = useState({ y: sel.y, m: sel.m });
  const lim = parseIso(max);
  const atMax = view.y > lim.y || (view.y === lim.y && view.m >= lim.m);

  const shift = (delta: number) =>
    setView(v => {
      const dt = new Date(v.y, v.m + delta, 1);
      return { y: dt.getFullYear(), m: dt.getMonth() };
    });

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) {
    cells.push(null);
  }
  const today = todayIso();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={() => setView({ y: sel.y, m: sel.m })}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close calendar" />
      <View style={[s.sheet, { paddingBottom: SHEET_BOTTOM }]}>
        <View style={s.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shift(-1)} hitSlop={10} style={s.arrow}>
            <Text style={s.arrowText}>‹</Text>
          </Pressable>
          <Text style={type.headline}>
            {MONTHS[view.m]} {view.y}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityState={{ disabled: atMax }}
            disabled={atMax}
            onPress={() => shift(1)}
            hitSlop={10}
            style={s.arrow}>
            <Text style={[s.arrowText, atMax && s.disabled]}>›</Text>
          </Pressable>
        </View>

        <View style={s.grid}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={[type.caption, s.weekday]}>
              {w}
            </Text>
          ))}
          {cells.map((day, i) => {
            if (day == null) {
              return <View key={i} style={s.cell} />;
            }
            const iso = toIso(view.y, view.m, day);
            const future = iso > max;
            const selected = iso === value;
            const isToday = iso === today;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={iso}
                accessibilityState={{ selected, disabled: future }}
                disabled={future}
                onPress={() => onPick(iso)}
                style={s.cell}>
                <View style={[s.day, selected && s.daySelected]}>
                  <Text style={[type.body, isToday && s.today, selected && s.selectedText, future && s.disabled]}>{day}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={onClose} style={s.done}>
          <Text style={s.doneText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.sm },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { color: colors.primary },
  chevron: { fontSize: 20, color: colors.faint },
  backdrop: { flex: 1, backgroundColor: '#00000066' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: space.gutter, paddingTop: space.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 28, color: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', color: colors.muted, marginBottom: space.xs },
  cell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.primaryFill },
  selectedText: { color: colors.onPrimary, fontWeight: '600' },
  today: { color: colors.primary, fontWeight: '600' },
  disabled: { color: colors.faint, opacity: 0.5 },
  done: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  doneText: { fontSize: 17, fontWeight: '600', color: colors.primary },
});
