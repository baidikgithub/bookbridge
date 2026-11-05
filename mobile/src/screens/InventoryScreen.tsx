import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Chip, Cover, StateView, StatusPill } from '../components';
import { api, coverColor, gradeLabel, SUBJECTS, useAsync, type ListParams } from '../data';
import type { Nav } from '../nav';
import { colors, fonts } from '../theme';

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const STATUSES = ['available', 'donated'] as const;

export function InventoryScreen({ nav, top }: { nav: Nav; top: number }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [subject, setSubject] = useState<string | undefined>();
  const [grade, setGrade] = useState<number | undefined>();
  const [status, setStatus] = useState<ListParams['status']>();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, error, loading, reload } = useAsync(
    () => api.listBooks({ q: debounced, subject, grade, status, limit: 100 }),
    [debounced, subject, grade, status],
  );
  const books = data?.data ?? [];

  return (
    <FlatList
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: top + 16 }]}
      data={books}
      keyExtractor={b => String(b.id)}
      onRefresh={reload}
      refreshing={loading && !!data}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 4 }}>
          <Text style={s.title}>Inventory</Text>
          <TextInput
            accessibilityLabel="Search books"
            placeholder="Search title or author"
            placeholderTextColor={colors.muted}
            value={q}
            onChangeText={setQ}
            clearButtonMode="while-editing"
            style={s.search}
          />
          <FilterRow
            items={STATUSES.map(x => ({ key: x, label: x === 'available' ? 'Available' : 'All donated' }))}
            value={status}
            onChange={v => setStatus(v as ListParams['status'])}
          />
          <FilterRow items={SUBJECTS.map(x => ({ key: x, label: x }))} value={subject} onChange={setSubject} />
          <FilterRow
            items={GRADES.map(g => ({ key: String(g), label: `Grade ${g}` }))}
            value={grade != null ? String(grade) : undefined}
            onChange={v => setGrade(v ? Number(v) : undefined)}
          />
          {data && <Text style={s.count}>{data.total} results</Text>}
        </View>
      }
      ListEmptyComponent={
        <StateView loading={loading && !data} error={error} onRetry={reload} empty="No books match these filters." />
      }
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item: b }) => (
        <Pressable onPress={() => nav.push({ name: 'Detail', bookId: b.id })}>
          <Card style={s.row}>
            <Cover color={coverColor(b)} uri={b.cover_url} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.bookTitle}>{b.title}</Text>
              <Text style={s.meta}>
                {b.subject ?? 'No subject'} · {gradeLabel(b)} · {b.language}
              </Text>
              <StatusPill available={b.available_quantity} condition={b.condition ?? undefined} />
            </View>
            <Text style={s.chevron}>›</Text>
          </Card>
        </Pressable>
      )}
    />
  );
}

function FilterRow({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string }[];
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={items}
      keyExtractor={i => i.key}
      contentContainerStyle={{ gap: 8 }}
      renderItem={({ item }) => (
        <Chip label={item.label} selected={value === item.key} onPress={() => onChange(value === item.key ? undefined : item.key)} />
      )}
    />
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontFamily: fonts.display, fontSize: 32, fontWeight: '600', color: colors.ink },
  search: { height: 44, borderRadius: 12, backgroundColor: colors.field, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  count: { fontSize: 13, color: colors.muted },
  row: { padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  bookTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  chevron: { fontSize: 24, color: '#9AA3AE' },
});
