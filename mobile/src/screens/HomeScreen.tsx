import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bar, Card, Cover, PrimaryButton, Row, Section, StateView } from '../components';
import { api, coverColor, gradeLabel, shortDate, useAsync, type User } from '../data';
import type { Nav } from '../nav';
import { colors, space, type } from '../theme';

export function HomeScreen({ nav, user, top }: { nav: Nav; user: User; top: number }) {
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([api.stats(1), api.listBooks({ limit: 3 }), api.listDonations({ limit: 3 })]).then(
        ([stats, books, donations]) => ({ stats, recent: books.data, donations: donations.data }),
      ),
    [],
  );
  const stats = data?.stats ?? null;
  const recent = data?.recent ?? [];
  const donations = data?.donations ?? [];
  const topSubjects = stats?.by_subject.slice(0, 4) ?? [];
  const max = topSubjects[0]?.count || 1;
  const availPct = stats && stats.total ? (stats.available / stats.total) * 100 : 0;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: top }]}
      refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} />}>
      <View style={s.body}>
        <Card style={s.summary}>
          <Text style={type.footnote}>Total books collected</Text>
          <Text style={s.bigNum}>{stats ? stats.total.toLocaleString() : '—'}</Text>
          <Bar pct={availPct} color={colors.primary} height={6} />
          <View style={s.legendRow}>
            <Legend dot={colors.primary} label="Available" value={stats?.available} />
            <Legend dot={colors.track} label="Donated" value={stats?.donated} />
          </View>
        </Card>

        <View style={s.actions}>
          <PrimaryButton label="Add Book" onPress={() => nav.push({ name: 'Scan' })} style={{ flex: 1 }} />
          <PrimaryButton label="Donate Book" tone="accent" onPress={() => nav.tab('Inventory')} style={{ flex: 1 }} />
        </View>

        {!stats ? (
          <StateView loading={loading} error={error} onRetry={reload} />
        ) : stats.titles === 0 ? (
          <StateView empty="No books yet. Add your first book to get started." />
        ) : (
          <>
            <Section header="By subject" action={{ label: 'Reports', onPress: () => nav.tab('Reports') }}>
              <View style={s.subjects}>
                {topSubjects.map(({ label, count }) => (
                  <View key={label} style={s.subjectRow}>
                    <Text style={[type.subhead, s.subjectName]} numberOfLines={1}>
                      {label}
                    </Text>
                    <Bar pct={(count / max) * 100} />
                    <Text style={[type.subhead, s.subjectNum]}>{count.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section header="Recently added" action={{ label: 'See All', onPress: () => nav.tab('Inventory') }}>
              {recent.map((b, i) => (
                <Row
                  key={b.id}
                  leading={<Cover color={coverColor(b)} uri={b.cover_url} w={32} h={44} />}
                  title={b.title}
                  subtitle={`${b.subject ?? 'No subject'} · ${gradeLabel(b)} · ×${b.quantity}`}
                  onPress={() => nav.push({ name: 'Detail', bookId: b.id })}
                  last={i === recent.length - 1}
                />
              ))}
            </Section>

            <Section header="Manage">
              <Row title="Donations" onPress={() => nav.push({ name: 'Donations' })} />
              <Row title="Collection drives" onPress={() => nav.push({ name: 'Drives' })} last={user.role !== 'admin'} />
              {user.role === 'admin' && <Row title="Users and roles" onPress={() => nav.push({ name: 'Users' })} last />}
            </Section>

            <Section header="Recent donations" action={{ label: 'See All', onPress: () => nav.push({ name: 'Donations' }) }}>
              {donations.length === 0 ? (
                <Row title="No donations recorded yet" />
              ) : (
                donations.map((d, i) => (
                  <Row
                    key={d.id}
                    title={d.book_title}
                    subtitle={`${d.child_name} · Grade ${d.grade} · ${d.school}`}
                    value={shortDate(d.donated_on)}
                    onPress={() => nav.push({ name: 'Detail', bookId: d.book_id })}
                    last={i === donations.length - 1}
                  />
                ))
              )}
            </Section>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Legend({ dot, label, value }: { dot: string; label: string; value?: number }) {
  return (
    <View style={s.legend}>
      <View style={[s.dot, { backgroundColor: dot }]} />
      <Text style={type.footnote}>{label}</Text>
      <Text style={[type.subhead, { fontWeight: '600' }]}>{value != null ? value.toLocaleString() : '—'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xl },
  body: { paddingHorizontal: space.gutter, gap: space.xl, paddingTop: space.md },
  summary: { padding: space.lg, gap: space.sm },
  bigNum: { fontSize: 40, lineHeight: 46, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  legendRow: { flexDirection: 'row', gap: space.xl, marginTop: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: -space.sm },
  subjects: { padding: space.lg, gap: space.md },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  subjectName: { width: 110 },
  subjectNum: { width: 44, textAlign: 'right', fontWeight: '600', fontVariant: ['tabular-nums'] },
});
