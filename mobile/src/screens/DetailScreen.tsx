import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Banner, Cover, KeyValueRow, NavBar, PrimaryButton, Row, Section, StatTile, StateView, StatusPill } from '../components';
import { api, shortDate, coverColor, gradeLabel, useAsync, type User } from '../data';
import type { Nav } from '../nav';
import { colors, hairline, space, type } from '../theme';
import { DonateSheet } from './DonateSheet';

export function DetailScreen({ nav, bookId, user, top, bottom }: { nav: Nav; bookId: number; user: User; top: number; bottom: number }) {
  const { data: book, error, loading, reload } = useAsync(() => api.getBook(bookId), [bookId]);
  const history = useAsync(() => api.listDonations({ book_id: bookId, limit: 20 }), [bookId]);
  const [donating, setDonating] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  // The server only lets coordinators and admins record donations.
  const canDonate = user.role === 'coordinator' || user.role === 'admin';

  if (!book) {
    return (
      <View style={[s.root, { paddingTop: top }]}>
        <NavBar onBack={nav.back} />
        <StateView loading={loading} error={error} onRetry={reload} />
      </View>
    );
  }

  const changeCover = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', maxWidth: 1600, maxHeight: 1600, quality: 0.8, selectionLimit: 1 });
    const a = res.assets?.[0];
    if (!a?.uri) {
      return;
    }
    setCoverBusy(true);
    setCoverError(null);
    try {
      const url = await api.uploadImage({ uri: a.uri, type: a.type, fileName: a.fileName });
      await api.updateBook(book.id, { cover_url: url });
      reload();
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : String(e));
    } finally {
      setCoverBusy(false);
    }
  };

  const available = book.available_quantity;
  const fields: [string, string][] = [
    ['Subject', book.subject ?? '—'],
    ['Grade range', gradeLabel(book)],
    ['Language', book.language],
    ['Condition', book.condition ?? '—'],
    ['ISBN', book.isbn ?? '—'],
  ];
  const donations = history.data?.data ?? [];

  return (
    <View style={[s.root, { paddingTop: top }]}>
      <NavBar onBack={nav.back} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.head}>
          <View style={{ gap: 6, alignItems: 'center' }}>
            <Cover color={coverColor(book)} uri={book.cover_url} w={84} h={120} />
            {canDonate && (
              <Pressable accessibilityRole="button" onPress={changeCover} disabled={coverBusy} hitSlop={8}>
                <Text style={s.coverLink}>{coverBusy ? 'Uploading…' : book.cover_url ? 'Change Photo' : 'Add Photo'}</Text>
              </Pressable>
            )}
          </View>
          <View style={s.headText}>
            <Text style={type.title2}>{book.title}</Text>
            {book.author ? <Text style={[type.subhead, { color: colors.muted }]}>{book.author}</Text> : null}
            <StatusPill available={available} />
          </View>
        </View>

        {coverError && <Banner tone="error" text={coverError} />}

        <View style={s.stats}>
          <StatTile label="Available" value={available} tint={colors.okInk} />
          <StatTile label="Donated" value={book.quantity - available} />
          <StatTile label="Total" value={book.quantity} />
        </View>

        <Section header="Details">
          {fields.map(([k, v], i) => (
            <KeyValueRow key={k} k={k} v={v} last={i === fields.length - 1} />
          ))}
        </Section>

        {book.description ? (
          <Section header="Description">
            <Text style={[type.body, s.desc]}>{book.description}</Text>
          </Section>
        ) : null}

        <Section header="Donation history">
          {donations.length ? (
            donations.map((d, i) => (
              <Row
                key={d.id}
                title={d.child_name}
                subtitle={`Grade ${d.grade} · ${d.school}`}
                value={shortDate(d.donated_on)}
                last={i === donations.length - 1}
              />
            ))
          ) : (
            <Row title={history.loading ? 'Loading…' : history.error ?? 'No donations recorded yet'} />
          )}
        </Section>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: bottom + space.md }]}>
        {canDonate ? (
          <PrimaryButton
            label={available > 0 ? 'Donate Book' : 'No Copies Left'}
            tone="accent"
            disabled={available < 1}
            onPress={() => setDonating(true)}
          />
        ) : (
          <Text style={[type.footnote, { textAlign: 'center', paddingVertical: space.md }]}>
            Ask a coordinator to record donations for this book.
          </Text>
        )}
      </View>

      <DonateSheet
        visible={donating}
        book={book}
        onCancel={() => setDonating(false)}
        onDonated={() => {
          setDonating(false);
          reload();
          history.reload();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.gutter, paddingBottom: space.xl, gap: space.xl },
  head: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-end', paddingTop: space.sm },
  headText: { flex: 1, gap: 6 },
  coverLink: { fontSize: 13, color: colors.primary },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: -space.sm },
  desc: { padding: space.lg, color: colors.inkSoft },
  footer: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    backgroundColor: colors.bg,
    borderTopWidth: hairline,
    borderTopColor: colors.line,
  },
});
