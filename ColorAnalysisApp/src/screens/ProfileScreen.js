import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SEASON_PROFILES } from '../data/seasons';
import { SEASON_ACCENT_COLORS, SEASON_GRADIENTS, COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';
import ColorSwatch from '../components/ColorSwatch';
import SeasonBadge from '../components/SeasonBadge';

export default function ProfileScreen({ navigation, route }) {
  const { result } = route.params;
  const { primarySeason, subSeason, traits } = result;
  const seasonData = SEASON_PROFILES[subSeason];
  const accentColor = SEASON_ACCENT_COLORS[subSeason] ?? COLORS.accent;
  const gradientColors = SEASON_GRADIENTS[primarySeason];

  async function handleShare() {
    try {
      await Share.share({
        title: `${subSeason} — hue garden`,
        message:
          `My colour season: ${subSeason}\n\n` +
          `✦ Temperature: ${traits.temperature.label}\n` +
          `✦ Depth: ${traits.depth.label}\n` +
          `✦ Saturation: ${traits.saturation.label}\n` +
          `✦ Contrast: ${traits.contrast.label}\n\n` +
          `Best colours: ${seasonData.palette.slice(0, 4).map(p => p.name).join(', ')}\n\n` +
          `Discover your season → hue garden`,
      });
    } catch {}
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        <LinearGradient colors={[...gradientColors.slice(0, 2), '#FAF8F5']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.headerLabel}>colour profile</Text>
          <Text style={styles.headerSeason}>{primarySeason}</Text>
          <SeasonBadge subSeason={subSeason} family={primarySeason} />

          <View style={styles.traitsRow}>
            {[
              { label: 'Temp',       value: traits.temperature.label },
              { label: 'Depth',      value: traits.depth.label },
              { label: 'Saturation', value: traits.saturation.label },
              { label: 'Contrast',   value: traits.contrast.label },
            ].map(t => (
              <View key={t.label} style={styles.traitPill}>
                <Text style={styles.traitPillLabel}>{t.label}</Text>
                <Text style={styles.traitPillValue}>{t.value}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Your palette</Text>
          <View style={styles.swatchGrid}>
            {seasonData.palette.map(sw => (
              <ColorSwatch key={sw.hex} name={sw.name} hex={sw.hex} size="md" />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: accentColor }]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Text style={styles.shareBtnText}>↗  Share your colour profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shopFriendBtn}
            onPress={() => navigation.navigate('ColorMatch', { result })}
            activeOpacity={0.85}
          >
            <Text style={styles.shopFriendText}>◎  Shop for a friend with this palette</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  back: { marginBottom: SPACING.sm },
  backText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary },
  headerLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headerSeason: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '300',
    color: COLORS.textPrimary,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  traitPill: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  traitPillLabel: {
    fontSize: TYPOGRAPHY.sizes.xs - 1,
    color: COLORS.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  traitPillValue: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  body: { padding: SPACING.lg },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.xl,
  },
  shareBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  shareBtnText: {
    color: '#FAF8F5',
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 0.4,
  },
  shopFriendBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  shopFriendText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.base,
    letterSpacing: 0.4,
  },
});
