import React, { useEffect, useRef, useState } from 'react';
import { Linking, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, CameraType, type CameraApi } from 'react-native-camera-kit';
import { launchImageLibrary } from 'react-native-image-picker';
import { Icon, Segmented } from '../components';
import { colors, space, type } from '../constants/theme';
import type { Nav } from '../types';

type Mode = 'Cover' | 'Barcode' | 'Upload';
type Permission = 'checking' | 'granted' | 'denied';

// Book barcodes are EAN-13 starting 978/979; older books may carry a 10-character ISBN.
const asIsbn = (raw: string) => {
  const v = raw.replace(/[^0-9Xx]/g, '').toUpperCase();
  return /^97[89]\d{10}$/.test(v) || /^\d{9}[\dX]$/.test(v) ? v : null;
};

// Cover: photo of the front. Barcode: scans the ISBN. Upload: pick an existing photo.
// Each opens the book form prefilled with what was captured.
export function ScanScreen({ nav, top, bottom }: { nav: Nav; top: number; bottom: number }) {
  const [mode, setMode] = useState<Mode>('Cover');
  const [permission, setPermission] = useState<Permission>('checking');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const camera = useRef<CameraApi>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setPermission('granted'); // iOS asks on first use, using NSCameraUsageDescription.
      return;
    }
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA).then(r =>
      setPermission(r === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied'),
    );
  }, []);

  useEffect(() => {
    handled.current = false;
    setNotice(null);
  }, [mode]);

  const capture = async () => {
    if (busy || !camera.current) {
      return;
    }
    setBusy(true);
    try {
      const shot = await camera.current.capture();
      const uri = /^(file|content):\/\//.test(shot.uri) ? shot.uri : `file://${shot.uri}`;
      nav.push({ name: 'Review', photo: { uri, type: 'image/jpeg', fileName: shot.name || 'cover.jpg' } });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not take the photo.');
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', maxWidth: 1600, maxHeight: 1600, quality: 0.8, selectionLimit: 1 });
    const a = res.assets?.[0];
    if (a?.uri) {
      nav.push({ name: 'Review', photo: { uri: a.uri, type: a.type, fileName: a.fileName } });
    } else if (res.errorMessage) {
      setNotice(res.errorMessage);
    }
  };

  const onCode = (raw: string) => {
    if (handled.current) {
      return;
    }
    const isbn = asIsbn(raw);
    if (!isbn) {
      setNotice('That barcode isn’t an ISBN. Try the barcode on the back cover.');
      return;
    }
    handled.current = true;
    nav.push({ name: 'Review', isbn });
  };

  const hint =
    mode === 'Barcode'
      ? 'Line up the ISBN barcode on the back cover. It scans automatically.'
      : mode === 'Upload'
      ? 'Choose a photo of the cover from your library.'
      : 'Fit the front cover inside the frame, then tap the shutter.';
  const showCamera = permission === 'granted' && mode !== 'Upload';

  return (
    <View style={[s.root, { paddingTop: top, paddingBottom: bottom + space.xl }]}>
      {showCamera && (
        <Camera
          ref={camera as any}
          style={StyleSheet.absoluteFill}
          cameraType={CameraType.Back}
          scanBarcode={mode === 'Barcode'}
          allowedBarcodeTypes={['ean-13', 'upc-a', 'code-128']}
          onReadCode={(e: any) => onCode(e.nativeEvent.codeStringValue)}
          onError={(e: any) => setNotice(e.nativeEvent.errorMessage)}
        />
      )}

      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={nav.back} style={s.round}>
          <Text style={s.roundText}>✕</Text>
        </Pressable>
        <Text style={[type.headline, { color: '#FFFFFF' }]}>Add Book</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.center} pointerEvents="box-none">
        {permission === 'denied' && mode !== 'Upload' ? (
          <View style={s.blocked}>
            <Text style={[type.headline, { color: '#FFFFFF', textAlign: 'center' }]}>Camera access is off</Text>
            <Text style={[type.subhead, s.hint]}>Allow camera access in Settings, or upload a photo instead.</Text>
            <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()} hitSlop={8}>
              <Text style={s.settings}>Open Settings</Text>
            </Pressable>
          </View>
        ) : mode === 'Upload' ? (
          <Pressable accessibilityRole="button" onPress={upload} style={[s.frame, s.uploadFrame]}>
            <Icon name="photo" size={40} color="#FFFFFF" strokeWidth={1.5} />
            <Text style={[type.headline, { color: '#FFFFFF' }]}>Choose Photo</Text>
          </Pressable>
        ) : (
          <View style={[s.frame, mode === 'Barcode' && s.frameWide]} />
        )}
        <View style={s.hintPill}>
          <Text style={[type.subhead, s.hint]}>{notice ?? hint}</Text>
        </View>
      </View>

      <View style={s.bottom}>
        <Segmented options={['Cover', 'Barcode', 'Upload'] as Mode[]} value={mode} onChange={setMode} dark />
        <View style={s.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose from photos" onPress={upload} style={s.side}>
            <Icon name="photo" size={24} color="#FFFFFF" />
            <Text style={s.sideLabel}>Photos</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === 'Cover' ? 'Take photo' : mode === 'Upload' ? 'Choose photo' : 'Scanning'}
            accessibilityState={{ disabled: mode === 'Barcode' || busy }}
            disabled={mode === 'Barcode' || busy || (mode === 'Cover' && !showCamera)}
            onPress={mode === 'Upload' ? upload : capture}
            style={[s.shutter, (mode === 'Barcode' || busy) && { opacity: 0.35 }]}>
            <View style={s.shutterInner} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Enter manually" onPress={() => nav.push({ name: 'Review' })} style={s.side}>
            <Icon name="pencil" size={24} color="#FFFFFF" />
            <Text style={s.sideLabel}>Manual</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.camera },
  header: { height: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.gutter },
  round: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0000004D', alignItems: 'center', justifyContent: 'center' },
  roundText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingHorizontal: space.xl },
  frame: { width: 220, height: 300, borderRadius: 16, borderWidth: 2, borderColor: '#FFFFFFE6' },
  frameWide: { width: 280, height: 140 },
  uploadFrame: { backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center', gap: space.sm, borderStyle: 'dashed' },
  blocked: { alignItems: 'center', gap: space.sm },
  settings: { fontSize: 17, color: colors.primaryFill, fontWeight: '600' },
  hintPill: { backgroundColor: '#00000080', borderRadius: 12, paddingHorizontal: space.md, paddingVertical: 6 },
  hint: { color: '#FFFFFF', textAlign: 'center' },
  bottom: { paddingHorizontal: space.gutter, gap: space.xl },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg },
  side: { width: 64, alignItems: 'center', gap: 4 },
  sideLabel: { color: '#FFFFFF', fontSize: 12 },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF' },
});
