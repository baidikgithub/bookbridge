import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, Cover, Dropdown, LargeTitle, NavBar, SearchField, StateView, StatusPill } from '../components';
import { api, coverColor, gradeLabel, SUBJECTS, useAsync, type ListParams } from '../data';
import type { Nav } from '../nav';
import { colors, hairline, radius, space, type } from '../theme';

// Grade 0 is kindergarten, matching the server's 0–12 range.
const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => ({ value: g, label: g === 0 ? 'Kindergarten' : `Grade ${g}` }));
const SUBJECT_OPTIONS = SUBJECTS.map(x => ({ value: x, label: x }));
const STATUSES = ['available', 'donated'] as const;

export function InventoryScreen({ nav, top, drive }: { nav: Nav; top: number; drive?: { id: number; name: string } }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [subject, setSubject] = useState<string | undefined>();
  const [grade, setGrade] = useState<number | undefined>();
  const [status, setStatus] = useState<ListParams['status']>();
  const [language, setLanguage] = useState<string | undefined>();
  const [driveFilter, setDriveFilter] = useState(drive);
  const languages = useAsync(() => api.languages(), []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, error, loading, reload } = useAsync(
    () => api.listBooks({ q: debounced, subject, grade, status, language, drive_id: driveFilter?.id, limit: 100 }),
    [debounced, subject, grade, status, language, driveFilter?.id],
  );
  const books = data?.data ?? [];
  const last = books.length - 1;

  return (
    <FlatList
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: top }]}
      data={books}
      keyExtractor={b => String(b.id)}
      onRefresh={reload}
      refreshing={loading && !!data}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View style={s.header}>
          {drive ? <NavBar title="Drive Books" onBack={nav.back} /> : <LargeTitle title="Inventory" />}
          <View style={s.pad}>
            <SearchField value={q} onChange={setQ} placeholder="Search title or author" />
          </View>
          {driveFilter && (
            <View style={s.chips}>
              <Chip label={`Drive: ${driveFilter.name}  ✕`} selected onPress={() => setDriveFilter(undefined)} />
            </View>
          )}
          <FilterRow
            items={STATUSES.map(x => ({ key: x, label: x === 'available' ? 'Available' : 'All donated' }))}
            value={status}
            onChange={v => setStatus(v as ListParams['status'])}
          />
          <View style={s.dropdowns}>
            <Dropdown label="Subject" allLabel="All subjects" options={SUBJECT_OPTIONS} value={subject} onChange={setSubject} />
            <Dropdown label="Grade" allLabel="All grades" options={GRADES} value={grade} onChange={setGrade} />
          </View>
          {(languages.data?.length ?? 0) > 1 && (
            <FilterRow items={languages.data!.map(l => ({ key: l.label, label: l.label }))} value={language} onChange={setLanguage} />
          )}
          {data && <Text style={[type.footnote, s.count]}>{data.total === 1 ? '1 BOOK' : `${data.total} BOOKS`}</Text>}
        </View>
      }
      ListEmptyComponent={<StateView loading={loading && !data} error={error} onRetry={reload} empty="No books match these filters." />}
      renderItem={({ item: b, index }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => nav.push({ name: 'Detail', bookId: b.id })}
          style={({ pressed }) => [s.cell, index === 0 && s.first, index === last && s.lastCell, pressed && { backgroundColor: colors.field }]}>
          <Cover color={coverColor(b)} uri={b.cover_url} w={36} h={50} />
          <View style={[s.cellMain, index !== last && s.separator]}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={type.headline} numberOfLines={2}>
                {b.title}
              </Text>
              <Text style={type.footnote} numberOfLines={1}>
                {b.subject ?? 'No subject'} · {gradeLabel(b)} · {b.language}
              </Text>
              <StatusPill available={b.available_quantity} condition={b.condition ?? undefined} />
            </View>
            <Text style={s.chevron}>›</Text>
          </View>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} keyboardShouldPersistTaps="handled">
      {items.map(item => (
        <Chip key={item.key} label={item.label} selected={value === item.key} onPress={() => onChange(value === item.key ? undefined : item.key)} />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xl },
  header: { gap: space.sm, marginBottom: space.sm },
  dropdowns: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.gutter },
  pad: { paddingHorizontal: space.gutter, marginBottom: space.xs },
  chips: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.gutter },
  count: { paddingHorizontal: space.gutter * 2, marginTop: space.md },
  cell: { marginHorizontal: space.gutter, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, gap: space.md },
  first: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  lastCell: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  cellMain: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingRight: space.md, gap: space.sm },
  separator: { borderBottomWidth: hairline, borderBottomColor: colors.line },
  chevron: { fontSize: 22, color: colors.faint },
});
