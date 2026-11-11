import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banner, Chip, Cover, Field, NavBar, PrimaryButton, Section, TextButton } from '../components';
import { api, coverColor, isPastDate, today, useAsync, type Book } from '../data';
import { colors, space, type } from '../theme';

// Records who received one copy. The server lowers available copies and saves the recipient together.
export function DonateSheet({
  visible,
  book,
  onCancel,
  onDonated,
}: {
  visible: boolean;
  book: Book;
  onCancel: () => void;
  onDonated: () => void;
}) {
  const [child, setChild] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [date, setDate] = useState(today());
  const schools = useAsync(() => (visible ? api.listSchools() : Promise.resolve([])), [visible]);
  const typed = school.trim().toLowerCase();
  // Saved schools matching what's typed, most-used first; hidden once the name matches exactly.
  const suggestions = (schools.data ?? [])
    .filter(x => x.name.toLowerCase().includes(typed) && x.name.toLowerCase() !== typed)
    .slice(0, 6);
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = book.available_quantity;

  const confirm = async () => {
    if (saving || available < 1) {
      return;
    }
    const g = Number(grade);
    if (!child.trim() || !school.trim()) {
      setError('Enter the child’s name and school.');
      return;
    }
    if (grade.trim() === '' || !Number.isInteger(g) || g < 0 || g > 12) {
      setError('Grade must be a number from 0 (kindergarten) to 12.');
      return;
    }
    if (!isPastDate(date)) {
      setError('Date must be today or earlier, written YYYY-MM-DD.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.donate({ book_id: book.id, child_name: child.trim(), grade: g, school: school.trim(), donated_on: date });
      setChild('');
      setGrade('');
      setSchool('');
      setDate(today());
      onDonated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.grabber} />
        <NavBar
          title="Donate Book"
          onBack={onCancel}
          backLabel="Cancel"
          right={<TextButton label={saving ? 'Saving…' : 'Done'} bold onPress={confirm} />}
        />

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Section>
            <View style={s.book}>
              <Cover color={coverColor(book)} uri={book.cover_url} w={32} h={44} />
              <View style={{ flex: 1 }}>
                <Text style={type.headline} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={type.footnote}>
                  {available} available → {available - 1} after donation
                </Text>
              </View>
            </View>
          </Section>

          <Section header="Recipient">
            <Field label="Child’s name" value={child} onChange={setChild} placeholder="Required" autoCapitalize="words" />
            <Field label="Grade" value={grade} onChange={setGrade} placeholder="0–12" keyboard="number-pad" />
            <Field label="School" value={school} onChange={setSchool} placeholder="Search or add" autoCapitalize="words" last />
          </Section>
          {suggestions.length > 0 && (
            <View style={s.chips}>
              {suggestions.map(x => (
                <Chip key={x.id} label={x.name} selected={false} onPress={() => setSchool(x.name)} />
              ))}
            </View>
          )}

          <Section header="Date" footer="One copy moves from Available to Donated. New schools are saved for next time.">
            <Field label="Donated on" value={date} onChange={setDate} placeholder="YYYY-MM-DD" keyboard="numbers-and-punctuation" last />
          </Section>
          <View style={s.chips}>
            <Chip label="Today" selected={date === today()} onPress={() => setDate(today())} />
            <Chip label="Yesterday" selected={date === yesterday} onPress={() => setDate(yesterday)} />
          </View>
          {error && <Banner tone="error" text={error} />}
        </ScrollView>

        <View style={s.footer}>
          <PrimaryButton label={saving ? 'Saving…' : 'Confirm Donation'} tone="accent" onPress={confirm} disabled={saving} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.border, marginTop: 6 },
  content: { padding: space.gutter, paddingTop: space.sm, gap: space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: -space.sm },
  book: { flexDirection: 'row', gap: space.md, alignItems: 'center', padding: space.md, paddingLeft: space.lg },
  footer: { paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.xl },
});
