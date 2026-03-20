import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SEASON_GRADIENTS, SEASON_ACCENT_COLORS, COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';
import { SEASON_PROFILES } from '../data/seasons';

const CARD_WIDTH  = Dimensions.get('window').width - SPACING.lg * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

// forwardRef so react-native-view-shot can capture this component
const ProfileCard = forwardRef(function ProfileCard({ result, name }, ref) {
  const { primarySeason, subSeason, traits, seasonalVariation } = result;
  const seasonData  = SEASON_PROFILES[subSeason] ?? {};
  const accentColor = SEASON_ACCENT_COLORS[subSeason] ?? COLORS.accent;
  const gradients   = SEASON_GRADIENTS[primarySeason] ?? ['#FAF8F5', '#F0EAE4'];

  const palette = (seasonData.palette ?? []).slice(0, 8);

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <LinearGradient
        colors={[gradients[0], gradients[1] ?? gradients[0], '#FAF8F5']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>hue garden</Text>
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
        </View>

        {/* Season name */}
        <View style={styles.seasonBlock}>
          <Text style={styles.seasonLabel}>colour season</Text>
          <Text style={[styles.seasonName, { color: COLORS.textPrimary }]}>
            {primarySeason}
          </Text>
          <Text style={[styles.subSeasonName, { color: accentColor }]}>
            {subSeason}
          </Text>
        </View>

        {/* Palette swatches */}
        <View style={styles.swatchRow}>
          {palette.map((sw, i) => (
            <View
              key={sw.hex + i}
              style={[
                styles.swatch,
                { backgroundColor: sw.hex },
                i === 0 && styles.swatchFirst,
                i === palette.length - 1 && styles.swatchLast,
              ]}
            />
          ))}
        </View>

        {/* Traits */}
        <View style={styles.traitsGrid}>
          <TraitPill label="Temp"       value={traits.temperature.label} accent={accentColor} />
          <TraitPill label="Depth"      value={traits.depth.label}       accent={accentColor} />
          <TraitPill label="Saturation" value={traits.saturation.label}  accent={accentColor} />
          <TraitPill label="Contrast"   value={traits.contrast.label}    accent={accentColor} />
        </View>

        {/* Seasonal variation note */}
        {seasonalVariation && seasonalVariation !== 'none' && (
          <View style={styles.variationBadge}>
            <Text style={styles.variationText}>
              {seasonalVariation === 'darker_in_summer'
                ? '☀️  Deeper in summer — adjust warm depth seasonally'
                : '🌿  Slight seasonal shift — core season stays the same'}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: accentColor + '40' }]} />

        {/* Footer */}
        <View style={styles.footer}>
          {name ? <Text style={styles.footerName}>{name}</Text> : null}
          <Text style={styles.footerTag}>huegarden.app</Text>
        </View>
      </LinearGradient>
    </View>
  );
});

function TraitPill({ label, value, accent }) {
  return (
    <View style={[styles.pill, { borderColor: accent + '50' }]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: '#FAF8F5',
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  gradient: {
    flex: 1,
    padding: SPACING.lg,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  appName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    letterSpacing: 3,
    textTransform: 'lowercase',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  seasonBlock: {
    marginBottom: SPACING.lg,
  },
  seasonLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  seasonName: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.light,
    letterSpacing: 0.5,
    lineHeight: 40,
  },
  subSeasonName: {
    fontSize: TYPOGRAPHY.sizes.base,
    letterSpacing: 1,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: 2,
  },

  swatchRow: {
    flexDirection: 'row',
    height: 48,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  swatch: {
    flex: 1,
  },
  swatchFirst: { borderTopLeftRadius: RADIUS.lg, borderBottomLeftRadius: RADIUS.lg },
  swatchLast:  { borderTopRightRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg },

  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  pillLabel: {
    fontSize: 9,
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  pillValue: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },

  variationBadge: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  variationText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  footerTag: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
});

export default ProfileCard;
