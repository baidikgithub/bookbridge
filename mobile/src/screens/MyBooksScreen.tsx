import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Banner, Icon, NavBar, StateView } from '../components';
import { colors, hairline, radius, space, type } from '../constants/theme';
import { useAsync } from '../hooks';
import type { Donation, Nav, User } from '../types';
import { shortDate } from '../utils';
import { PassOnSheet } from './PassOnSheet';

// Donated copies the signed-in user has right now, each with a way to pass it to another volunteer.
export function MyBooksScreen({
  nav,
  user,
  top,
}: {
  nav: Nav;
  user: User;
  top: number;
}) {
  const { data, error, loading, reload } = useAsync(
    () => api.listDonations({ owner: 'me', limit: 100 }),
    [],
  );
  const [passing, setPassing] = useState<Donation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const items = data?.data ?? [];

  return (
    <View style={[s.root, { paddingTop: top }]}>
      <NavBar title="My Books" onBack={nav.back} />
      <FlatList
        data={items}
        keyExtractor={d => String(d.id)}
        onRefresh={reload}
        refreshing={loading && !!data}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.header}>
            {notice && <Banner tone="ok" text={notice} />}
            {items.length > 0 && (
              <Text style={[type.footnote, s.count]}>
                {items.length === 1
                  ? '1 BOOK WITH YOU'
                  : `${items.length} BOOKS WITH YOU`}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <StateView
            loading={loading && !data}
            error={error}
            onRetry={reload}
            empty="You don’t have any donated books right now."
          />
        }
        renderItem={({ item: d, index }) => (
          <View
            style={[
              s.row,
              index === 0 && s.first,
              index === items.length - 1 && s.last,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => nav.push({ name: 'Detail', bookId: d.book_id })}
              style={[s.main, index < items.length - 1 && s.separator]}
            >
              <View style={s.text}>
                <Text style={type.headline} numberOfLines={1}>
                  {d.book_title}
                </Text>
                <Text style={type.footnote} numberOfLines={1}>
                  Grade {d.grade} · {d.school} · {shortDate(d.donated_on)}
                </Text>
                {d.transfers > 0 && (
                  <Text style={[type.caption, s.via]} numberOfLines={1}>
                    Passed on{' '}
                    {d.transfers === 1 ? 'once' : `${d.transfers} times`}
                  </Text>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Donate ${d.book_title} to another volunteer`}
                onPress={() => {
                  setNotice(null);
                  setPassing(d);
                }}
                hitSlop={6}
                style={({ pressed }) => [s.pass, pressed && { opacity: 0.7 }]}
              >
                <Icon name="hand" size={18} color={colors.onPrimary} />
                <Text style={s.passText}>Donate</Text>
              </Pressable>
            </Pressable>
          </View>
        )}
      />

      <PassOnSheet
        donation={passing}
        meId={user.id}
        onCancel={() => setPassing(null)}
        onDone={name => {
          setNotice(`“${passing?.book_title}” is now with ${name}.`);
          setPassing(null);
          reload();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xl },
  header: {
    paddingHorizontal: space.gutter,
    gap: space.sm,
    marginBottom: space.sm,
  },
  count: { paddingHorizontal: space.lg, marginTop: space.sm },
  row: {
    marginHorizontal: space.gutter,
    backgroundColor: colors.surface,
    paddingLeft: space.lg,
  },
  first: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  last: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingRight: space.md,
  },
  separator: { borderBottomWidth: hairline, borderBottomColor: colors.line },
  text: { flex: 1, gap: 2 },
  via: { color: colors.primary },
  pass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: space.md,
    borderRadius: 18,
    backgroundColor: colors.primaryFill,
  },
  passText: { fontSize: 15, fontWeight: '600', color: colors.onPrimary },
});
