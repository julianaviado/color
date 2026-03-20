import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Share, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// react-native-view-shot requires a dev/production build — not available in Expo Go
let ViewShot = null;
try { ViewShot = require('react-native-view-shot').default; } catch {}
import * as Sharing from 'expo-sharing';
import { signOut } from 'firebase/auth';
import { auth, firebaseEnabled } from '../utils/firebase';
import { saveResultLocally } from '../utils/storage';
import { generateSeasonNarrative } from '../utils/claudeApi';
import { SEASON_PROFILES, SEASON_GRADIENTS } from '../data/seasons';
import { SEASON_ACCENT_COLORS, COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';
import TraitBar from '../components/TraitBar';
import SeasonBadge from '../components/SeasonBadge';
import ColorSwatch from '../components/ColorSwatch';
import ProfileCard from '../components/ProfileCard';

export default function ResultsScreen({ navigation, route }) {
  const { result } = route.params;
  const { primarySeason, subSeason, secondaryBorrowing, borrowingNote, traits } = result;
  const seasonData = SEASON_PROFILES[subSeason];
  const accentColor = SEASON_ACCENT_COLORS[subSeason] ?? COLORS.accent;
  const gradientColors = SEASON_GRADIENTS[primarySeason];

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const cardRef     = useRef(null);
  const [narrative, setNarrative]             = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(true);
  const [sharingCard, setSharingCard]           = useState(false);

  useEffect(() => {
    saveResultLocally(result);

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();

    // Fetch personalized narrative from Claude
    generateSeasonNarrative(result, route.params.answers ?? {})
      .then(text => {
        setNarrative(text);
        setNarrativeLoading(false);
      })
      .catch(() => setNarrativeLoading(false));
  }, []);

  async function handleShareCard() {
    if (!cardRef.current) return;
    setSharingCard(true);
    try {
      const uri = await cardRef.current.capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your colour season',
        });
      } else {
        Alert.alert('Sharing not available on this device.');
      }
    } catch {
      Alert.alert('Could not capture card. Try again.');
    } finally {
      setSharingCard(false);
    }
  }

  async function handleShareText() {
    try {
      await Share.share({
        title: 'My Colour Season — Hue Garden',
        message: `I just discovered I'm a ${subSeason} in the 12-season colour system! 🌿\n\nKey traits:\n• Temperature: ${traits.temperature.label}\n• Depth: ${traits.depth.label}\n• Saturation: ${traits.saturation.label}\n• Contrast: ${traits.contrast.label}\n\nDiscover yours with Hue Garden.`,
      });
    } catch {}
  }

  function handleRetake() {
    navigation.navigate('Quiz');
  }

  function handleSignOut() {
    if (firebaseEnabled && auth) {
      signOut(auth).then(() => navigation.replace('Splash'));
    } else {
      navigation.replace('Splash');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero gradient header */}
        <LinearGradient colors={[...gradientColors.slice(0, 2), '#FAF8F5']} style={styles.hero}>
          <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.heroLabel}>your colour season</Text>
            <Text style={[styles.heroSeason, { color: COLORS.textPrimary }]}>{primarySeason}</Text>
            <SeasonBadge subSeason={subSeason} family={primarySeason} />
          </Animated.View>
        </LinearGradient>

        <View style={styles.body}>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About your season</Text>
            {narrativeLoading ? (
              <View style={styles.narrativeLoader}>
                <ActivityIndicator color={COLORS.accent} size="small" />
                <Text style={styles.narrativeLoaderText}>Personalising your analysis…</Text>
              </View>
            ) : (
              <Text style={styles.description}>
                {narrative ?? seasonData.description}
              </Text>
            )}
          </View>

          {/* Trait Bars */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your colour traits</Text>
            <TraitBar trait="temperature" value={traits.temperature.value} label={traits.temperature.label} />
            <TraitBar trait="depth"       value={traits.depth.value}       label={traits.depth.label} />
            <TraitBar trait="saturation"  value={traits.saturation.value}  label={traits.saturation.label} />
            <TraitBar trait="contrast"    value={traits.contrast.value}    label={traits.contrast.label} />
          </View>

          {/* Secondary borrowing */}
          <View style={[styles.borrowCard, { borderLeftColor: accentColor }]}>
            <Text style={styles.borrowTitle}>Season borrowing</Text>
            <Text style={styles.borrowSeason}>{secondaryBorrowing}</Text>
            <Text style={styles.borrowNote}>{borrowingNote}</Text>
          </View>

          {/* Palette preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your palette</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Palette', { result })}>
                <Text style={styles.sectionLink}>View all →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.swatchRow}>
              {seasonData.palette.slice(0, 6).map(sw => (
                <ColorSwatch key={sw.hex} name={sw.name} hex={sw.hex} size="sm" />
              ))}
            </View>
          </View>

          {/* Seasonal variation callout */}
          {result.seasonalVariation && result.seasonalVariation !== 'none' && (
            <View style={[styles.section, styles.variationCard]}>
              <Text style={styles.variationTitle}>
                {result.seasonalVariation === 'darker_in_summer' ? '☀️  Seasonal depth shift' : '🌿  Subtle seasonal shift'}
              </Text>
              <Text style={styles.variationText}>
                {result.seasonalVariation === 'darker_in_summer'
                  ? `You tan noticeably in summer, which means your best colours deepen slightly — lean into richer, warmer versions of your ${subSeason} palette in summer months. In winter, lighter versions of the same palette will feel more natural.`
                  : `You have a slight seasonal shift. Your core ${subSeason} season stays the same — but give yourself permission to use slightly warmer, deeper tones in summer and softer tones in winter.`}
              </Text>
            </View>
          )}

          {/* Shareable profile card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your profile card</Text>
            {ViewShot ? (
              <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
                <ProfileCard result={result} />
              </ViewShot>
            ) : (
              <ProfileCard result={result} />
            )}
            <View style={styles.shareCardRow}>
              {ViewShot && (
                <TouchableOpacity
                  style={[styles.shareCardBtn, { backgroundColor: accentColor }]}
                  onPress={handleShareCard}
                  activeOpacity={0.85}
                  disabled={sharingCard}
                >
                  {sharingCard
                    ? <ActivityIndicator color="#FAF8F5" size="small" />
                    : <Text style={styles.shareCardBtnText}>↗  Share card</Text>}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.shareTextBtn, !ViewShot && { flex: 1 }]}
                onPress={handleShareText}
                activeOpacity={0.85}
              >
                <Text style={styles.shareTextBtnText}>↗  Share as text</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => navigation.navigate('Gifts', { result })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>🎁  Gift guide</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnGhost]}
              onPress={handleRetake}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnTextMuted}>Retake quiz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  heroContent: { alignItems: 'flex-start' },
  heroLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  heroSeason: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  body: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  sectionLink: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.accent,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    lineHeight: 26,
  },
  narrativeLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  narrativeLoaderText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  borrowCard: {
    borderLeftWidth: 3,
    paddingLeft: SPACING.md,
    marginBottom: SPACING.xl,
  },
  borrowTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  borrowSeason: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  borrowNote: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionBtn: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: {},
  actionBtnSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  actionBtnGhost: {
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 0.3,
  },
  actionBtnTextLight: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: '#FAF8F5',
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 0.3,
  },
  actionBtnTextMuted: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textTertiary,
    letterSpacing: 0.3,
  },
  signOutBtn: {
    alignSelf: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  signOutText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },

  variationCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  variationTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  variationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  shareCardRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  shareCardBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  shareCardBtnText: {
    color: '#FAF8F5',
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  shareTextBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  shareTextBtnText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
});
