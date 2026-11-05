import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Cover, KeyValueRow, PrimaryButton, StateView, StatusPill } from '../components';
import { api, coverColor, gradeLabel, useAsync } from '../data';
import type { Nav } from '../nav';
import { colors, fonts } from '../theme';
import { DonateSheet } from './DonateSheet';

export function DetailScreen({
  nav,
  bookId,
  top,
  bottom,
}: {
  nav: Nav;
  bookId: number;
  top: number;
  bottom: number;
}) {
  const { data: book, error, loading, reload, setData } = useAsync(() => api.getBook(bookId), [bookId]);
  const [donating, setDonating] = useState(false);

  if (!book) {
    return (
      <View style={[s.root, { paddingTop: top + 4 }]}>
        <View style={[s.nav, { paddingHorizontal: 16 }]}>
          <Pressable onPress={nav.back} hitSlop={12}>
            <Text style={s.navLink}>‹ Back</Text>
          </Pressable>
        </View>
        <StateView loading={loading} error={error} onRetry={reload} />
      </View>
    );
  }

  const available = book.available_quantity;
  const fields: [string, string][] = [
    ['Subject', book.subject ?? '—'],
    ['Grade range', gradeLabel(book)],
    ['Language', book.language],
    ['Condition', book.condition ?? '—'],
    ['ISBN', book.isbn ?? '—'],
  ];

  return (
    <View style={s.root}>
      <ScrollView>
        <View style={[s.header, { paddingTop: top + 4 }]}>
          <View style={s.nav}>
            <Pressable onPress={nav.back} hitSlop={12}>
              <Text style={s.navLink}>‹ Back</Text>
            </Pressable>
          </View>
          <View style={s.headRow}>
            <Cover color={coverColor(book)} uri={book.cover_url} w={96} h={138} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.title}>{book.title}</Text>
              {book.author ? <Text style={s.author}>{book.author}</Text> : null}
              <StatusPill available={available} />
            </View>
          </View>
        </View>

        <View style={s.body}>
          <View style={s.stats}>
            <Stat label="Available" value={available} />
            <Stat label="Donated" value={book.quantity - available} />
            <Stat label="Total" value={book.quantity} />
          </View>

          <Card>
            {fields.map(([k, v], i) => (
              <KeyValueRow key={k} k={k} v={v} last={i === fields.length - 1} />
            ))}
          </Card>

          {book.description ? (
            <Card style={{ padding: 16 }}>
              <Text style={s.desc}>{book.description}</Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: bottom + 12 }]}>
        <PrimaryButton
          label={available > 0 ? 'Donate book' : 'No copies left'}
          tone="accent"
          onPress={() => available > 0 && setDonating(true)}
          style={{ flex: 1, opacity: available > 0 ? 1 : 0.5 }}
        />
      </View>

      <DonateSheet
        visible={donating}
        book={book}
        onCancel={() => setDonating(false)}
        onDonated={updated => {
          setData(updated);
          setDonating(false);
        }}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card style={{ flex: 1, padding: 12, borderRadius: 14 }}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </Card>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: '#EADBC4', paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44 },
  navLink: { fontSize: 17, color: colors.primary },
  headRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-end' },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: '600', color: colors.ink },
  author: { fontSize: 14, color: '#4A3B26' },
  body: { padding: 20, gap: 14 },
  stats: { flexDirection: 'row', gap: 10 },
  statLabel: { fontSize: 12, color: colors.muted },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.ink },
  desc: { fontSize: 14, lineHeight: 21, color: colors.inkSoft },
  footer: { paddingHorizontal: 20, paddingTop: 12, flexDirection: 'row' },
});
