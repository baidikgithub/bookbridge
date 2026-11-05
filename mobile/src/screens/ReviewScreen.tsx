import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Chip, PrimaryButton, SectionLabel, styles as cs } from '../components';
import { ApiError, api, CONDITIONS, SUBJECTS } from '../data';
import type { Nav } from '../nav';
import { colors } from '../theme';

// New-book form. Fields start empty; AI recognition will prefill them once it exists.
export function ReviewScreen({ nav, top, bottom }: { nav: Nav; top: number; bottom: number }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [language, setLanguage] = useState('English');
  const [gradeFrom, setGradeFrom] = useState('');
  const [gradeTo, setGradeTo] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<number | null>(null);

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

  const save = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setDuplicateId(null);
    try {
      const book = await api.createBook({
        title: title.trim(),
        author: author.trim() || undefined,
        isbn: isbn.trim() || undefined,
        language: language.trim() || undefined,
        subject: subject ?? undefined,
        condition: condition ?? undefined,
        grade_from: num(gradeFrom),
        grade_to: num(gradeTo),
        quantity: qty,
        description: description.trim() || undefined,
      });
      nav.push({ name: 'Detail', bookId: book.id });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.body?.existing_id) {
        setDuplicateId(e.body.existing_id);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: top }]}>
      <View style={s.nav}>
        <Pressable onPress={nav.back} hitSlop={12}>
          <Text style={s.navLink}>Cancel</Text>
        </Pressable>
        <Text style={s.navTitle}>Book details</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {duplicateId != null && (
          <Pressable style={s.notice} onPress={() => nav.push({ name: 'Detail', bookId: duplicateId })}>
            <Text style={s.noticeText}>
              <Text style={{ fontWeight: '700' }}>Already in inventory. </Text>A book with this ISBN exists. Tap to open it and update its quantity.
            </Text>
          </Pressable>
        )}
        {error && <Text style={s.error}>{error}</Text>}

        <Card>
          <Field label="Title" value={title} onChange={setTitle} placeholder="Required" />
          <Field label="Author" value={author} onChange={setAuthor} placeholder="Optional" />
          <Field label="ISBN" value={isbn} onChange={setIsbn} placeholder="Optional" keyboard="numbers-and-punctuation" />
          <Field label="Language" value={language} onChange={setLanguage} placeholder="English" />
          <Field label="Grade from" value={gradeFrom} onChange={setGradeFrom} placeholder="e.g. 7" keyboard="number-pad" />
          <Field label="Grade to" value={gradeTo} onChange={setGradeTo} placeholder="e.g. 9" keyboard="number-pad" />
          <View style={cs.kvRow}>
            <Text style={cs.kvKey}>Quantity</Text>
            <View style={s.stepper}>
              <Pressable accessibilityLabel="Decrease" onPress={() => setQty(q => Math.max(1, q - 1))} style={s.stepBtn}>
                <Text style={s.stepText}>−</Text>
              </Pressable>
              <Text style={s.qty}>{qty}</Text>
              <Pressable accessibilityLabel="Increase" onPress={() => setQty(q => q + 1)} style={s.stepBtn}>
                <Text style={s.stepText}>+</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        <View>
          <SectionLabel>Subject</SectionLabel>
          <View style={s.chips}>
            {SUBJECTS.map(x => (
              <Chip key={x} label={x} selected={subject === x} onPress={() => setSubject(subject === x ? null : x)} />
            ))}
          </View>
        </View>

        <View>
          <SectionLabel>Condition</SectionLabel>
          <View style={s.chips}>
            {CONDITIONS.map(x => (
              <Chip key={x} label={x} selected={condition === x} onPress={() => setCondition(condition === x ? null : x)} />
            ))}
          </View>
        </View>

        <View>
          <SectionLabel>Description</SectionLabel>
          <Card style={{ padding: 12 }}>
            <TextInput
              accessibilityLabel="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Short summary of the book"
              placeholderTextColor="#9AA3AE"
              multiline
              style={s.desc}
            />
          </Card>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: bottom + 12 }}>
        <PrimaryButton label={saving ? 'Saving…' : 'Add to inventory'} onPress={() => !saving && save()} />
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboard?: 'number-pad' | 'numbers-and-punctuation';
}) {
  return (
    <View style={[cs.kvRow, cs.kvBorder, { gap: 12 }]}>
      <Text style={cs.kvKey}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9AA3AE"
        keyboardType={keyboard}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 44 },
  navLink: { fontSize: 17, color: colors.primary },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  content: { padding: 20, gap: 16 },
  notice: { backgroundColor: colors.noticeBg, borderRadius: 14, padding: 14 },
  noticeText: { fontSize: 13, lineHeight: 18, color: colors.noticeInk },
  error: { fontSize: 14, color: colors.warnInk },
  input: { flex: 1, textAlign: 'right', fontSize: 15, fontWeight: '500', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.track, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: colors.ink },
  qty: { minWidth: 16, textAlign: 'center', fontSize: 15, fontWeight: '600', color: colors.ink },
  desc: { minHeight: 80, fontSize: 14, lineHeight: 21, color: colors.inkSoft, textAlignVertical: 'top' },
});
