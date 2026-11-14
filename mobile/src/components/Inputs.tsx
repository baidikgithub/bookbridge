import React from 'react';
import { Platform, Modal, Pressable, ScrollView, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors, space, type } from '../constants/theme';
import { styles } from './styles';

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
