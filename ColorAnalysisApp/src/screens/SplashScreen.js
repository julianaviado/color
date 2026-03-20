import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { loadResultLocally } from '../utils/storage';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

const { height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      // Check if user is already logged in
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          // Already authenticated — go straight to results
          const cached = await loadResultLocally();
          if (cached) {
            navigation.replace('Results', { result: cached, answers: null });
          } else {
            navigation.replace('Quiz');
          }
        } else {
          navigation.replace('Quiz');
        }
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#FAF8F5', '#F0E8DF', '#FAF8F5']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.wordmark}>hue garden</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>discover your colour story</Text>
      </Animated.View>

      <Text style={styles.version}>colour analysis · 12 seasons</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 38,
    fontFamily: 'Georgia',
    fontWeight: '300',
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.accent,
    marginVertical: SPACING.md,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    letterSpacing: 3,
    textTransform: 'lowercase',
  },
  version: {
    position: 'absolute',
    bottom: 50,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
