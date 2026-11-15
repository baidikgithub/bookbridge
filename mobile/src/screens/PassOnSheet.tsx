import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import {
  Banner,
  DateField,
  Dropdown,
  NavBar,
  PrimaryButton,
  Section,
  TextButton,
} from '../components';
import { colors, space, type } from '../constants/theme';
import { useAsync } from '../hooks';
import type { Donation } from '../types';
import { today } from '../utils';

// Hands a donated copy the signed-in volunteer holds over to another volunteer.
export function PassOnSheet({
  donation,
  meId,
  onCancel,
  onDone,
}: {
  donation: Donation | null;
  meId: number;
  onCancel: () => void;
  onDone: (to: string) => void;
}) {
  const visible = !!donation;
  const [to, setTo] = useState<string | undefined>();
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const volunteers = useAsync(
    () => (visible ? api.listVolunteers() : Promise.resolve([])),
    [visible],
  );
  // Every volunteer except the current owner.
  const options = (volunteers.data ?? [])
    .filter(v => v.id !== (donation?.current_owner_id ?? meId))
    .map(v => ({ value: String(v.id), label: v.name }));

  const reset = () => {
    setTo(undefined);
    setDate(today());
    setError(null);
  };

  const confirm = async () => {
    if (!donation || saving) {
      return;
    }
    if (!to) {
      setError('Choose a volunteer.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.transfer(donation.id, {
        volunteer_id: Number(to),
        transferred_on: date,
      });
      const name = options.find(o => o.value === to)?.label ?? 'the volunteer';
      reset();
      onDone(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        reset();
        onCancel();
      }}
    >
      <View style={s.root}>
        <View style={s.grabber} />
        <NavBar
          title="Donate to Volunteer"
          backLabel="Cancel"
          onBack={() => {
            reset();
            onCancel();
          }}
          right={
            <TextButton
              label={saving ? 'Saving…' : 'Done'}
              bold
              onPress={confirm}
            />
          }
        />
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          {donation && (
            <Section>
              <View style={s.book}>
                <Text style={type.headline} numberOfLines={2}>
                  {donation.book_title}
                </Text>
                <Text style={type.footnote}>
                  Grade {donation.grade} · {donation.school}
                </Text>
              </View>
            </Section>
          )}

          <Section
            header="Pass on to"
            footer={
              volunteers.error
                ? `Couldn’t load volunteers: ${volunteers.error}`
                : volunteers.data && !options.length
                ? 'There are no other volunteers yet.'
                : 'The book moves to their list. Stock doesn’t change, because the copy is already donated.'
            }
          >
            <View style={s.dropdownRow}>
              <Dropdown
                label="Volunteer Name"
                allLabel={
                  volunteers.loading ? 'Loading…' : 'Choose a volunteer'
                }
                options={options}
                value={to}
                onChange={setTo}
              />
            </View>
          </Section>

          <Section header="Date">
            <DateField label="Handed over on" value={date} onChange={setDate} />
          </Section>

          {error && <Banner tone="error" text={error} />}
        </ScrollView>
        <View style={s.footer}>
          <PrimaryButton
            label={saving ? 'Saving…' : 'Donate to Volunteer'}
            onPress={confirm}
            disabled={saving}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 6,
  },
  content: { padding: space.gutter, paddingTop: space.sm, gap: space.lg },
  book: { padding: space.lg, gap: 2 },
  dropdownRow: { flexDirection: 'row', padding: space.md },
  footer: {
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
    paddingBottom: space.xl + space.lg,
  },
});
