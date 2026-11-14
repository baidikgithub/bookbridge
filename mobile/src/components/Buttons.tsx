import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/theme';
import { styles } from './styles';

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
        { backgroundColor: tone === 'accent' ? colors.primarySoft : colors.primaryFill, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}>
      <Text style={[styles.primaryBtnText, tone === 'accent' && { color: colors.primaryInk }]}>{label}</Text>
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
      <Text style={[styles.chipText, { color: selected ? colors.onPrimary : colors.ink }]}>{label}</Text>
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
