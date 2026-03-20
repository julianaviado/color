import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SEASON_PROFILES } from '../data/seasons';
import { SEASON_ACCENT_COLORS, SEASON_GRADIENTS, COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';
import ColorSwatch from '../components/ColorSwatch';

const TABS = ['Your palette', 'Avoid', 'Borrow'];

export default function PaletteScreen({ navigation, route }) {
  const { result } = route.params;
  const { subSeason, primarySeason, secondaryBorrowing } = result;
  const seasonData = SEASON_PROFILES[subSeason];
  const borrowData = SEASON_PROFILES[secondaryBorrowing];
  const accentColor = SEASON_ACCENT_COLORS[subSeason] ?? COLORS.accent;
  const gradientColors = SEASON_GRADIENTS[primarySeason];

  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Your palette', swatches: seasonData.palette, tips: seasonData.shoppingTips },
    {
      label: 'Avoid',
      swatches: (seasonData.avoid ?? []).map((hex, i) => ({ hex, name: seasonData.avoidNames?.[i] ?? 'Avoid' })),
      tips: ['These shades can compete with or dull your natural colouring.'],
    },
    {
      label: `Borrow from\n${secondaryBorrowing}`,
      swatches: borrowData ? borrowData.palette.slice(0, 8) : [],
      tips: [seasonData.borrowingNote],
    },
  ];

  const active = tabs[activeTab];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={[...gradientColors.slice(0, 2), '#FAF8F5']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.headerLabel}>colour palette</Text>
          <Text style={styles.headerTitle}>{subSeason}</Text>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabs}>
          {tabs.map((tab, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveTab(i)}
              style={[styles.tab, activeTab === i && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
            >
              <Text style={[styles.tabText, activeTab === i && { color: accentColor }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.body}>
          {/* Swatches grid */}
          <View style={styles.swatchGrid}>
            {active.swatches.map(sw => (
              <ColorSwatch key={sw.hex} name={sw.name} hex={sw.hex} size="lg" />
            ))}
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Shopping tips</Text>
            {active.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: accentColor }]} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
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
  },
  back: { marginBottom: SPACING.lg },
  backText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  headerLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: '300',
    color: COLORS.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 16,
  },
  body: {
    padding: SPACING.lg,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: SPACING.xl,
  },
  tipsSection: {
    marginTop: SPACING.md,
  },
  tipsTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
});
