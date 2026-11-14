import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '../constants/theme';
import type { Book } from '../types';
import { coverColor, gradeLabel, imageUri } from '../utils';

// Store-style card for the two-column grid: big cover, title, author, details and stock.
export function BookGridCard({
  book,
  width,
  onPress,
}: {
  book: Book;
  width: number;
  onPress: () => void;
}) {
  const src = imageUri(book.cover_url);
  const available = book.available_quantity;
  const ok = available > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title}${
        book.author ? ` by ${book.author}` : ''
      }, ${ok ? `${available} available` : 'all donated'}`}
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        { width },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[s.coverBox, { backgroundColor: coverColor(book) }]}>
        {src ? (
          <Image
            source={{ uri: src }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={s.placeholder} numberOfLines={3}>
            {book.title}
          </Text>
        )}
        {book.condition ? (
          <Text style={s.condition}>{book.condition}</Text>
        ) : null}
      </View>

      <View style={s.body}>
        <Text style={s.title} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={type.footnote} numberOfLines={1}>
          {book.author ?? 'Unknown author'}
        </Text>
        <Text style={[type.caption, s.meta]} numberOfLines={1}>
          {[book.subject, gradeLabel(book)].filter(Boolean).join(' · ')}
        </Text>
        <View style={s.footer}>
          <Text
            style={[s.stock, { color: ok ? colors.okInk : colors.warnInk }]}
          >
            {ok ? `${available} available` : 'All donated'}
          </Text>
          <Text style={[type.caption, s.lang]} numberOfLines={1}>
            {book.language}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  coverBox: {
    aspectRatio: 4 / 3, // wider than tall keeps the card short
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
  },
  placeholder: {
    color: '#FFFFFFE6',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  condition: {
    position: 'absolute',
    top: 6,
    left: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink,
    backgroundColor: '#FFFFFFE6',
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  body: { paddingHorizontal: space.sm, paddingTop: 4, paddingBottom: 6, gap: 0 },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.ink,
  },
  meta: { color: colors.muted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: space.xs,
  },
  stock: { fontSize: 13, fontWeight: '700' },
  lang: { color: colors.muted, flexShrink: 1 },
});
