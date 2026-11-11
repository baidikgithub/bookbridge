import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { imageUri } from './data';
import { colors, hairline, radius, space, type } from './theme';

export type Tab = 'Home' | 'Inventory' | 'Add' | 'Reports' | 'Profile';

export function Cover({ color, uri, w = 40, h = 56 }: { color: string; uri?: string | null; w?: number; h?: number }) {
  const box = { width: w, height: h, borderRadius: radius.sm, backgroundColor: color };
  const src = imageUri(uri);
  return src ? <Image source={{ uri: src }} style={box} resizeMode="cover" accessibilityIgnoresInvertColors /> : <View style={box} />;
}

// ---------- Navigation ----------

// Large title header used at the top of each tab's root screen.
export function LargeTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.largeTitle}>
      <View style={{ flex: 1 }}>
        {subtitle ? <Text style={styles.largeSubtitle}>{subtitle}</Text> : null}
        <Text style={type.largeTitle} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right ? <View style={styles.largeRight}>{right}</View> : null}
    </View>
  );
}

// Standard 44pt navigation bar: leading back/cancel, centred title, optional trailing action.
export function NavBar({
  title,
  onBack,
  backLabel = 'Back',
  right,
  dark,
}: {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
  dark?: boolean;
}) {
  const tint = dark ? '#FFFFFF' : colors.primary;
  return (
    <View style={styles.navBar}>
      <View style={styles.navSide}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} hitSlop={12} style={styles.navHit}>
            <Text style={[styles.navLink, { color: tint }]}>
              {backLabel === 'Back' ? '‹ ' : ''}
              {backLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[type.headline, styles.navTitle, dark && { color: '#FFFFFF' }]} numberOfLines={1}>
        {title ?? ''}
      </Text>
      <View style={[styles.navSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export function TextButton({ label, onPress, bold }: { label: string; onPress: () => void; bold?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={12} style={styles.navHit}>
      <Text style={[styles.navLink, bold && { fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

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

// Labelled text input row for forms inside a Section.
export function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  secure,
  autoCapitalize,
  textContentType,
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: KeyboardTypeOptions;
  secure?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  textContentType?: 'emailAddress' | 'password' | 'name' | 'none';
  last?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowMain, !last && styles.separator]}>
        <Text style={[type.body, styles.fieldLabel]}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          keyboardType={keyboard}
          secureTextEntry={secure}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          textContentType={textContentType}
          style={styles.input}
        />
      </View>
    </View>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Text style={styles.searchGlyph}>⌕</Text>
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChange}
        clearButtonMode="while-editing"
        returnKeyType="search"
        autoCorrect={false}
        style={styles.searchInput}
      />
    </View>
  );
}

// ---------- Controls ----------

export function PrimaryButton({
  label,
  onPress,
  tone = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'accent';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: tone === 'accent' ? colors.accent : colors.primary, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}>
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  dark,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  dark?: boolean;
}) {
  return (
    <View style={[styles.segment, { backgroundColor: dark ? '#FFFFFF24' : colors.field }]}>
      {options.map(o => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o)}
            style={[styles.segmentItem, on && styles.segmentOn, on && dark && { backgroundColor: '#636366' }]}>
            <Text style={[styles.segmentText, { color: dark ? '#FFFFFF' : colors.ink, fontWeight: on ? '600' : '500' }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, min = 1 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel="Decrease" onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <View style={styles.stepDivider} />
      <Pressable accessibilityRole="button" accessibilityLabel="Increase" onPress={() => onChange(value + 1)} style={styles.stepBtn}>
        <Text style={styles.stepText}>+</Text>
      </Pressable>
    </View>
  );
}

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

const TAB_GLYPHS: Record<Tab, string> = { Home: '⌂', Inventory: '☰', Add: '⊕', Reports: '▥', Profile: '◉' };

export function TabBar({ active, onSelect, bottomInset }: { active: Tab; onSelect: (t: Tab) => void; bottomInset: number }) {
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(bottomInset, 6) }]} accessibilityRole="tablist">
      {(Object.keys(TAB_GLYPHS) as Tab[]).map(t => {
        const on = t === active;
        const color = on ? colors.primary : '#8E8E93';
        return (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t}
            onPress={() => onSelect(t)}
            style={styles.tabItem}>
            <Text style={[styles.tabGlyph, { color }]}>{TAB_GLYPHS[t]}</Text>
            <Text style={[styles.tabLabel, { color }]}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  // navigation
  largeTitle: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.sm },
  largeSubtitle: { ...type.footnote, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  largeRight: { flexDirection: 'row', gap: space.lg, paddingBottom: 6 },
  navBar: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm },
  navSide: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  navHit: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  navLink: { fontSize: 17, color: colors.primary },
  navTitle: { flex: 2, textAlign: 'center' },
  // grouped lists
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: space.lg, paddingBottom: 6 },
  sectionLabel: { fontSize: 13, lineHeight: 18, color: colors.muted },
  sectionAction: { fontSize: 15, color: colors.primary },
  sectionFooter: { ...type.footnote, paddingHorizontal: space.lg, paddingTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, gap: space.md },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 11, paddingRight: space.lg, gap: space.sm },
  separator: { borderBottomWidth: hairline, borderBottomColor: colors.line },
  chevron: { fontSize: 22, lineHeight: 22, color: colors.faint, marginLeft: 2 },
  kvValue: { flex: 1, textAlign: 'right', color: colors.muted },
  fieldLabel: { width: 110 },
  input: { flex: 1, fontSize: 17, color: colors.ink, padding: 0, textAlign: 'right' },
  search: { height: 36, borderRadius: radius.md, backgroundColor: colors.field, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, gap: 6 },
  searchGlyph: { fontSize: 17, color: colors.muted },
  searchInput: { flex: 1, fontSize: 17, color: colors.ink, padding: 0 },
  // controls
  primaryBtn: { height: 50, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  chip: { height: 32, paddingHorizontal: 14, borderRadius: 16, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.primary },
  chipOff: { backgroundColor: colors.surface, borderWidth: hairline, borderColor: colors.border },
  chipText: { fontSize: 15 },
  segment: { flexDirection: 'row', borderRadius: 9, padding: 2 },
  segmentItem: { flex: 1, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segmentText: { fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.field, borderRadius: 8, height: 32 },
  stepBtn: { width: 46, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepDivider: { width: hairline, height: 18, backgroundColor: colors.faint },
  stepText: { fontSize: 20, color: colors.ink },
  // display
  pill: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '600', borderRadius: 6, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 2 },
  statTile: { flex: 1, paddingHorizontal: space.md, paddingVertical: 10, gap: 2 },
  banner: { borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: space.md },
  state: { paddingVertical: space.xl, paddingHorizontal: space.gutter, alignItems: 'center', gap: space.sm },
  tabBar: { flexDirection: 'row', backgroundColor: '#F9F9F9F2', borderTopWidth: hairline, borderTopColor: '#B2B2B2', paddingTop: 6 },
  tabItem: { flex: 1, alignItems: 'center', gap: 1, minHeight: 44 },
  tabGlyph: { fontSize: 22, lineHeight: 26 },
  tabLabel: { fontSize: 10, fontWeight: '500' },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.border,
  },
  dropdownOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  dropdownLabel: { fontSize: 12, lineHeight: 16, color: colors.muted },
  dropdownValue: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.ink },
  dropdownCaret: { fontSize: 18, color: colors.muted, marginLeft: space.xs, marginTop: -6 },
  sheetBackdrop: { flex: 1, backgroundColor: '#00000066' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    height: 52,
    borderBottomWidth: hairline,
    borderBottomColor: colors.line,
  },
  check: { fontSize: 17, fontWeight: '600', color: colors.primary },
});

