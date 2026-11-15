import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '../constants/theme';
import type { Tab } from '../types';
import { Icon, type IconName } from './Icon';
import { styles } from './styles';

// ---------- Navigation ----------

// Large title header used at the top of each tab's root screen.
export function LargeTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.largeTitle}>
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={styles.largeSubtitle}>{subtitle}</Text> : null}
        <Text style={type.largeTitle} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right ? <View style={styles.largeRight}>{right}</View> : null}
    </View>
  );
}

// Standard 44pt navigation bar: leading back/cancel, centred title, optional trailing action.
export function NavBar({
  title,
  onBack,
  backLabel = 'Back',
  right,
  dark,
}: {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
  dark?: boolean;
}) {
  const tint = dark ? '#FFFFFF' : colors.primary;
  return (
    <View style={styles.navBar}>
      <View style={styles.navSide}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            onPress={onBack}
            hitSlop={12}
            style={styles.navHit}
          >
            <Text style={[styles.navLink, { color: tint }]}>
              {backLabel === 'Back' ? '‹ ' : ''}
              {backLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Text
        style={[type.headline, styles.navTitle, dark && { color: '#FFFFFF' }]}
        numberOfLines={1}
      >
        {title ?? ''}
      </Text>
      <View style={[styles.navSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export function TextButton({
  label,
  onPress,
  bold,
}: {
  label: string;
  onPress: () => void;
  bold?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={12}
      style={styles.navHit}
    >
      <Text style={[styles.navLink, bold && { fontWeight: '600' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const TAB_LABELS: Record<Tab, string> = {
  Home: 'Home',
  Inventory: 'Explore',
  Add: 'Add',
  Reports: 'Reports',
  Profile: 'Profile',
};

const TAB_ICONS: Record<Tab, IconName> = {
  Home: 'home',
  Inventory: 'search',
  Add: 'plus',
  Reports: 'chart',
  Profile: 'userCircle',
};

// Floating frosted bar of round icon buttons; the selected tab is a filled green circle.
export function TabBar({
  active,
  onSelect,
  bottomInset,
  tabs,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
  bottomInset: number;
  tabs: Tab[];
}) {
  return (
    <View
      style={[
        tabStyles.wrap,
        { paddingBottom: Math.max(bottomInset, space.md) },
      ]}
    >
      <View style={tabStyles.bar} accessibilityRole="tablist">
        {tabs.map(t => {
          const on = t === active;
          return (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={TAB_LABELS[t]}
              onPress={() => onSelect(t)}
              hitSlop={4}
              style={({ pressed }) => [
                tabStyles.item,
                on && tabStyles.itemOn,
                pressed && { transform: [{ scale: 0.94 }] },
              ]}
            >
              <Icon
                name={TAB_ICONS[t]}
                size={24}
                color={on ? colors.onPrimary : colors.inkSoft}
                strokeWidth={on ? 1.9 : 1.7}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const ITEM = 56;

const tabStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: space.sm,
    backgroundColor: colors.bg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: ITEM,
    backgroundColor: '#FFFFFFE6',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0000000F',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  item: {
    width: ITEM,
    height: ITEM,
    borderRadius: ITEM / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEEFEC',
  },
  itemOn: { backgroundColor: colors.primaryFill },
});
