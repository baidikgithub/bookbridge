import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Banner, Chip, Cover, DateField, Dropdown, Field, NavBar, PrimaryButton, Section, TextButton } from '../components';
import { colors, space, type } from '../constants/theme';
import { useAsync } from '../hooks';
import type { Book } from '../types';
import { coverColor, isPastDate, today } from '../utils';

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
  const [volunteerId, setVolunteerId] = useState<string | undefined>(undefined);
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [date, setDate] = useState(today());
  const schools = useAsync(() => (visible ? api.listSchools() : Promise.resolve([])), [visible]);
  // Admins can assign a copy to any registered user; reloaded each time the sheet opens.
  const volunteers = useAsync(() => (visible ? api.listUsers() : Promise.resolve([])), [visible]);
  const volunteerOptions = (volunteers.data ?? []).map(u => ({ value: String(u.id), label: u.role === 'admin' ? `${u.name} (admin)` : u.name }));
  const typed = school.trim().toLowerCase();
  // Saved schools matching what's typed, most-used first; hidden once the name matches exactly.
  const suggestions = (schools.data ?? [])
    .filter(x => x.name.toLowerCase().includes(typed) && x.name.toLowerCase() !== typed)
    .slice(0, 6);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = book.available_quantity;

  const confirm = async () => {
    if (saving || available < 1) {
      return;
    }
    const g = Number(grade);
    if (!volunteerId) {
      setError('Choose who receives the book.');
      return;
    }
    if (!school.trim()) {
      setError('Enter the school.');
      return;
    }
    if (grade.trim() === '' || !Number.isInteger(g) || g < 0 || g > 12) {
      setError('Grade must be a number from 0 (kindergarten) to 12.');
      return;
    }
    if (!isPastDate(date)) {
      setError('Date must be today or earlier.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.donate({ book_id: book.id, volunteer_id: Number(volunteerId), grade: g, school: school.trim(), donated_on: date });
      setVolunteerId(undefined);
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

          <Section header="Assign to" footer={volunteers.error ? `Couldn’t load users: ${volunteers.error}` : 'They become the book’s owner and see it in their Featured section.'}>
            <View style={s.dropdownRow}>
              <Dropdown
                label="Recipient"
                allLabel={volunteers.loading ? 'Loading…' : 'Choose a user'}
                options={volunteerOptions}
                value={volunteerId}
                onChange={setVolunteerId}
              />
            </View>
          </Section>

          <Section header="Recipient">
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
            <DateField label="Donated on" value={date} onChange={setDate} />
          </Section>
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
  dropdownRow: { flexDirection: 'row', padding: space.md },
  book: { flexDirection: 'row', gap: space.md, alignItems: 'center', padding: space.md, paddingLeft: space.lg },
  footer: { paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.xl },
});
