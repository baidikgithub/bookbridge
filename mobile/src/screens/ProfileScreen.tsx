import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, KeyValueRow, LargeTitle, Row, Section } from '../components';
import { colors, space, type } from '../constants/theme';
import { initials } from '../utils';
import type { Nav, User } from '../types';

const ROLE_INFO: Record<User['role'], string> = {
  volunteer: 'You can view inventory, reports, donations, and collection drives.',
  admin: 'You have full access, including the dashboard and adding, editing, and deleting books.',
};

export function ProfileScreen({ nav, user, onSignOut, top }: { nav: Nav; user: User; onSignOut: () => void; top: number }) {
  const role = user.role[0]!.toUpperCase() + user.role.slice(1);

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You’ll need your email and password to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onSignOut },
    ]);

  return (
    <ScrollView style={s.root} contentContainerStyle={[s.content, { paddingTop: top }]}>
      <LargeTitle title="Profile" />
      <View style={s.body}>
        <Card style={s.identity}>
          <View style={s.avatar}>
            <Text style={s.initials}>{initials(user.name) || '?'}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.title3} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={type.subhead} numberOfLines={1}>
              {user.email}
            </Text>
            <Text style={s.badge}>{role}</Text>
          </View>
        </Card>

        <Section header="Account" footer={ROLE_INFO[user.role]}>
          <KeyValueRow k="Name" v={user.name} />
          <KeyValueRow k="Email" v={user.email} />
          <KeyValueRow k="Role" v={role} last />
        </Section>

        <Section header="Shortcuts">
          <Row title="Donations" onPress={() => nav.push({ name: 'Donations' })} />
          <Row title="Collection drives" onPress={() => nav.push({ name: 'Drives' })} last={user.role !== 'admin'} />
          {user.role === 'admin' && <Row title="Users and roles" onPress={() => nav.push({ name: 'Users' })} last />}
        </Section>

        <Card>
          <Pressable
            accessibilityRole="button"
            onPress={confirmSignOut}
            style={({ pressed }) => [s.signOut, pressed && { backgroundColor: colors.field }]}>
            <Text style={s.signOutText}>Sign Out</Text>
          </Pressable>
        </Card>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xl },
  body: { paddingHorizontal: space.gutter, paddingTop: space.sm, gap: space.xl },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg, padding: space.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryFill, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 24, fontWeight: '600', color: colors.onPrimary },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryInk,
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  signOut: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  signOutText: { fontSize: 17, color: colors.danger },
});
