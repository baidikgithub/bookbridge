import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bar, Card, Cover, StateView } from '../components';
import { api, computeStats, coverColor, gradeLabel, useAsync } from '../data';
import type { Nav } from '../nav';
import { colors, fonts, radius } from '../theme';

export function HomeScreen({ nav, top }: { nav: Nav; top: number }) {
  const { data, error, loading, reload } = useAsync(
    () => api.allBooks().then(books => ({
        stats: computeStats(books, 1),
        recent: [...books].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3),
      })),
    [],
  );
  const stats = data?.stats ?? null;
  const recent = data?.recent ?? [];
  const topSubjects = stats?.by_subject.slice(0, 4) ?? [];
  const max = topSubjects[0]?.count || 1;
  const availPct = stats && stats.total ? Math.round((stats.available / stats.total) * 100) : 0;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: top + 16 }]}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} />}>
      <Text style={s.title}>BookBridge</Text>

      <View style={s.hero}>
        <Text style={s.heroLabel}>Total books collected</Text>
        <Text style={s.heroNum}>{stats ? stats.total.toLocaleString() : '—'}</Text>
        <View style={s.split}>
          <View style={{ width: `${availPct}%`, backgroundColor: '#7C93FF' }} />
          <View style={{ flex: 1, backgroundColor: stats?.donated ? '#FFB25C' : '#2E3A48' }} />
        </View>
        <View style={s.heroRow}>
          <HeroStat dot="#7C93FF" label="Available" value={stats?.available} />
          <HeroStat dot="#FFB25C" label="Donated" value={stats?.donated} />
        </View>
      </View>

      <View style={s.actions}>
        <Pressable accessibilityRole="button" onPress={() => nav.push({ name: 'Scan' })} style={[s.action, { backgroundColor: colors.primary }]}>
          <Text style={[s.actionGlyph, { color: '#FFFFFF' }]}>▥</Text>
          <Text style={[s.actionText, { color: '#FFFFFF' }]}>Add a book</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => nav.tab('Inventory')} style={[s.action, { backgroundColor: colors.surface }]}>
          <Text style={[s.actionGlyph, { color: colors.accent }]}>♡</Text>
          <Text style={s.actionText}>Donate a book</Text>
        </Pressable>
      </View>

      {!stats ? (
        <StateView loading={loading} error={error} onRetry={reload} />
      ) : stats.titles === 0 ? (
        <StateView empty="No books yet. Add your first book to get started." />
      ) : (
        <>
          <Card style={s.subjects}>
            <View style={s.rowBetween}>
              <Text style={s.h2}>By subject</Text>
              <Pressable onPress={() => nav.tab('Reports')} hitSlop={12}>
                <Text style={s.link}>Reports</Text>
              </Pressable>
            </View>
            {topSubjects.map(({ label: name, count: n }) => (
              <View key={name} style={s.subjectRow}>
                <Text style={s.subjectName} numberOfLines={1}>
                  {name}
                </Text>
                <Bar pct={(n / max) * 100} />
                <Text style={s.subjectNum}>{n.toLocaleString()}</Text>
              </View>
            ))}
          </Card>

          <Text style={s.h2}>Recently added</Text>
          {recent.map(b => (
            <Pressable key={b.id} onPress={() => nav.push({ name: 'Detail', bookId: b.id })}>
              <Card style={s.recent}>
                <Cover color={coverColor(b)} uri={b.cover_url} />
                <View style={{ flex: 1 }}>
                  <Text style={s.bookTitle}>{b.title}</Text>
                  <Text style={s.meta}>
                    {b.subject ?? 'No subject'} · {gradeLabel(b)} · ×{b.quantity}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function HeroStat({ dot, label, value }: { dot: string; label: string; value?: number }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
        <Text style={s.heroLabel}>{label}</Text>
      </View>
      <Text style={s.heroStat}>{value != null ? value.toLocaleString() : '—'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 18 },
  title: { fontFamily: fonts.display, fontSize: 32, fontWeight: '600', color: colors.ink },
  hero: { backgroundColor: colors.dark, borderRadius: radius.xxl, padding: 20, gap: 14 },
  heroLabel: { fontSize: 13, color: '#B9C2CE', fontWeight: '500' },
  heroNum: { fontFamily: fonts.display, fontSize: 48, fontWeight: '600', color: '#FFFFFF' },
  split: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  heroRow: { flexDirection: 'row', gap: 12 },
  heroStat: { fontSize: 20, fontWeight: '600', color: '#FFFFFF' },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, borderRadius: radius.xl, padding: 16, minHeight: 96, justifyContent: 'space-between' },
  actionGlyph: { fontSize: 24 },
  actionText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  subjects: { padding: 16, gap: 12, borderRadius: radius.xl },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  h2: { fontSize: 17, fontWeight: '600', color: colors.ink },
  link: { fontSize: 14, fontWeight: '500', color: colors.primary },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subjectName: { width: 104, fontSize: 14, color: colors.inkSoft },
  subjectNum: { width: 48, textAlign: 'right', fontSize: 14, fontWeight: '600', color: colors.ink },
  recent: { padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  bookTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
