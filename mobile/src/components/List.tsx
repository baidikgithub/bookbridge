import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, type } from '../constants/theme';
import { styles } from './styles';

// ---------- Grouped lists ----------

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// Inset grouped section: small caps header, rounded card, optional footnote.
export function Section({
  header,
  footer,
  action,
  children,
  style,
}: {
  header?: string;
  footer?: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {header || action ? (
        <View style={styles.sectionHead}>
          {header ? <Text style={styles.sectionLabel}>{header.toUpperCase()}</Text> : <View />}
          {action ? (
            <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={12}>
              <Text style={styles.sectionAction}>{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Card>{children}</Card>
      {footer ? <Text style={styles.sectionFooter}>{footer}</Text> : null}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={[styles.sectionLabel, styles.sectionHead]}>{children.toUpperCase()}</Text>;
}

// Table row with optional leading view, subtitle, trailing value and disclosure chevron.
export function Row({
  title,
  subtitle,
  value,
  leading,
  trailing,
  onPress,
  last,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const body = (
    <View style={styles.row}>
      {leading}
      <View style={[styles.rowMain, !last && styles.separator]}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.body} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={type.footnote} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {value ? <Text style={[type.body, { color: colors.muted }]}>{value}</Text> : null}
        {trailing}
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && { backgroundColor: colors.field }}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function KeyValueRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowMain, !last && styles.separator]}>
        <Text style={type.body}>{k}</Text>
        <Text style={[type.body, styles.kvValue]} numberOfLines={2}>
          {v}
        </Text>
      </View>
    </View>
  );
}
