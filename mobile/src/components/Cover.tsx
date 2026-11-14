import React from 'react';
import { Image, View } from 'react-native';
import { radius } from '../constants/theme';
import { imageUri } from '../utils/image';

export function Cover({ color, uri, w = 40, h = 56 }: { color: string; uri?: string | null; w?: number; h?: number }) {
  const box = { width: w, height: h, borderRadius: radius.sm, backgroundColor: color };
  const src = imageUri(uri);
  return src ? <Image source={{ uri: src }} style={box} resizeMode="cover" accessibilityIgnoresInvertColors /> : <View style={box} />;
}
