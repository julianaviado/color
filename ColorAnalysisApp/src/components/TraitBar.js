import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';

const TRAIT_CONFIG = {
  temperature: {
    leftLabel:  'Warm',
    rightLabel: 'Cool',
    gradient:   ['#E8A040', '#3498DB'],
  },
  depth: {
    leftLabel:  'Light',
    rightLabel: 'Deep',
    gradient:   ['#F5ECD8', '#1A1008'],
  },
  saturation: {
    leftLabel:  'Muted',
    rightLabel: 'Bright',
    gradient:   ['#C4B4B4', '#FF3D3D'],
  },
  contrast: {
    leftLabel:  'Low',
    rightLabel: 'High',
    gradient:   ['#D0CCC8', '#0A0A0A'],
  },
};

export default function TraitBar({ trait, value, label }) {
  const config = TRAIT_CONFIG[trait] ?? TRAIT_CONFIG.temperature;
  // value is 0–10; convert to 0–1 for position
  const position = Math.min(1, Math.max(0, value / 10));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.traitName}>{capitalize(trait)}</Text>
        <Text style={styles.traitLabel}>{label}</Text>
      </View>

      <View style={styles.barWrapper}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bar}
        />
        {/* Marker */}
        <View style={[styles.marker, { left: `${position * 100}%` }]} />
      </View>

      <View style={styles.scaleLabels}>
        <Text style={styles.scaleText}>{config.leftLabel}</Text>
        <Text style={styles.scaleText}>{config.rightLabel}</Text>
      </View>
    </View>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  traitName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  traitLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  barWrapper: {
    height: 8,
    borderRadius: RADIUS.full,
    overflow: 'visible',
    position: 'relative',
  },
  bar: {
    height: 8,
    borderRadius: RADIUS.full,
  },
  marker: {
    position: 'absolute',
    top: -5,
    width: 18,
    height: 18,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.textPrimary,
    marginLeft: -9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  scaleText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
});
