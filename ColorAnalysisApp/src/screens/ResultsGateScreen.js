import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SEASON_GRADIENTS, COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

const { height } = Dimensions.get('window');

// Teaser — shows the season FAMILY but blurs the sub-season
// to create the paywall moment
export default function ResultsGateScreen({ navigation, route }) {
  const { result, answers } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const gradientColors = SEASON_GRADIENTS[result.primarySeason];

  function handleContinue() {
    navigation.navigate('Auth', { result, answers, mode: 'signup' });
  }

  function handleLogin() {
    navigation.navigate('Auth', { result, answers, mode: 'login' });
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Teaser */}
          <Text style={styles.label}>your colour season</Text>
          <Text style={styles.seasonFamily}>{result.primarySeason}</Text>
          <Text style={styles.blurred}>✦ ── ── ── ──</Text>
          <Text style={styles.blurHint}>sub-season revealed after sign up</Text>

          <View style={styles.divider} />

          {/* Value props */}
          <View style={styles.benefits}>
            {[
              '✦  Your full 12-season analysis',
              '✦  Personal colour palette (12 shades)',
              '✦  Live camera colour matching',
              '✦  Gift guide for your season',
              '✦  Shareable profile card',
            ].map(b => (
              <Text key={b} style={styles.benefit}>{b}</Text>
            ))}
          </View>

          {/* CTAs */}
          <TouchableOpacity onPress={handleContinue} style={styles.primaryBtn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Create free account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogin} style={styles.secondaryBtn} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  seasonFamily: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.hero,
    fontWeight: '300',
    color: COLORS.textPrimary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  blurred: {
    fontSize: TYPOGRAPHY.sizes.xl,
    color: COLORS.textTertiary,
    letterSpacing: 8,
    marginBottom: SPACING.xs,
  },
  blurHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.accent,
    marginVertical: SPACING.lg,
  },
  benefits: {
    alignSelf: 'stretch',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  benefit: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: SPACING.sm,
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.sizes.sm,
    letterSpacing: 0.3,
  },
});
