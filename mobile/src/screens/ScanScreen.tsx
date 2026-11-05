import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Segmented } from '../components';
import type { Nav } from '../nav';
import { colors } from '../theme';

type Mode = 'Cover' | 'ISBN barcode' | 'Upload';

// Camera preview is a placeholder; plug in a camera library (e.g. react-native-vision-camera) here.
// Until AI recognition is wired up, capturing opens an empty form to fill in by hand.
export function ScanScreen({ nav, top, bottom }: { nav: Nav; top: number; bottom: number }) {
  const [mode, setMode] = useState<Mode>('Cover');

  return (
    <View style={[s.root, { paddingTop: top + 8, paddingBottom: bottom + 20 }]}>
      <View style={s.header}>
        <Pressable accessibilityLabel="Close" onPress={nav.back} style={s.round}>
          <Text style={s.roundText}>✕</Text>
        </Pressable>
        <Text style={s.headerTitle}>Add a book</Text>
        <View style={s.round} />
      </View>

      <View style={s.center}>
        <View style={s.frame}>
          <Text style={s.frameText}>Camera preview</Text>
        </View>
        <Text style={s.hint}>
          {mode === 'ISBN barcode'
            ? 'Line up the barcode on the back cover.'
            : mode === 'Upload'
            ? 'Choose a photo of the cover from your library.'
            : 'Fit the cover inside the frame.'}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 24 }}>
        <Segmented options={['Cover', 'ISBN barcode', 'Upload'] as Mode[]} value={mode} onChange={setMode} dark />
        <View style={s.controls}>
          <Pressable accessibilityLabel="Choose from photos" onPress={() => setMode('Upload')} style={s.side}>
            <Text style={s.roundText}>▧</Text>
          </Pressable>
          <Pressable accessibilityLabel="Capture" onPress={() => nav.push({ name: 'Review' })} style={s.shutter}>
            <View style={s.shutterInner} />
          </Pressable>
          <Pressable accessibilityLabel="Enter manually" onPress={() => nav.push({ name: 'Review' })} style={s.side}>
            <Text style={s.roundText}>✎</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.camera },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' },
  roundText: { color: '#FFFFFF', fontSize: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 40 },
  frame: { width: 230, height: 320, borderRadius: 18, borderWidth: 3, borderColor: '#7C93FF', backgroundColor: '#1C2530', alignItems: 'center', justifyContent: 'center' },
  frameText: { color: '#6B7684', fontSize: 14 },
  hint: { color: '#C9D1DC', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  side: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
});