// Modals draw under the system bars, so leave room for Android's navigation bar and the iPhone home indicator.
const SHEET_BOTTOM = Platform.OS === 'android' ? 56 : 34;

// Compact filter button that opens a bottom sheet of options with a checkmark on the current one.
export function Dropdown<T extends string | number>({
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const current = options.find(o => o.value === value);
  const pick = (v: T | undefined) => {
    onChange(v);
    setOpen(false);
  };
  const items: { value: T | undefined; label: string }[] = [{ value: undefined, label: allLabel }, ...options];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? allLabel}`}
        accessibilityHint="Opens a list of options"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.dropdown, current && styles.dropdownOn, pressed && { opacity: 0.7 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.dropdownLabel, current && { color: colors.primaryInk }]}>{label}</Text>
          <Text style={[styles.dropdownValue, current && { color: colors.primaryInk }]} numberOfLines={1}>
            {current?.label ?? allLabel}
          </Text>
        </View>
        <Text style={[styles.dropdownCaret, current && { color: colors.primary }]}>⌄</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: SHEET_BOTTOM }]}>
          <View style={styles.sheetHead}>
            <Text style={type.headline}>{label}</Text>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={12}>
              <Text style={[styles.navLink, { fontWeight: '600' }]}>Done</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 440 }} contentContainerStyle={{ paddingBottom: space.sm }}>
            {items.map((o, i) => {
              const on = o.value === value;
              return (
                <Pressable
                  key={String(o.value ?? 'all')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => pick(o.value)}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.field }]}>
                  <View style={[styles.rowMain, i < items.length - 1 && styles.separator]}>
                    <Text style={[type.body, { flex: 1 }, on && { color: colors.primary, fontWeight: '600' }]}>{o.label}</Text>
                    {on ? <Text style={styles.check}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
