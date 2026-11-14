import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors, type } from '../constants/theme';
import { Card } from './List';
import { styles } from './styles';

// ---------- Display ----------

export function StatusPill({ available, condition }: { available: number; condition?: string }) {
  const ok = available > 0;
  return (
    <Text style={[styles.pill, { backgroundColor: ok ? colors.okBg : colors.warnBg, color: ok ? colors.okInk : colors.warnInk }]}>
      {ok ? `${available} available${condition ? ' · ' + condition : ''}` : 'All donated'}
    </Text>
  );
}

export function Bar({ pct, color = colors.primary, height = 6 }: { pct: number; color?: string; height?: number }) {
  return (
    <View style={{ flex: 1, height, borderRadius: height / 2, backgroundColor: colors.track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function StatTile({ label, value, tint }: { label: string; value: number | string; tint?: string }) {
  return (
    <Card style={styles.statTile}>
      <Text style={type.footnote}>{label}</Text>
      <Text style={[type.title2, tint ? { color: tint } : null]}>{value}</Text>
    </Card>
  );
}

export function Banner({ text, tone = 'notice', onPress }: { text: string; tone?: 'notice' | 'error' | 'ok'; onPress?: () => void }) {
  const palette =
    tone === 'error' ? [colors.warnBg, colors.warnInk] : tone === 'ok' ? [colors.okBg, colors.okInk] : [colors.noticeBg, colors.noticeInk];
  return (
    <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : 'alert'} style={[styles.banner, { backgroundColor: palette[0] }]}>
      <Text style={[type.subhead, { color: palette[1] }]}>{text}</Text>
    </Pressable>
  );
}

// Loading / error / empty placeholder shared by every data-backed screen.
export function StateView({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.muted} />
      </View>
    );
  }
  return (
    <View style={styles.state}>
      <Text style={[type.subhead, { color: colors.muted, textAlign: 'center' }]}>{error ? `Couldn't load: ${error}` : empty}</Text>
      {error && onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={12}>
          <Text style={styles.sectionAction}>Try Again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
