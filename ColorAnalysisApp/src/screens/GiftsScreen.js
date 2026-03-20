import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getGiftRecommendations } from '../utils/giftRecommendations';
import { SEASON_GRADIENTS, SEASON_ACCENT_COLORS, COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

export default function GiftsScreen({ navigation, route }) {
  const { result } = route.params;
  const { subSeason, primarySeason } = result;
  const gifts = getGiftRecommendations(primarySeason);
  const accentColor = SEASON_ACCENT_COLORS[subSeason] ?? COLORS.accent;
  const gradientColors = SEASON_GRADIENTS[primarySeason];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        <LinearGradient colors={[...gradientColors.slice(0, 2), '#FAF8F5']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.headerLabel}>curated for your season</Text>
          <Text style={styles.headerTitle}>Gift guide</Text>
          <Text style={styles.headerSub}>{subSeason}</Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.intro}>
            Every item below has been chosen to complement a {subSeason}'s natural colouring —
            perfect for gifting or treating yourself.
          </Text>

          {gifts.map(category => (
            <View key={category.category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              {category.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.giftCard}
                  onPress={() => Linking.openURL(item.url)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.giftDot, { backgroundColor: accentColor }]} />
                  <View style={styles.giftInfo}>
                    <Text style={styles.giftName}>{item.name}</Text>
                    <Text style={styles.giftLink}>Shop →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Gift links may include affiliate referrals. Prices and availability vary by retailer.
            </Text>
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
  backText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textSecondary, letterSpacing: 0.5 },
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
  headerSub: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  body: { padding: SPACING.lg },
  intro: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 26,
    marginBottom: SPACING.xl,
    fontStyle: 'italic',
  },
  categorySection: { marginBottom: SPACING.xl },
  categoryTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  giftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  giftDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    flexShrink: 0,
  },
  giftInfo: { flex: 1 },
  giftName: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  giftLink: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  disclaimer: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  disclaimerText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    lineHeight: 18,
    textAlign: 'center',
  },
});
