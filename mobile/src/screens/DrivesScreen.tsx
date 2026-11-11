import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Banner, Card, Field, NavBar, PrimaryButton, Row, Section, SectionLabel, StateView } from '../components';
import { api, useAsync, type User } from '../data';
import type { Nav } from '../nav';
import { colors, space } from '../theme';

// Drives can be planned ahead, so future dates are fine; the value only has to be a real date.
const validDate = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m && new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return !!d && d.getDate() === Number(m![3]) && d.getMonth() === Number(m![2]) - 1;
};

const range = (a: string | null, b: string | null) => (a && b ? `${a} → ${b}` : a ? `From ${a}` : b ? `Until ${b}` : 'No dates set');

// Collection drives group books by the event they were collected at. Coordinators and admins can create them.
export function DrivesScreen({ nav, user, top }: { nav: Nav; user: User; top: number }) {
  const { data, error, loading, reload } = useAsync(() => api.listDrives(), []);
  const canCreate = user.role === 'coordinator' || user.role === 'admin';
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const create = async () => {
    if (saving) {
      return;
    }
    if (!name.trim()) {
      setMessage({ ok: false, text: 'Give the drive a name.' });
      return;
    }
    for (const v of [start, end]) {
      if (v.trim() && !validDate(v.trim())) {
        setMessage({ ok: false, text: 'Dates must be written YYYY-MM-DD.' });
        return;
      }
    }
    setSaving(true);
    setMessage(null);
    try {
      const d = await api.createDrive({ name: name.trim(), starts_on: start.trim() || undefined, ends_on: end.trim() || undefined });
      setName('');
      setStart('');
      setEnd('');
      setMessage({ ok: true, text: `“${d.name}” created. Pick it when adding books.` });
      reload();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[s.root, { paddingTop: top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavBar title="Collection Drives" onBack={nav.back} />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {message && <Banner tone={message.ok ? 'ok' : 'error'} text={message.text} />}

        {!data ? (
          <StateView loading={loading} error={error} onRetry={reload} />
        ) : data.length === 0 ? (
          <StateView empty={canCreate ? 'No drives yet. Create one below.' : 'No collection drives yet.'} />
        ) : (
          <View>
            <SectionLabel>{data.length === 1 ? "1 drive" : `${data.length} drives`}</SectionLabel>
            <Card>
              {data.map((d, i) => (
                <Row
                  key={d.id}
                  title={d.name}
                  subtitle={range(d.starts_on, d.ends_on)}
                  value={`${d.copies} ${d.copies === 1 ? 'book' : 'books'}`}
                  onPress={() => nav.push({ name: 'DriveBooks', drive: { id: d.id, name: d.name } })}
                  last={i === data.length - 1}
                />
              ))}
            </Card>
          </View>
        )}

        {canCreate && (
          <>
            <Section header="New drive" footer="Dates are optional, written YYYY-MM-DD.">
              <Field label="Name" value={name} onChange={setName} placeholder="e.g. Winter Book Drive" autoCapitalize="words" />
              <Field label="Starts" value={start} onChange={setStart} placeholder="YYYY-MM-DD" keyboard="numbers-and-punctuation" />
              <Field label="Ends" value={end} onChange={setEnd} placeholder="YYYY-MM-DD" keyboard="numbers-and-punctuation" last />
            </Section>
            <PrimaryButton label={saving ? 'Creating…' : 'Create Drive'} onPress={create} disabled={saving} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.gutter, paddingTop: space.sm, gap: space.lg, paddingBottom: space.xl },
});
