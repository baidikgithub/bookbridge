import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../constants/theme';
import { Icon, type IconName } from './Icon';

export type CategoryItem = {
  key: string;
  label: string;
  icon: IconName;
  color: string; // soft tinted background
  ink: string; // icon colour, a deeper shade of the tint
  detail?: string; // small line under the label, e.g. a count
  onPress: () => void;
};

// Tinted shortcut tile: label top-left, icon in a white badge bottom-right.
export function CategoryCard({ item }: { item: CategoryItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        item.detail ? `${item.label}, ${item.detail}` : item.label
      }
      onPress={item.onPress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: item.color },
        pressed && s.pressed,
      ]}
    >
      <View style={s.text}>
        <Text style={s.label} numberOfLines={2}>
          {item.label}
        </Text>
        {item.detail ? (
          <Text style={s.detail} numberOfLines={1}>
            {item.detail}
          </Text>
        ) : null}
      </View>
      <View style={s.badge}>
        <Icon name={item.icon} size={24} color={item.ink} />
      </View>
    </Pressable>
  );
}

// Horizontally scrolling row of category cards that bleeds to the screen edges.
export function CategoryRail({
  title,
  items,
}: {
  title?: string;
  items: CategoryItem[];
}) {
  return (
    <View style={s.rail}>
      {title ? (
        <Text style={s.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
        decelerationRate="fast"
        snapToInterval={CARD_W + GAP}
      >
        {items.map(item => (
          <CategoryCard key={item.key} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_W = 128;
const GAP = space.sm;

const s = StyleSheet.create({
  rail: { gap: space.sm, marginHorizontal: -space.gutter },
  title: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    color: colors.ink,
    paddingHorizontal: space.gutter,
  },
  row: { gap: GAP, paddingHorizontal: space.gutter },
  card: {
    width: CARD_W,
    height: 136,
    borderRadius: radius.xxl,
    padding: space.md,
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  text: { gap: 2 },
  label: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
    color: '#3A3A3CB3',
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-end',
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
