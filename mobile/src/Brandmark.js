import React from 'react';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Exact path geometry and gradient stops from frontend/public/brandmark.svg.
// Kept as a React Native component so the canonical vector renders natively.
export default function Brandmark({ size = 48 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 128 128" accessibilityLabel="BragStack logo">
      <Defs>
        <LinearGradient id="g1" x1="14" y1="8" x2="112" y2="118" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#24D7FF" />
          <Stop offset="0.5" stopColor="#3478FF" />
          <Stop offset="1" stopColor="#8B5CF6" />
        </LinearGradient>
        <LinearGradient id="g2" x1="28" y1="34" x2="102" y2="104" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#EAF7FF" />
          <Stop offset="1" stopColor="#BFCBFF" />
        </LinearGradient>
      </Defs>
      <Rect width="128" height="128" rx="30" fill="#07101F" />
      <Path d="M26 24h47c20 0 31 9 31 24 0 10-5 17-15 21 13 4 20 12 20 25 0 18-13 28-35 28H26V24Z" fill="url(#g1)" />
      <Path d="M44 41h27c10 0 15 4 15 11s-5 11-15 11H44V41Zm0 38h31c11 0 17 4 17 12s-6 12-17 12H44V79Z" fill="#07101F" />
      <Path d="M18 95 44 69l13 13 28-31h-13V38h37v37H96V61L58 103 44 89l-16 16-10-10Z" fill="url(#g2)" />
    </Svg>
  );
}
