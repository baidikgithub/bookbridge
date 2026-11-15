import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../api';
import {
  Cover,
  Icon,
  NavBar,
  SearchField,
  StateView,
} from '../components';
import { colors, radius, space, type } from '../constants/theme';
import type { HistoryEntry, HistoryParams, Nav } from '../types';
import { coverColor, shortDate } from '../utils';

const PAGE = 30;

// Admin view of every book assignment and volunteer-to-volunteer transfer, across all users.
// Optionally scoped to one book (from its detail screen).
export function HistoryScreen({
  nav,
  top,
  bookId,
  bookTitle,
}: {
  nav: Nav;
  top: number;
  bookId?: number;
  bookTitle?: string;
}) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = useCallback(
    (offset: number): HistoryParams => ({
      book_id: bookId,
      q: debounced || undefined,
      order: 'desc', // newest first
      limit: PAGE,
      offset,
    }),
    [bookId, debounced],
  );

  const load = useCallback(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api
      .history(params(0))
      .then(r => {
        if (live) {
          setItems(r.data);
          setTotal(r.total);
        }
      })
      .catch(e => live && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [params]);

  useEffect(load, [load]);

  const loadMore = () => {
    if (more || loading || total == null || items.length >= total) {
      return;
    }
    setMore(true);
    api
      .history(params(items.length))
      .then(r =>
        setItems(prev => [
          ...prev,
          ...r.data.filter(x => !prev.some(p => p.id === x.id)),
        ]),
      )
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setMore(false));
  };

  return (
    <View style={[s.root, { paddingTop: top }]}>
      <NavBar
        title={bookTitle ? 'Book History' : 'Transfer History'}
        onBack={nav.back}
      />
      <FlatList
        data={items}
        keyExtractor={e => String(e.id)}
        contentContainerStyle={s.content}
        onRefresh={load}
        refreshing={loading && items.length > 0}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={s.header}>
            {bookTitle ? (
              <Text style={type.title3} numberOfLines={2}>
                {bookTitle}
              </Text>
            ) : (
              <SearchField
                value={q}
                onChange={setQ}
                placeholder="Search by book title"
              />
            )}
            <Text style={[type.footnote, s.count]}>
              {total == null
                ? ' '
                : `${total} ${total === 1 ? 'RECORD' : 'RECORDS'} · NEWEST FIRST`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <StateView
            loading={loading}
            error={error}
            onRetry={load}
            empty={
              debounced
                ? 'No records match.'
                : 'No books have been donated yet.'
            }
          />
        }
        ListFooterComponent={
          more ? (
            <ActivityIndicator style={{ marginVertical: space.lg }} />
          ) : undefined
        }
        renderItem={({ item }) => (
          <HistoryCard
            entry={item}
            onPress={() => nav.push({ name: 'Detail', bookId: item.book_id })}
          />
        )}
      />
    </View>
  );
}

function HistoryCard({
  entry: e,
  onPress,
}: {
  entry: HistoryEntry;
  onPress: () => void;
}) {
  const assign = e.kind === 'assign';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${e.book_title}. ${
        assign ? 'Assigned' : 'Transferred'
      } from ${e.from_name} to ${e.to_name} on ${e.transferred_on}. ${
        e.recipient_still_owns
          ? `${e.to_name} still owns it.`
          : `Now owned by ${e.current_owner_name ?? 'unknown'}.`
      }`}
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}
    >
      <View style={s.bookRow}>
        <Cover
          color={coverColor({ id: e.book_id })}
          uri={e.book_cover_url}
          w={36}
          h={50}
        />
        <View style={s.bookText}>
          <Text style={type.headline} numberOfLines={1}>
            {e.book_title}
          </Text>
          <Text style={type.footnote} numberOfLines={1}>
            {[e.book_author, e.book_subject].filter(Boolean).join(' · ') ||
              'No details'}
          </Text>
        </View>
        <Text style={[s.badge, assign ? s.badgeAssign : s.badgeTransfer]}>
          {assign ? 'Admin' : 'Volunteer'}
        </Text>
      </View>

      <View style={s.flow}>
        <View style={s.person}>
          <Text style={s.personLabel}>DONOR</Text>
          <Text style={type.subhead} numberOfLines={1}>
            {e.from_name}
          </Text>
        </View>
        <Icon name="chevronRight" size={18} color={colors.faint} />
        <View style={s.person}>
          <Text style={s.personLabel}>RECIPIENT</Text>
          <Text style={type.subhead} numberOfLines={1}>
            {e.to_name}
          </Text>
        </View>
        <View style={s.date}>
          <Text style={s.personLabel}>DATE</Text>
          <Text style={type.subhead}>{shortDate(e.transferred_on)}</Text>
        </View>
      </View>

      <View
        style={[
          s.status,
          e.recipient_still_owns ? s.statusOwned : s.statusMoved,
        ]}
      >
        <View
          style={[
            s.dot,
            {
              backgroundColor: e.recipient_still_owns
                ? colors.primary
                : colors.faint,
            },
          ]}
        />
        <Text
          style={[
            type.footnote,
            {
              color: e.recipient_still_owns ? colors.primaryInk : colors.muted,
            },
          ]}
          numberOfLines={1}
        >
          {e.recipient_still_owns
            ? `Currently owned by ${e.to_name}`
            : `Passed on · now owned by ${e.current_owner_name ?? 'unknown'}`}
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  header: { gap: space.md, marginBottom: space.xs },
  count: { paddingHorizontal: space.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.md,
  },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bookText: { flex: 1, gap: 2 },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeAssign: {
    backgroundColor: colors.primarySoft,
    color: colors.primaryInk,
  },
  badgeTransfer: { backgroundColor: '#ECEDF1', color: '#4A5068' },
  flow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  person: { flex: 1, gap: 1 },
  date: { alignItems: 'flex-end', gap: 1 },
  personLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.muted,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
  },
  statusOwned: { backgroundColor: colors.primarySoft },
  statusMoved: { backgroundColor: colors.bg },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
