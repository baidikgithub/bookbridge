import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../constants/theme';

export type ViewMode = 'list' | 'grid';

// Two-button switch between list and grid layouts.
export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <View style={s.wrap} accessibilityRole="tablist">
      {(['list', 'grid'] as const).map(mode => {
        const on = value === mode;
        const ink = on ? colors.onPrimary : colors.muted;
        return (
          <Pressable
            key={mode}
            accessibilityRole="tab"
            accessibilityLabel={mode === 'list' ? 'List view' : 'Grid view'}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(mode)}
            hitSlop={4}
            style={[s.btn, on && s.btnOn]}
          >
            <Svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke={ink}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mode === 'list' ? (
                <Path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
              ) : (
                <>
                  <Rect x={4} y={4} width={6.5} height={6.5} rx={1.5} />
                  <Rect x={13.5} y={4} width={6.5} height={6.5} rx={1.5} />
                  <Rect x={4} y={13.5} width={6.5} height={6.5} rx={1.5} />
                  <Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={1.5} />
                </>
              )}
            </Svg>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.field,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  btn: {
    width: 38,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOn: { backgroundColor: colors.primaryFill },
});
