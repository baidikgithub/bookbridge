import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { api } from '../api';
import {
  Bar,
  CategoryRail,
  Chip,
  Cover,
  FeaturedBookCard,
  Icon,
  Row,
  Section,
  StateView,
  type CategoryItem,
} from '../components';
import { colors, space, type } from '../constants/theme';
import { useAsync } from '../hooks';
import type { Nav, User } from '../types';
import {
  coverColor,
  donationPerson,
  gradeLabel,
  initials,
  shortDate,
} from '../utils';

// Muted tints for the Services cards: a soft background with a deeper icon colour.
const TINTS = {
  green: { color: '#EAF4E2', ink: '#3B7D23' },
  sand: { color: '#F5EFE3', ink: '#8A6A2E' },
  sage: { color: '#E6EFEC', ink: '#3D6B5E' },
  stone: { color: '#ECEDF1', ink: '#4A5068' },
  rose: { color: '#F5EAEA', ink: '#8C4A4A' },
};

export function HomeScreen({
  nav,
  user,
  top,
}: {
  nav: Nav;
  user: User;
  top: number;
}) {
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        api.stats(1),
        api.listBooks({ limit: 3 }),
        api.listDonations({ limit: 3 }),
      ]).then(([stats, books, donations]) => ({
        stats,
        recent: books.data,
        donations: donations.data,
      })),
    [],
  );
  // Featured books, narrowed by the subject chip. Books with copies left come first.
  const [subject, setSubject] = useState<string | undefined>();
  const featured = useAsync(
    // Featured: only books with a copy the signed-in user currently owns.
    () => api.listBooks({ subject, owner: 'me', limit: 8 }),
    [subject],
  );
  const { width } = useWindowDimensions();
  const cardWidth = width - space.gutter * 2;
  const refresh = () => {
    reload();
    featured.reload();
  };

  const stats = data?.stats ?? null;
  const recent = data?.recent ?? [];
  const donations = data?.donations ?? [];
  const topSubjects = stats?.by_subject.slice(0, 4) ?? [];
  const max = topSubjects[0]?.count || 1;
  const admin = user.role === 'admin';
  const firstName = user.name.split(/\s+/)[0] || user.name;

  const shortcuts: CategoryItem[] = [
    {
      key: 'explore',
      label: 'Explore Books',
      icon: 'books',
      ...TINTS.green,
      detail: stats ? `${stats.titles} titles` : undefined,
      onPress: () => nav.tab('Inventory'),
    },
    {
      key: 'donations',
      label: 'Donations',
      icon: 'gift',
      ...TINTS.sand,
      detail: stats ? `${stats.donated} given` : undefined,
      onPress: () => nav.push({ name: 'Donations' }),
    },
    {
      key: 'mybooks',
      label: 'My Books',
      icon: 'hand',
      ...TINTS.rose,
      detail: 'Pass books on',
      onPress: () => nav.push({ name: 'MyBooks' }),
    },
    {
      key: 'drives',
      label: 'Collection Drives',
      icon: 'box',
      ...TINTS.sage,
      onPress: () => nav.push({ name: 'Drives' }),
    },
    ...(admin
      ? [
          {
            key: 'history',
            label: 'Transfer History',
            icon: 'layers' as const,
            ...TINTS.sage,
            detail: 'All donations',
            onPress: () => nav.push({ name: 'History' }),
          },
          {
            key: 'reports',
            label: 'Reports',
            icon: 'chart' as const,
            ...TINTS.stone,
            onPress: () => nav.tab('Reports'),
          },
          {
            key: 'users',
            label: 'Users & Roles',
            icon: 'users' as const,
            ...TINTS.rose,
            onPress: () => nav.push({ name: 'Users' }),
          },
        ]
      : []),
  ];

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: top }]}
      refreshControl={
        <RefreshControl refreshing={loading && !!data} onRefresh={refresh} />
      }
    >
      <View style={s.body}>
        <View style={s.header}>
          <View style={s.greeting}>
            <Text style={s.welcome}>Welcome,</Text>
            <Text style={s.name} numberOfLines={1}>
              {firstName} 👋
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recent activity"
            onPress={() => nav.push({ name: 'Donations' })}
            style={({ pressed }) => [s.circle, pressed && s.pressed]}
          >
            <Icon name="bell" size={22} />
            {donations.length > 0 && <View style={s.dot} />}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
            onPress={() => nav.tab('Profile')}
            style={({ pressed }) => [s.avatar, pressed && s.pressed]}
          >
            <Text style={s.avatarText}>{initials(user.name) || '?'}</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole={admin ? 'button' : undefined}
          disabled={!admin}
          onPress={() => nav.tab('Reports')}
          style={({ pressed }) => [s.impact, pressed && s.pressed]}
        >
          <View style={s.impactArt} pointerEvents="none">
            <Icon name="books" size={150} color="#16330B26" strokeWidth={0.9} />
          </View>
          <Text style={s.impactLabel}>Your total impact</Text>
          <Text style={s.impactValue}>
            {stats ? `${stats.donated.toLocaleString()} donated` : '—'}
          </Text>
          <Text style={s.impactSub}>
            {stats
              ? `${stats.total.toLocaleString()} books collected · ${stats.available.toLocaleString()} available`
              : 'Loading…'}
          </Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.bleed}
          contentContainerStyle={s.chips}
        >
          <Chip
            label="All"
            selected={!subject}
            onPress={() => setSubject(undefined)}
          />
          {(stats?.by_subject ?? []).map(x => (
            <Chip
              key={x.label}
              label={x.label}
              selected={subject === x.label}
              onPress={() =>
                setSubject(subject === x.label ? undefined : x.label)
              }
            />
          ))}
        </ScrollView>

        <View style={s.featured}>
          <View style={s.featuredHead}>
            <Text style={s.featuredTitle}>Featured</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => nav.tab('Inventory')}
              hitSlop={8}
            >
              <Text style={s.seeAll}>See all</Text>
            </Pressable>
          </View>
          {featured.data?.data.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.bleed}
              contentContainerStyle={s.carousel}
              decelerationRate="fast"
              snapToInterval={cardWidth + space.md}
            >
              {featured.data.data.map(b => (
                <FeaturedBookCard
                  key={b.id}
                  book={b}
                  width={cardWidth}
                  onPress={() => nav.push({ name: 'Detail', bookId: b.id })}
                />
              ))}
            </ScrollView>
          ) : (
            <StateView
              loading={featured.loading}
              error={featured.error}
              onRetry={featured.reload}
              empty={
                subject
                  ? `You don’t own any ${subject} books yet.`
                  : 'No books have been donated to you yet.'
              }
            />
          )}
        </View>

        <CategoryRail title="Services" items={shortcuts} />

        {!stats ? (
          <StateView loading={loading} error={error} onRetry={reload} />
        ) : stats.titles === 0 ? (
          <StateView empty="No books yet. Add your first book to get started." />
        ) : (
          <>
            <Section
              header="By subject"
              action={admin ? { label: 'Reports', onPress: () => nav.tab('Reports') } : undefined}
            >
              <View style={s.subjects}>
                {topSubjects.map(({ label, count }) => (
                  <View key={label} style={s.subjectRow}>
                    <Text
                      style={[type.subhead, s.subjectName]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                    <Bar pct={(count / max) * 100} />
                    <Text style={[type.subhead, s.subjectNum]}>
                      {count.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section
              header="Recently added"
              action={{ label: 'See All', onPress: () => nav.tab('Inventory') }}
            >
              {recent.map((b, i) => (
                <Row
                  key={b.id}
                  leading={
                    <Cover
                      color={coverColor(b)}
                      uri={b.cover_url}
                      w={32}
                      h={44}
                    />
                  }
                  title={b.title}
                  subtitle={`${b.subject ?? 'No subject'} · ${gradeLabel(
                    b,
                  )} · ×${b.quantity}`}
                  onPress={() => nav.push({ name: 'Detail', bookId: b.id })}
                  last={i === recent.length - 1}
                />
              ))}
            </Section>

            <Section
              header="Recent donations"
              action={{
                label: 'See All',
                onPress: () => nav.push({ name: 'Donations' }),
              }}
            >
              {donations.length === 0 ? (
                <Row title="No donations recorded yet" />
              ) : (
                donations.map((d, i) => (
                  <Row
                    key={d.id}
                    title={d.book_title}
                    subtitle={`${donationPerson(d)} · Grade ${d.grade} · ${
                      d.school
                    }`}
                    value={shortDate(d.donated_on)}
                    onPress={() =>
                      nav.push({ name: 'Detail', bookId: d.book_id })
                    }
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xl },
  body: {
    paddingHorizontal: space.gutter,
    gap: space.xl,
    paddingTop: space.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  greeting: { flex: 1 },
  welcome: { fontSize: 15, color: colors.muted },
  name: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 12,
    right: 13,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: colors.onPrimary },
  pressed: { opacity: 0.8 },
  impact: {
    backgroundColor: colors.primaryFill,
    borderRadius: 24,
    padding: space.xl,
    paddingVertical: space.xl + 4,
    overflow: 'hidden',
    gap: 4,
  },
  impactArt: { position: 'absolute', right: -6, bottom: -18 },
  impactLabel: { fontSize: 15, color: colors.onPrimary, opacity: 0.8 },
  impactValue: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  impactSub: { fontSize: 15, color: colors.onPrimary, opacity: 0.8 },
  bleed: { marginHorizontal: -space.gutter },
  chips: { gap: space.sm, paddingHorizontal: space.gutter },
  featured: { gap: space.md },
  featuredHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  seeAll: { fontSize: 15, fontWeight: '600', color: colors.primary },
  carousel: { gap: space.md, paddingHorizontal: space.gutter },
  subjects: { padding: space.lg, gap: space.md },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  subjectName: { width: 110 },
  subjectNum: {
    width: 44,
    textAlign: 'right',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
