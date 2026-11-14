import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../api';
import { Banner, Field, Icon, PrimaryButton, Section } from '../components';
import { colors, space, type } from '../constants/theme';
import type { User } from '../types';
import { AuthChoiceScreen, WelcomeScreen } from './WelcomeScreen';

type OnSignedIn = (token: string, user: User) => void;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'welcome' | 'choose' | 'signIn' | 'signUp';

// Signed-out flow: Welcome → Get Started → choose a method → Continue with Email → Sign Up.
// Sign In is reachable from the choice screen and from Sign Up.
export function LoginScreen({
  onSignedIn,
  top,
  bottom,
}: {
  onSignedIn: OnSignedIn;
  top: number;
  bottom: number;
}) {
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState(''); // carried across so switching screens keeps it

  // Android back steps back through the flow before leaving the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'welcome') {
        return false;
      }
      setStep(step === 'choose' ? 'welcome' : 'choose');
      return true;
    });
    return () => sub.remove();
  }, [step]);

  switch (step) {
    case 'welcome':
      return (
        <WelcomeScreen
          top={top}
          bottom={bottom}
          onGetStarted={() => setStep('choose')}
        />
      );
    case 'choose':
      return (
        <AuthChoiceScreen
          top={top}
          bottom={bottom}
          onEmail={() => setStep('signUp')}
          onSignIn={() => setStep('signIn')}
          onBack={() => setStep('welcome')}
        />
      );
    case 'signIn':
      return (
        <SignIn
          top={top}
          email={email}
          setEmail={setEmail}
          onSignedIn={onSignedIn}
          onSignUp={() => setStep('signUp')}
          onBack={() => setStep('choose')}
        />
      );
    case 'signUp':
      return (
        <SignUp
          top={top}
          email={email}
          setEmail={setEmail}
          onSignedIn={onSignedIn}
          onSignIn={() => setStep('signIn')}
          onBack={() => setStep('choose')}
        />
      );
  }
}

type Shared = {
  top: number;
  email: string;
  setEmail: (v: string) => void;
  onSignedIn: OnSignedIn;
};

function SignIn({
  top,
  email,
  setEmail,
  onSignedIn,
  onSignUp,
  onBack,
}: Shared & { onSignUp: () => void; onBack: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) {
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      return setError('Enter a valid email address.');
    }
    if (!password) {
      return setError('Enter your password.');
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password);
      onSignedIn(res.token, res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell top={top} subtitle="Sign in to your account" onBack={onBack}>
      <Section>
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
          keyboard="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Required"
          secure
          autoCapitalize="none"
          textContentType="password"
          last
        />
      </Section>
      {error && <Banner tone="error" text={error} />}
      <PrimaryButton
        label={busy ? 'Signing In…' : 'Sign In'}
        onPress={submit}
        disabled={busy}
      />
      <Divider />
      <SecondaryButton label="Sign Up" onPress={onSignUp} />
      <Text style={[type.footnote, s.center]}>
        New to Book Bridge? Create an account.
      </Text>
    </Shell>
  );
}

function SignUp({
  top,
  email,
  setEmail,
  onSignedIn,
  onSignIn,
  onBack,
}: Shared & { onSignIn: () => void; onBack: () => void }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (name.trim().length < 2) {
      return 'Enter your full name.';
    }
    if (!EMAIL_RE.test(email.trim())) {
      return 'Enter a valid email address.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (password !== confirm) {
      return 'Passwords don’t match.';
    }
    return null;
  };

  const submit = async () => {
    if (busy) {
      return;
    }
    const problem = validate();
    if (problem) {
      return setError(problem);
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.register(name.trim(), email.trim(), password);
      onSignedIn(res.token, res.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell top={top} subtitle="Create your account" onBack={onBack}>
      <Section footer="At least 8 characters. New accounts are volunteers; the very first account becomes the admin.">
        <Field
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Full name"
          autoCapitalize="words"
          textContentType="name"
        />
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
          keyboard="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="8+ characters"
          secure
          autoCapitalize="none"
          textContentType="password"
        />
        <Field
          label="Confirm"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat password"
          secure
          autoCapitalize="none"
          textContentType="password"
          last
        />
      </Section>
      {error && <Banner tone="error" text={error} />}
      <PrimaryButton
        label={busy ? 'Creating Account…' : 'Sign Up'}
        onPress={submit}
        disabled={busy}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onSignIn}
        hitSlop={8}
        style={s.switch}
      >
        <Text style={[type.subhead, s.center]}>
          Already have an account? <Text style={s.link}>Sign In</Text>
        </Text>
      </Pressable>
    </Shell>
  );
}

function Shell({
  top,
  subtitle,
  onBack,
  children,
}: {
  top: number;
  subtitle: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={12}
          style={[s.back, { top: top + 8 }]}
        >
          <Text style={s.link}>‹ Back</Text>
        </Pressable>
      )}
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: top + 56 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.brand}>
          <View style={s.logo}>
            <Icon name="book" size={30} color={colors.onPrimary} />
          </View>
          <Text style={type.largeTitle}>Book Bridge</Text>
          <Text style={[type.subhead, s.muted]}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.secondary, pressed && { opacity: 0.6 }]}
    >
      <Text style={s.secondaryText}>{label}</Text>
    </Pressable>
  );
}

function Divider() {
  return (
    <View style={s.divider}>
      <View style={s.line} />
      <Text style={[type.footnote, s.muted]}>or</Text>
      <View style={s.line} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  brand: { alignItems: 'center', gap: space.xs, marginBottom: space.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primaryFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  muted: { color: colors.muted, textAlign: 'center' },
  center: { textAlign: 'center', color: colors.muted },
  link: { fontSize: 17, color: colors.primary, fontWeight: '600' },
  switch: { minHeight: 44, justifyContent: 'center' },
  back: {
    position: 'absolute',
    left: space.gutter,
    zIndex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondary: {
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  secondaryText: { fontSize: 17, fontWeight: '600', color: colors.ink },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
});
