import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banner, Field, PrimaryButton, Section } from '../components';
import { api, type User } from '../data';
import { colors, space, type } from '../theme';

export function LoginScreen({ onSignedIn, top }: { onSignedIn: (token: string, user: User) => void; top: number }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registering = mode === 'register';

  const submit = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = registering ? await api.register(name, email, password) : await api.login(email, password);
      onSignedIn(res.token, res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[s.content, { paddingTop: top + 56 }]} keyboardShouldPersistTaps="handled">
        <View style={s.brand}>
          <View style={s.logo}>
            <Text style={s.logoGlyph}>▤</Text>
          </View>
          <Text style={type.largeTitle}>BookBridge</Text>
          <Text style={[type.subhead, { color: colors.muted, textAlign: 'center' }]}>
            {registering ? 'Create a volunteer account' : 'Sign in to manage donated books'}
          </Text>
        </View>

        <Section footer={registering ? 'Passwords need at least 8 characters.' : undefined}>
          {registering && <Field label="Name" value={name} onChange={setName} placeholder="Full name" autoCapitalize="words" textContentType="name" />}
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
            keyboard="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
          <Field label="Password" value={password} onChange={setPassword} placeholder="Required" secure autoCapitalize="none" textContentType="password" last />
        </Section>

        {error && <Banner tone="error" text={error} />}

        <PrimaryButton label={busy ? 'Please wait…' : registering ? 'Create Account' : 'Sign In'} onPress={submit} disabled={busy} />
        <Pressable accessibilityRole="button" onPress={() => setMode(registering ? 'login' : 'register')} hitSlop={12} style={s.switch}>
          <Text style={s.link}>{registering ? 'I already have an account' : 'Create an account'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.gutter, paddingBottom: space.xl, gap: space.lg },
  brand: { alignItems: 'center', gap: space.xs, marginBottom: space.sm },
  logo: { width: 64, height: 64, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  logoGlyph: { fontSize: 30, color: '#FFFFFF' },
  switch: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  link: { fontSize: 17, color: colors.primary },
});
