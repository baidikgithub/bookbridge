import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, NavBar, Row, SectionLabel, StateView } from '../components';
import { api, shortDate, useAsync } from '../data';
import type { Nav } from '../nav';
import { colors, space } from '../theme';

// Newest 100 donations; paging can come later if the list grows.
export function DonationsScreen({ nav, top }: { nav: Nav; top: number }) {
  const { data, error, loading, reload } = useAsync(() => api.listDonations({ limit: 100 }), []);
  const items = data?.data ?? [];

  return (
    <View style={[s.root, { paddingTop: top }]}>
      <NavBar title="Donations" onBack={nav.back} />
      {!data ? (
        <StateView loading={loading} error={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <StateView empty="No donations recorded yet. Open a book and tap Donate Book." />
      ) : (
        <FlatList
          data={[0]}
          keyExtractor={() => 'list'}
          contentContainerStyle={s.content}
          onRefresh={reload}
          refreshing={loading}
          renderItem={() => (
            <View>
              <SectionLabel>{`${data.total} recorded`}</SectionLabel>
              <Card>
                {items.map((d, i) => (
                  <Row
                    key={d.id}
                    title={d.book_title}
                    subtitle={`${d.child_name} · Grade ${d.grade} · ${d.school}${d.volunteer_name ? ` · by ${d.volunteer_name}` : ''}`}
                    value={shortDate(d.donated_on)}
                    onPress={() => nav.push({ name: 'Detail', bookId: d.book_id })}
                    last={i === items.length - 1}
                  />
                ))}
              </Card>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.gutter, paddingTop: space.sm },
});
