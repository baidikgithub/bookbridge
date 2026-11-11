import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banner, Card, NavBar, Segmented, SectionLabel, StateView } from '../components';
import { api, useAsync, type Role, type User } from '../data';
import type { Nav } from '../nav';
import { colors, hairline, space, type } from '../theme';

const ROLES = ['Volunteer', 'Coordinator', 'Admin'] as const;
const toRole = (r: (typeof ROLES)[number]) => r.toLowerCase() as Role;
const toLabel = (r: Role) => ROLES.find(x => toRole(x) === r)!;

// Admin-only: change each account's role. Changes apply when that person next signs in.
export function UsersScreen({ nav, me, top }: { nav: Nav; me: User; top: number }) {
  const { data, error, loading, reload, setData } = useAsync(() => api.listUsers(), []);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const change = async (id: number, role: Role) => {
    setBusy(id);
    setMessage(null);
    try {
      const updated = await api.setRole(id, role);
      setData(list => list?.map(u => (u.id === id ? updated : u)) ?? null);
      setMessage({ ok: true, text: `${updated.name} is now ${role}. It applies when they next sign in.` });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[s.root, { paddingTop: top }]}>
      <NavBar title="Users" onBack={nav.back} />
      {!data ? (
        <StateView loading={loading} error={error} onRetry={reload} />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {message && <Banner tone={message.ok ? 'ok' : 'error'} text={message.text} />}
          <View>
            <SectionLabel>{data.length === 1 ? "1 account" : `${data.length} accounts`}</SectionLabel>
            <Card>
              {data.map((u, i) => (
                <View key={u.id} style={[s.user, i < data.length - 1 && s.separator, busy === u.id && { opacity: 0.5 }]}>
                  <View style={s.avatar}>
                    <Text style={s.initial}>{u.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, gap: space.sm }}>
                    <View>
                      <Text style={type.headline}>
                        {u.name}
                        {u.id === me.id ? ' (you)' : ''}
                      </Text>
                      <Text style={type.footnote}>{u.email}</Text>
                    </View>
                    {u.id === me.id ? (
                      <Text style={type.footnote}>Role: {toLabel(u.role)}. You can’t change your own role.</Text>
                    ) : (
                      <Segmented
                        options={[...ROLES]}
                        value={toLabel(u.role)}
                        onChange={r => busy === null && toRole(r) !== u.role && change(u.id, toRole(r))}
                      />
                    )}
                  </View>
                </View>
              ))}
            </Card>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.gutter, paddingTop: space.sm, gap: space.lg },
  user: { flexDirection: 'row', gap: space.md, padding: space.md, paddingLeft: space.lg },
  separator: { borderBottomWidth: hairline, borderBottomColor: colors.line },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 15, fontWeight: '600', color: colors.primaryInk },
});
