import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { analyzeColorSeason } from '../utils/colorAnalysis';
import { saveQuizAnswersLocally } from '../utils/storage';
import { QUIZ_QUESTIONS } from '../data/seasons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');
const TOTAL = QUIZ_QUESTIONS.length;

export default function QuizScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const question = QUIZ_QUESTIONS[currentIndex];
  const progress = (currentIndex + 1) / TOTAL;

  function animateToNext(nextFn) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      nextFn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }

  async function handleSelect(value) {
    setSelected(value);
    const updatedAnswers = { ...answers, [question.id]: value };

    // Auto-advance after brief delay
    setTimeout(async () => {
      await saveQuizAnswersLocally(updatedAnswers);

      if (currentIndex < TOTAL - 1) {
        animateToNext(() => {
          setAnswers(updatedAnswers);
          setCurrentIndex(i => i + 1);
          setSelected(null);
        });
      } else {
        // Quiz complete — run analysis and go to results gate
        const result = analyzeColorSeason(updatedAnswers);
        navigation.navigate('ResultsGate', { result, answers: updatedAnswers });
      }
    }, 320);
  }

  function handleBack() {
    if (currentIndex === 0) return;
    animateToNext(() => {
      setCurrentIndex(i => i - 1);
      setSelected(null);
    });
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${((currentIndex + 1) / TOTAL) * 100}%` }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        {currentIndex > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.step}>{currentIndex + 1} / {TOTAL}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Question */}
          <Text style={styles.question}>{question.question}</Text>
          {question.subtitle && (
            <Text style={styles.subtitle}>{question.subtitle}</Text>
          )}

          {/* Options */}
          <View style={styles.options}>
            {question.options.map(opt => {
              const isSelected = selected === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => handleSelect(opt.value)}
                  activeOpacity={0.7}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                  ]}
                >
                  <Text style={styles.optionIcon}>{opt.icon}</Text>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && <View style={styles.optionCheck} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressTrack: {
    height: 2,
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height: 2,
    backgroundColor: COLORS.accent,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  step: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    paddingTop: SPACING.md,
  },
  question: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '400',
    color: COLORS.textPrimary,
    lineHeight: 36,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xl,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  options: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  optionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  optionIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  optionLabelSelected: {
    color: COLORS.accentDark,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  optionCheck: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
  },
});
