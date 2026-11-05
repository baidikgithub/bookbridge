import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, PrimaryButton, styles as cs } from '../components';
import { api, type User } from '../data';
import { colors, fonts } from '../theme';

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
      <View style={[s.content, { paddingTop: top + 80 }]}>
        <Text style={s.title}>BookBridge</Text>
        <Text style={s.sub}>{registering ? 'Create a volunteer account' : 'Sign in to manage donated books'}</Text>

        <Card>
          {registering && <Field label="Name" value={name} onChange={setName} />}
          <Field label="Email" value={email} onChange={setEmail} keyboard="email-address" />
          <Field label="Password" value={password} onChange={setPassword} secure last />
        </Card>

        {error && <Text style={s.error}>{error}</Text>}

        <PrimaryButton label={busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'} onPress={submit} />
        <Pressable onPress={() => setMode(registering ? 'login' : 'register')} hitSlop={12} style={{ alignSelf: 'center' }}>
          <Text style={s.link}>{registering ? 'I already have an account' : 'Create an account'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboard,
  secure,
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: 'email-address';
  secure?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[cs.kvRow, !last && cs.kvBorder, { gap: 12 }]}>
      <Text style={[cs.kvKey, { width: 80 }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        secureTextEntry={secure}
        autoCapitalize={label === 'Name' ? 'words' : 'none'}
        autoCorrect={false}
        textContentType={secure ? 'password' : label === 'Email' ? 'emailAddress' : 'name'}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontFamily: fonts.display, fontSize: 36, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, marginTop: -8, marginBottom: 8 },
  input: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 12 },
  error: { fontSize: 14, color: colors.warnInk },
  link: { fontSize: 15, fontWeight: '500', color: colors.primary },
});
