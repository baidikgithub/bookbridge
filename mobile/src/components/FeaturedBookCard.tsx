import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../constants/theme';
import type { Book } from '../types';
import { coverColor, gradeLabel, imageUri } from '../utils';
import { Icon } from './Icon';

// Large featured card: full-bleed cover with a dark frosted panel showing title, author,
// how many copies have been donated, and grade and stock details.
export function FeaturedBookCard({
  book,
  width,
  onPress,
}: {
  book: Book;
  width: number;
  onPress: () => void;
}) {
  const src = imageUri(book.cover_url);
  const donated = Math.max(0, book.quantity - book.available_quantity);
  const pct = book.quantity ? (donated / book.quantity) * 100 : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${donated} of ${book.quantity} copies donated`}
      onPress={onPress}
      style={({ pressed }) => [s.card, { width }, pressed && { opacity: 0.92 }]}
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            s.placeholder,
            { backgroundColor: coverColor(book) },
          ]}
        >
          <Icon name="book" size={72} color="#FFFFFF59" strokeWidth={1.2} />
        </View>
      )}

      <View style={s.save}>
        <Icon name="bookmark" size={20} color="#FFFFFF" />
      </View>

      <View style={s.panel}>
        <Text style={s.title} numberOfLines={2}>
          {book.title}
        </Text>
        <View style={s.metaRow}>
          <Icon name="user" size={15} color="#FFFFFFCC" />
          <Text style={s.meta} numberOfLines={1}>
            {book.author ?? 'Unknown author'}
          </Text>
        </View>

        <View style={s.amounts}>
          <Text style={s.amount}>{donated} donated</Text>
          <Text style={s.of}>of {book.quantity} copies</Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: `${Math.min(100, pct)}%` }]} />
        </View>

        <View style={s.footer}>
          <View style={s.metaRow}>
            <Icon name="layers" size={15} color="#FFFFFFCC" />
            <Text style={s.meta}>{book.subject ?? 'No subject'}</Text>
          </View>
          <View style={s.metaRow}>
            <Icon name="books" size={15} color="#FFFFFFCC" />
            <Text style={s.meta}>{gradeLabel(book)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.dark,
    justifyContent: 'flex-end',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 140,
  },
  save: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00000059',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    margin: space.sm,
    padding: space.lg,
    borderRadius: 18,
    backgroundColor: '#141A12D9',
    gap: 6,
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  meta: { fontSize: 14, color: '#FFFFFFCC', flexShrink: 1 },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: space.sm,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  of: { fontSize: 15, color: '#FFFFFFCC' },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF33',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primaryFill,
  },
  footer: { flexDirection: 'row', gap: space.lg, marginTop: 4 },
});
