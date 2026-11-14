import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { launchCamera, launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { api, ApiError } from '../api';
import { Banner, Chip, Dropdown, Field, NavBar, PrimaryButton, Section, SectionLabel, Stepper, TextButton } from '../components';
import { CONDITIONS, SUBJECTS } from '../constants';
import { colors, hairline, radius, space, type } from '../constants/theme';
import { useAsync } from '../hooks';
import type { Nav, Photo } from '../types';

const SUBJECT_OPTIONS = SUBJECTS.map(x => ({ value: x, label: x }));

// New-book form. Fields start empty; AI recognition will prefill them once it exists.
export function ReviewScreen({
  nav,
  top,
  bottom,
  isbn: scannedIsbn,
  photo: initialPhoto,
}: {
  nav: Nav;
  top: number;
  bottom: number;
  isbn?: string;
  photo?: Photo;
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState(scannedIsbn ?? '');
  const [photo, setPhoto] = useState<Photo | undefined>(initialPhoto);
  const [driveId, setDriveId] = useState<number | null>(null);
  const drives = useAsync(() => api.listDrives(), []);
  const [language, setLanguage] = useState('English');
  const [gradeFrom, setGradeFrom] = useState('');
  const [gradeTo, setGradeTo] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState<false | 'photo' | 'book'>(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<number | null>(null);

  // Both open in place, so anything already typed in the form is kept.
  const opts = { mediaType: 'photo', maxWidth: 1600, maxHeight: 1600, quality: 0.8 } as const;
  const pickPhoto = async () => applyPicked(await launchImageLibrary({ ...opts, selectionLimit: 1 }));
  const takePhoto = async () => applyPicked(await launchCamera({ ...opts, saveToPhotos: false }));
  const applyPicked = (res: ImagePickerResponse) => {
    const a = res.assets?.[0];
    if (a?.uri) {
      setPhoto({ uri: a.uri, type: a.type, fileName: a.fileName });
    } else if (res.errorMessage) {
      setError(res.errorMessage);
    }
  };

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

  const save = async () => {
    if (saving) {
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(photo ? 'photo' : 'book');
    setError(null);
    setDuplicateId(null);
    try {
      const coverUrl = photo ? await api.uploadImage(photo) : undefined;
      setSaving('book');
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
        cover_url: coverUrl,
        drive_id: driveId ?? undefined,
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
    <KeyboardAvoidingView style={[s.root, { paddingTop: top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavBar
        title="New Book"
        onBack={nav.back}
        backLabel="Cancel"
        right={<TextButton label={saving ? 'Saving…' : 'Save'} bold onPress={save} />}
      />

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {duplicateId != null && (
          <Banner
            text="Already in inventory. A book with this ISBN exists — tap to open it and update its quantity."
            onPress={() => nav.push({ name: 'Detail', bookId: duplicateId })}
          />
        )}
        {error && <Banner tone="error" text={error} />}

        <Section header="Cover photo">
          <View style={s.photoRow}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={s.photo} resizeMode="cover" accessibilityLabel="Cover photo" />
            ) : (
              <View style={[s.photo, s.photoEmpty]}>
                <Text style={type.caption}>No photo</Text>
              </View>
            )}
            <View style={{ flex: 1, gap: space.sm }}>
              <Pressable accessibilityRole="button" onPress={takePhoto} hitSlop={8}>
                <Text style={s.link}>{photo ? 'Retake Photo' : 'Take Photo'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={pickPhoto} hitSlop={8}>
                <Text style={s.link}>Choose from Library</Text>
              </Pressable>
              {photo && (
                <Pressable accessibilityRole="button" onPress={() => setPhoto(undefined)} hitSlop={8}>
                  <Text style={[s.link, { color: colors.danger }]}>Remove Photo</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Section>

        <Section header="Book">
          <Field label="Title" value={title} onChange={setTitle} placeholder="Required" autoCapitalize="words" />
          <Field label="Author" value={author} onChange={setAuthor} placeholder="Optional" autoCapitalize="words" />
          <Field label="ISBN" value={isbn} onChange={setIsbn} placeholder="Optional" keyboard="numbers-and-punctuation" />
          <Field label="Language" value={language} onChange={setLanguage} placeholder="English" last />
        </Section>

        <Section header="Stock" footer="Grades run from 0 (kindergarten) to 12.">
          <Field label="Grade from" value={gradeFrom} onChange={setGradeFrom} placeholder="e.g. 7" keyboard="number-pad" />
          <Field label="Grade to" value={gradeTo} onChange={setGradeTo} placeholder="e.g. 9" keyboard="number-pad" />
          <View style={s.qtyRow}>
            <Text style={type.body}>Quantity</Text>
            <View style={s.qtyRight}>
              <Text style={[type.body, s.qty]}>{qty}</Text>
              <Stepper value={qty} onChange={setQty} />
            </View>
          </View>
        </Section>

        <View style={s.dropdownRow}>
          <Dropdown
            label="Subject"
            allLabel="Choose a subject"
            options={SUBJECT_OPTIONS}
            value={subject ?? undefined}
            onChange={v => setSubject(v ?? null)}
          />
        </View>

        {(drives.data?.length ?? 0) > 0 && (
          <View>
            <SectionLabel>Collection drive</SectionLabel>
            <View style={s.chips}>
              {drives.data!.map(d => (
                <Chip key={d.id} label={d.name} selected={driveId === d.id} onPress={() => setDriveId(driveId === d.id ? null : d.id)} />
              ))}
            </View>
          </View>
        )}

        <View>
          <SectionLabel>Condition</SectionLabel>
          <View style={s.chips}>
            {CONDITIONS.map(x => (
              <Chip key={x} label={x} selected={condition === x} onPress={() => setCondition(condition === x ? null : x)} />
            ))}
          </View>
        </View>

        <Section header="Description">
          <TextInput
            accessibilityLabel="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Short summary of the book"
            placeholderTextColor={colors.faint}
            multiline
            style={s.desc}
          />
        </Section>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: bottom + space.md }]}>
        <PrimaryButton label={saving === 'photo' ? 'Uploading photo…' : saving ? 'Saving…' : 'Add to Inventory'} onPress={save} disabled={!!saving} />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.gutter, paddingTop: space.sm, gap: space.xl },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, minHeight: 50 },
  qtyRight: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  qty: { minWidth: 20, textAlign: 'right', fontVariant: ['tabular-nums'] },
  dropdownRow: { flexDirection: 'row' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: space.xs },
  desc: { minHeight: 88, fontSize: 17, lineHeight: 22, color: colors.ink, padding: space.lg, paddingTop: space.md, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', gap: space.lg, alignItems: 'center', padding: space.md, paddingLeft: space.lg },
  photo: { width: 72, height: 100, borderRadius: radius.sm, backgroundColor: colors.field },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  link: { fontSize: 17, color: colors.primary },
  footer: { paddingHorizontal: space.gutter, paddingTop: space.md, borderTopWidth: hairline, borderTopColor: colors.line },
});
