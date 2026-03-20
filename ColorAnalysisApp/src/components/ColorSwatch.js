import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function ColorSwatch({ name, hex, size = 'md', showLabel = true }) {
  const [showHex, setShowHex] = useState(false);

  const dim = size === 'lg' ? 72 : size === 'sm' ? 44 : 58;

  // Determine text color for overlay based on luminance
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const overlayText = luminance > 0.5 ? '#1A1814' : '#FAF8F5';

  return (
    <TouchableOpacity
      onPress={() => setShowHex(v => !v)}
      activeOpacity={0.85}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.swatch,
          { width: dim, height: dim, backgroundColor: hex },
          SHADOWS.sm,
        ]}
      >
        {showHex && (
          <View style={[styles.hexOverlay, { backgroundColor: hex + 'CC' }]}>
            <Text style={[styles.hexText, { color: overlayText }]}>
              {hex.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      {showLabel && (
        <Text style={styles.label} numberOfLines={2}>
          {name}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    margin: SPACING.xs,
  },
  swatch: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  hexText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  label: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    width: 64,
    lineHeight: 14,
  },
});
