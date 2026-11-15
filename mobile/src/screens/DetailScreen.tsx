import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import { api } from '../api';
import { Banner, Cover, Field, KeyValueRow, NavBar, PrimaryButton, Row, Section, StateView, StatTile, StatusPill, Stepper, TextButton } from '../components';
import { colors, hairline, space, type } from '../constants/theme';
import { useAsync } from '../hooks';
import type { Nav, User } from '../types';
import { coverColor, donationPerson, gradeLabel, isAdmin, shortDate } from '../utils';
import { DonateSheet } from './DonateSheet';
import { PassOnSheet } from './PassOnSheet';

export function DetailScreen({ nav, bookId, user, top, bottom }: { nav: Nav; bookId: number; user: User; top: number; bottom: number }) {
  const { data: book, error, loading, reload } = useAsync(() => api.getBook(bookId), [bookId]);
  const history = useAsync(() => api.listDonations({ book_id: bookId, limit: 20 }), [bookId]);
  const [donating, setDonating] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Admins manage inventory and record donations. Volunteers can only view the book.
  const canManage = isAdmin(user);
  // Donated copies of this book the signed-in user owns now; the owner can donate one onward.
  const owned = useAsync(() => api.listDonations({ book_id: bookId, owner: 'me', limit: 50 }), [bookId]);
  const ownedCopy = owned.data?.data[0] ?? null;
  const [passing, setPassing] = useState(false);

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
  const donatedCopies = book.quantity - available;

  const beginEdit = () => {
    setTitle(book.title);
    setAuthor(book.author ?? '');
    setQuantity(book.quantity);
    setFormError(null);
    setEditing(true);
  };

  const save = async () => {
    if (saving) {
      return;
    }
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (quantity < donatedCopies) {
      setFormError(`Quantity must cover the ${donatedCopies} donated ${donatedCopies === 1 ? 'copy' : 'copies'}.`);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.updateBook(book.id, {
        title: title.trim(),
        author: author.trim(),
        // The server moves available copies by the change in quantity, so a donation made
        // while this form was open isn't undone.
        quantity,
      });
      setEditing(false);
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert('Delete this book?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteBook(book.id);
            nav.back();
          } catch (e) {
            setFormError(e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };
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
      <NavBar
        onBack={nav.back}
        right={
          canManage ? (
            <View style={s.navActions}>
              {!editing && (
                <Pressable accessibilityRole="button" accessibilityLabel="Delete book" onPress={remove} hitSlop={10} style={s.iconBtn}>
                  <TrashIcon />
                </Pressable>
              )}
              <TextButton label={editing ? 'Cancel' : 'Edit'} onPress={() => (editing ? setEditing(false) : beginEdit())} />
            </View>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.head}>
          <View style={{ gap: 6, alignItems: 'center' }}>
            <Cover color={coverColor(book)} uri={book.cover_url} w={84} h={120} />
            {canManage && (
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
        {formError && <Banner tone="error" text={formError} />}

        {editing && (
          <Section header="Edit book">
            <Field label="Title" value={title} onChange={setTitle} placeholder="Title" autoCapitalize="words" />
            <Field label="Author" value={author} onChange={setAuthor} placeholder="Optional" autoCapitalize="words" />
            <View style={s.qtyRow}>
              <Text style={type.body}>Quantity</Text>
              <Stepper value={quantity} onChange={setQuantity} min={Math.max(1, donatedCopies)} />
            </View>
          </Section>
        )}

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

        <Section
          header="Donation history"
          action={canManage ? { label: 'Full History', onPress: () => nav.push({ name: 'History', bookId: book.id, bookTitle: book.title }) } : undefined}>
          {donations.length ? (
            donations.map((d, i) => (
              <Row
                key={d.id}
                title={donationPerson(d)}
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
        {editing ? (
          <PrimaryButton label={saving ? 'Saving…' : 'Save Changes'} onPress={save} disabled={saving} />
        ) : canManage ? (
          <PrimaryButton
            label={available > 0 ? 'Donate Book' : 'No Copies Left'}
            tone="accent"
            disabled={available < 1}
            onPress={() => setDonating(true)}
          />
        ) : ownedCopy ? (
          <PrimaryButton
            label={(owned.data?.total ?? 0) > 1 ? `Donate a Copy (you have ${owned.data!.total})` : 'Donate to a Volunteer'}
            onPress={() => setPassing(true)}
          />
        ) : (
          <Text style={[type.footnote, { textAlign: 'center', paddingVertical: space.md }]}>
            {owned.loading ? 'Checking ownership…' : 'You don’t own a copy of this book.'}
          </Text>
        )}
      </View>

      <PassOnSheet
        donation={passing ? ownedCopy : null}
        meId={user.id}
        onCancel={() => setPassing(false)}
        onDone={() => {
          setPassing(false);
          // Ownership moved: if that was the user's last copy, the book leaves their Explore.
          if ((owned.data?.total ?? 0) <= 1) {
            nav.back();
          } else {
            owned.reload();
            history.reload();
          }
        }}
      />
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

function TrashIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </Svg>
  );
}

const s = StyleSheet.create({
  navActions: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  iconBtn: { minHeight: 44, minWidth: 32, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.gutter, paddingBottom: space.xl, gap: space.xl },
  head: { flexDirection: 'row', gap: space.lg, alignItems: 'flex-end', paddingTop: space.sm },
  headText: { flex: 1, gap: 6 },
  coverLink: { fontSize: 13, color: colors.primary },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: -space.sm },
  desc: { padding: space.lg, color: colors.inkSoft },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  footer: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    backgroundColor: colors.bg,
    borderTopWidth: hairline,
    borderTopColor: colors.line,
  },
});
