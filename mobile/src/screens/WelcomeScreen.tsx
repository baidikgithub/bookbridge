import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Icon, type IconName } from '../components';
import { colors, space } from '../constants/theme';

// Onboarding palette, shared with the floating tab bar's green.
const GREEN = colors.primaryFill;
const FOREST = '#1B3A0F';
const GREY_BTN = '#EFF0EE';
const PEACH = '#F3ECE1'; // muted sand
const MINT = '#E3EEE9'; // sage
const LILAC = '#E8F3DF'; // pale green
const BUTTER = '#ECEEF1'; // stone

// First screen: a collage of pastel tiles, a tagline and Get Started.
export function WelcomeScreen({
  top,
  bottom,
  onGetStarted,
}: {
  top: number;
  bottom: number;
  onGetStarted: () => void;
}) {
  return (
    <View
      style={[s.root, { paddingTop: top, paddingBottom: bottom + space.md }]}
    >
      <ScrollView contentContainerStyle={s.welcomeContent} bounces={false}>
        <View
          style={s.collage}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={s.col}>
            <Tile color={LILAC} height={196} icon="books" ink="#3B7D23" big />
            <Tile color={MINT} height={124} icon="hand" ink="#3D6B5E" />
          </View>
          <View style={[s.col, s.colOffset]}>
            <Tile color={PEACH} height={124} icon="heart" ink="#8A6A2E" />
            <Tile color={BUTTER} height={180} icon="user" ink="#4A5068" big />
          </View>
        </View>

        <View style={s.badge}>
          <Text style={s.badgeText}>Give or Collect Books</Text>
        </View>
        <Text style={s.hero} accessibilityRole="header">
          Share a Book,{'\n'}Shape a Future
        </Text>
        <Text style={s.sub}>
          Get donated books to the children who need them with Book Bridge.
        </Text>
      </ScrollView>

      <View style={s.pad}>
        <BigButton label="Get Started" color={GREEN} onPress={onGetStarted} />
      </View>
    </View>
  );
}

// Second screen: choose how to continue. Email leads to Sign Up; existing users can sign in.
export function AuthChoiceScreen({
  top,
  bottom,
  onEmail,
  onSignIn,
  onBack,
}: {
  top: number;
  bottom: number;
  onEmail: () => void;
  onSignIn: () => void;
  onBack: () => void;
}) {
  const unavailable = (provider: string) =>
    Alert.alert(
      `${provider} sign-in isn’t available yet`,
      'Please continue with email for now.',
    );

  return (
    <View
      style={[s.root, { paddingTop: top, paddingBottom: bottom + space.md }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        hitSlop={12}
        style={s.back}
      >
        <Text style={s.backText}>‹</Text>
      </Pressable>

      <View style={s.choiceBody}>
        <Text style={s.hey}>Get started</Text>
        <Text style={s.hero} accessibilityRole="header">
          Welcome to{'\n'}Book Bridge
        </Text>

        <View style={s.buttons}>
          <BigButton
            label="Continue with Email"
            color={GREEN}
            icon={<MailIcon />}
            onPress={onEmail}
          />
          <BigButton
            label="Continue with Google"
            color={GREY_BTN}
            icon={<GoogleIcon />}
            onPress={() => unavailable('Google')}
          />
          <BigButton
            label="Continue with Apple"
            color={GREY_BTN}
            icon={<AppleIcon />}
            onPress={() => unavailable('Apple')}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onSignIn}
          hitSlop={8}
          style={s.signIn}
        >
          <Text style={s.legal}>
            Already have an account? <Text style={s.legalStrong}>Sign In</Text>
          </Text>
        </Pressable>

        <Text style={[s.legal, s.terms]}>
          By continuing you agree to our{' '}
          <Text style={s.legalStrong}>Terms of Use</Text> and{' '}
          <Text style={s.legalStrong}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

function Tile({ color, height, icon, ink, big }: { color: string; height: number; icon: IconName; ink: string; big?: boolean }) {
  return (
    <View style={[s.tile, { backgroundColor: color, height }]}>
      <View style={[s.tileBadge, big && s.tileBadgeBig]}>
        <Icon name={icon} size={big ? 34 : 28} color={ink} strokeWidth={1.5} />
      </View>
    </View>
  );
}

function BigButton({
  label,
  color,
  icon,
  onPress,
}: {
  label: string;
  color: string;
  icon?: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        s.big,
        { backgroundColor: color },
        pressed && { opacity: 0.8 },
      ]}
    >
      {icon}
      <Text style={s.bigText}>{label}</Text>
    </Pressable>
  );
}

function MailIcon() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={FOREST}
      strokeWidth={1.8}
      strokeLinejoin="round"
    >
      <Rect x={3} y={5} width={18} height={14} rx={3} />
      <Path d="m4 7 8 6 8-6" />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.5 5.8c4.4-4 6.8-10 6.8-17.3z"
      />
      <Path
        fill="#FBBC05"
        d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.8 6.1C6.6 42.6 14.6 48 24 48z"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#000000"
        d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9C5.9 6.8 4.2 7.8 3.3 9.4c-1.9 3.3-.5 8.1 1.3 10.8.9 1.3 2 2.7 3.4 2.7 1.3-.1 1.9-.9 3.5-.9s2.1.9 3.5.8c1.4 0 2.4-1.3 3.2-2.6 1-1.5 1.4-2.9 1.5-3-.1 0-2.9-1.1-2.9-4.3zM13.8 5c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"
      />
    </Svg>
  );
}

const s = StyleSheet.create({
  tileBadge: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFFFFFB3', alignItems: 'center', justifyContent: 'center' },
  tileBadgeBig: { width: 72, height: 72, borderRadius: 22 },
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  pad: { paddingHorizontal: space.gutter },
  welcomeContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.gutter,
    paddingVertical: space.xl,
  },
  collage: {
    flexDirection: 'row',
    gap: space.md,
    marginBottom: space.xl * 1.5,
  },
  col: { width: 150, gap: space.md },
  colOffset: { marginTop: space.md },
  tile: { borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  badge: {
    borderWidth: 1,
    borderColor: '#DCDDDA',
    borderRadius: 22,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  badgeText: { fontSize: 15, color: FOREST, fontWeight: '500' },
  hero: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    color: FOREST,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  sub: {
    fontSize: 16,
    lineHeight: 22,
    color: '#3C3C43',
    textAlign: 'center',
    marginTop: space.md,
    paddingHorizontal: space.lg,
  },
  big: {
    height: 58,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  bigText: { fontSize: 17, fontWeight: '600', color: FOREST, letterSpacing: -0.2 },
  back: {
    width: 44,
    height: 44,
    marginLeft: space.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { fontSize: 34, lineHeight: 38, color: FOREST },
  choiceBody: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: space.gutter,
    paddingBottom: space.md,
  },
  hey: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: space.sm,
  },
  buttons: { gap: space.md, marginTop: space.xl * 1.5 },
  signIn: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: space.md,
  },
  legal: {
    fontSize: 15,
    lineHeight: 21,
    color: '#6C6C70',
    textAlign: 'center',
  },
  legalStrong: { color: FOREST, fontWeight: '600' },
  terms: { marginTop: space.sm, paddingHorizontal: space.lg },
});
