import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, hairline, radius, space, type } from '../constants/theme';
import { initials } from '../utils';
import type { CategoryItem } from './CategoryCard';
import { Icon, type IconName } from './Icon';

const INK = '#1C1C1E';
const SHEET_BOTTOM = Platform.OS === 'android' ? 56 : 34;

// Top bar for Home: menu and a stat pill on the left, notifications and the user's avatar on the right.
export function HomeHeader({
  name,
  statIcon,
  statValue,
  statLabel,
  onStat,
  onBell,
  onAvatar,
  menu,
}: {
  name: string;
  statIcon: IconName;
  statValue: string;
  statLabel: string;
  onStat: () => void;
  onBell: () => void;
  onAvatar: () => void;
  menu: CategoryItem[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.bar}>
      <Circle label="Open menu" onPress={() => setOpen(true)}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round">
          <Path d="M4 6h16M4 12h10M4 18h13" />
        </Svg>
      </Circle>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${statValue} ${statLabel}`}
        onPress={onStat}
        style={({ pressed }) => [s.pill, pressed && s.pressed]}>
        <Icon name={statIcon} size={20} color={colors.primary} />
        <Text style={s.pillValue}>{statValue}</Text>
      </Pressable>

      <View style={s.spacer} />

      <Circle label="Notifications" onPress={onBell}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />
        </Svg>
      </Circle>

      <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={onAvatar} style={({ pressed }) => [s.avatar, pressed && s.pressed]}>
        <Text style={s.avatarText}>{initials(name) || '?'}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close menu" />
        <View style={[s.sheet, { paddingBottom: SHEET_BOTTOM }]}>
          <View style={s.sheetHead}>
            <Text style={type.headline}>Menu</Text>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={s.done}>Done</Text>
            </Pressable>
          </View>
          {menu.map((item, i) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                item.onPress();
              }}
              style={({ pressed }) => [s.menuRow, pressed && { backgroundColor: colors.field }]}>
              <View style={[s.menuIcon, { backgroundColor: item.color }]}>
                <Icon name={item.icon} size={20} color={item.ink} />
              </View>
              <View style={[s.menuMain, i < menu.length - 1 && s.separator]}>
                <Text style={[type.body, s.menuLabel]}>{item.label}</Text>
                <Text style={s.chevron}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

function Circle({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.circle, pressed && s.pressed]}>
      {children}
    </Pressable>
  );
}

const SIZE = 48;

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  spacer: { flex: 1 },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.lg,
  },
  pillValue: { fontSize: 17, fontWeight: '600', color: INK, fontVariant: ['tabular-nums'] },
  avatar: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.primaryFill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600', color: colors.onPrimary },
  pressed: { opacity: 0.7 },
  backdrop: { flex: 1, backgroundColor: '#00000066' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, height: 52 },
  done: { fontSize: 17, fontWeight: '600', color: colors.primary },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, gap: space.md },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuMain: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingRight: space.lg },
  menuLabel: { flex: 1 },
  separator: { borderBottomWidth: hairline, borderBottomColor: colors.line },
  chevron: { fontSize: 22, color: colors.faint },
});
