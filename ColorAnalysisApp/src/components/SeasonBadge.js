import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SEASON_ACCENT_COLORS, COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';

export default function SeasonBadge({ subSeason, family }) {
  const accentColor = SEASON_ACCENT_COLORS[subSeason] ?? COLORS.accent;
  const r = parseInt(accentColor.slice(1, 3), 16);
  const g = parseInt(accentColor.slice(3, 5), 16);
  const b = parseInt(accentColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = luminance > 0.55 ? '#1A1814' : '#FAF8F5';

  return (
    <View style={[styles.badge, { backgroundColor: accentColor + '22', borderColor: accentColor + '44' }]}>
      <View style={[styles.dot, { backgroundColor: accentColor }]} />
      <Text style={[styles.text, { color: accentColor }]}>{subSeason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 0.4,
  },
});
