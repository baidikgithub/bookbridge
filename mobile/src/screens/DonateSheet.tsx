import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Cover, PrimaryButton } from '../components';
import { api, coverColor, type Book } from '../data';
import { colors } from '../theme';

// Marks one copy as donated by lowering available_quantity.
// Recipient details (child, school, grade) come back once donations are recorded on the server.
export function DonateSheet({
  visible,
  book,
  onCancel,
  onDonated,
}: {
  visible: boolean;
  book: Book;
  onCancel: () => void;
  onDonated: (updated: Book) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = book.available_quantity;

  const confirm = async () => {
    if (saving || available < 1) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onDonated(await api.updateBook(book.id, { available_quantity: available - 1 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={s.root}>
        <View style={s.nav}>
          <Pressable onPress={onCancel} hitSlop={12}>
            <Text style={s.navLink}>Cancel</Text>
          </Pressable>
          <Text style={s.navTitle}>Donate book</Text>
          <View style={{ width: 54 }} />
        </View>

        <View style={s.content}>
          <Card style={s.book}>
            <Cover color={coverColor(book)} uri={book.cover_url} w={36} h={50} />
            <View style={{ flex: 1 }}>
              <Text style={s.bookTitle}>{book.title}</Text>
              <Text style={s.muted}>
                {available} available → {available - 1} after donation
              </Text>
            </View>
          </Card>
          {error && <Text style={s.error}>{error}</Text>}
        </View>

        <View style={s.footer}>
          <Text style={s.footNote}>One copy moves from Available to Donated</Text>
          <PrimaryButton
            label={saving ? 'Saving…' : 'Confirm donation'}
            tone="accent"
            onPress={confirm}
            style={{ opacity: saving ? 0.5 : 1 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  navLink: { fontSize: 17, color: colors.primary },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  content: { flex: 1, padding: 20, paddingTop: 4, gap: 16 },
  book: { padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  bookTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  muted: { fontSize: 13, color: colors.muted, marginTop: 2 },
  error: { fontSize: 14, color: colors.warnInk },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 10 },
  footNote: { fontSize: 13, color: colors.muted, textAlign: 'center' },
});
