import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, SafeAreaView, StatusBar, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { analyzeColorSeason } from '../utils/colorAnalysis';
import { saveQuizAnswersLocally } from '../utils/storage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Quiz structure: text questions first, then guided photo prompts
// ─────────────────────────────────────────────

const TEXT_QUESTIONS = [
  {
    id: 'ethnicity',
    label: 'Your background',
    caption: 'Helps us understand natural skin tone patterns — this is context only, not a deciding factor.',
    type: 'choice',
    options: [
      { label: 'East Asian',           value: 'east_asian' },
      { label: 'South Asian',          value: 'south_asian' },
      { label: 'Southeast Asian / Filipino', value: 'sea_filipino' },
      { label: 'Black / African American',   value: 'black_american' },
      { label: 'Latina / Hispanic',    value: 'latina' },
      { label: 'Middle Eastern',       value: 'middle_eastern' },
      { label: 'White / European',     value: 'white_european' },
      { label: 'Mixed heritage',       value: 'mixed' },
      { label: 'Other',                value: 'other' },
    ],
  },
  {
    id: 'skinDepth',
    label: 'Your natural skin depth',
    caption: 'Think about your bare skin in neutral light, no makeup.',
    type: 'choice',
    options: [
      { label: 'Fair',       value: 'fair',       swatch: '#F9E8DC' },
      { label: 'Light',      value: 'light',      swatch: '#F5D5BE' },
      { label: 'Medium',     value: 'medium',     swatch: '#E0AA80' },
      { label: 'Tan',        value: 'tan',        swatch: '#C87D50' },
      { label: 'Deep',       value: 'deep',       swatch: '#8B5230' },
      { label: 'Very Deep',  value: 'very_deep',  swatch: '#4A2010' },
    ],
  },
  {
    id: 'skinUndertone',
    label: 'Your skin undertone',
    caption: 'Look at your inner wrist in natural daylight. What cast do you see?',
    type: 'choice',
    options: [
      { label: 'Golden / yellow',       value: 'golden_yellow' },
      { label: 'Peachy / apricot',      value: 'peachy' },
      { label: 'Olive / greenish',      value: 'olive_green' },
      { label: 'Neutral / balanced',    value: 'neutral_beige' },
      { label: 'Pink / rosy',           value: 'pink_rosy' },
      { label: 'Bluish pink / cool',    value: 'blue_pink' },
      { label: 'Grayish / ashy',        value: 'gray_ashy' },
    ],
  },
  {
    id: 'skinCondition',
    label: 'Any skin conditions?',
    caption: 'These affect which colors work best near your face.',
    type: 'choice',
    options: [
      { label: 'None',               value: 'none' },
      { label: 'Rosacea',            value: 'rosacea' },
      { label: 'Eczema',             value: 'eczema' },
      { label: 'Sensitivity',        value: 'sensitivity' },
      { label: 'Hyperpigmentation',  value: 'hyperpigmentation' },
    ],
  },
  {
    id: 'skinTexture',
    label: 'How would you describe your skin?',
    caption: 'Pick the closest match.',
    type: 'choice',
    options: [
      { label: 'Very even tone',        value: 'even' },
      { label: 'Olive-toned',           value: 'olive_toned' },
      { label: 'Gets red / flushes',    value: 'redness_prone' },
      { label: 'Uneven / varied',       value: 'very_uneven' },
    ],
  },
  {
    id: 'jewelry',
    label: 'Which metal looks best on you?',
    caption: 'Against bare skin — not with an outfit.',
    type: 'choice',
    options: [
      { label: 'Gold',          value: 'gold' },
      { label: 'Silver',        value: 'silver' },
      { label: 'Both work',     value: 'both' },
    ],
  },
  {
    id: 'bestWhite',
    label: 'Which white looks better on you?',
    caption: 'Hold a bright white and a cream/ivory up to your face. Which one makes your skin look alive?',
    type: 'choice',
    options: [
      { label: 'Bright white',    value: 'pure_white' },
      { label: 'Cream / ivory',   value: 'cream' },
      { label: 'Both seem fine',  value: 'both' },
    ],
  },
  {
    id: 'featureClarity',
    label: 'How would you describe your features overall?',
    caption: 'Contrast between your skin, eyes, and brows — not makeup.',
    type: 'choice',
    options: [
      { label: 'Very striking / defined',   value: 'very_clear' },
      { label: 'Fairly noticeable',         value: 'fairly_clear' },
      { label: 'Soft, blends together',     value: 'somewhat_soft' },
      { label: 'Very subtle / blended',     value: 'very_soft' },
    ],
  },
  {
    id: 'contrast',
    label: 'Overall contrast level',
    caption: 'How much difference is there between your lightest and darkest features (skin vs. brows/lashes)?',
    type: 'choice',
    options: [
      { label: 'Very high — very striking',  value: 'very_high' },
      { label: 'High',                       value: 'high' },
      { label: 'Medium',                     value: 'medium' },
      { label: 'Low — everything blends',    value: 'low' },
    ],
  },
  {
    id: 'seasonalChange',
    label: 'Does your skin tone shift with the seasons?',
    caption: 'Some people are noticeably deeper in summer and lighter in winter. This affects color choices.',
    type: 'choice',
    options: [
      { label: 'Yes — I tan significantly in summer',  value: 'darker_in_summer' },
      { label: 'Slightly, but not much',               value: 'slight_change' },
      { label: 'No — stays pretty consistent',         value: 'none' },
    ],
  },
];

// Guided photo prompts — colors chosen to test the exact dimensions from color_analysis_system.md
const PHOTO_PROMPTS = [
  {
    id: 'photo_white',
    color: 'Pure White',
    colorHex: '#FFFFFF',
    instruction: 'Show us a photo of you in pure white',
    why: 'Reveals undertone instantly. If bright white looks harsh or washed out, you\'re likely warm-toned. If it looks clean and bright, you may be cool or neutral.',
    tip: 'A white shirt, blouse, or hold a white piece of paper near your face. Natural light works best.',
  },
  {
    id: 'photo_cream',
    color: 'Cream or Ivory',
    colorHex: '#FFF8E7',
    instruction: 'Now a photo in cream or ivory',
    why: 'If cream looks glowing and natural while white looks harsh — you\'re almost certainly warm-toned. If cream looks dull — you\'re likely cool.',
    tip: 'A cream sweater, ivory blouse, or beige jacket. Side-by-side with the white photo is very telling.',
  },
  {
    id: 'photo_black',
    color: 'Black',
    colorHex: '#1A1814',
    instruction: 'A photo in black',
    why: 'Black reveals depth and contrast. Does it make you look stark and washed out, or does it ground you? Warm/muted seasons tend to look drained in black.',
    tip: 'A black top near your face. Look for whether it emphasizes shadows, redness, or uneven tone.',
  },
  {
    id: 'photo_warm',
    color: 'Warm Color — Burgundy, Rust, or Camel',
    colorHex: '#8B3A2A',
    instruction: 'A photo in a warm color: burgundy, rust, terracotta, or camel',
    why: 'Warm colors reveal whether your undertone leans warm. If skin looks glowing and healthy here — warm season confirmed.',
    tip: 'Any warm earth tone. A rust sweater, terracotta top, or warm brown jacket. The closer to your face the better.',
  },
  {
    id: 'photo_cool',
    color: 'Cool Color — Navy, Lavender, or Cool Gray',
    colorHex: '#3A4A6B',
    instruction: 'A photo in a cool color: navy, lavender, or cool gray',
    why: 'If cool colors make your skin look ashy, flat, or gray — that\'s a warm undertone signal. If they make you look fresh and bright — cool or neutral.',
    tip: 'A navy shirt, gray sweater, or lavender top. This is often the most telling photo.',
  },
  {
    id: 'photo_fave',
    color: 'Your Most Flattering Color Ever',
    colorHex: '#C4846E',
    instruction: 'Finally — your most flattering outfit ever',
    why: 'The color that consistently gets you the most compliments tells us exactly what your skin responds to best.',
    tip: 'Whatever color you always reach for, or what people say makes you look amazing. No wrong answer.',
  },
];

export default function QuizScreen({ navigation }) {
  const [phase, setPhase] = useState('text');    // 'text' | 'photos'
  const [textIndex, setTextIndex]   = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [answers, setAnswers]       = useState({});
  const [photos, setPhotos]         = useState({});  // promptId → uri
  const [selected, setSelected]     = useState(null);

  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = TEXT_QUESTIONS.length + PHOTO_PROMPTS.length;
  const currentStep = phase === 'text'
    ? textIndex
    : TEXT_QUESTIONS.length + photoIndex;

  function animateTo(fn) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / totalSteps,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }

  async function handleTextSelect(value) {
    setSelected(value);
    const question = TEXT_QUESTIONS[textIndex];
    const updatedAnswers = { ...answers, [question.id]: value };

    setTimeout(async () => {
      await saveQuizAnswersLocally(updatedAnswers);
      setAnswers(updatedAnswers);

      if (textIndex < TEXT_QUESTIONS.length - 1) {
        animateTo(() => { setTextIndex(i => i + 1); setSelected(null); });
      } else {
        animateTo(() => { setPhase('photos'); setPhotoIndex(0); setSelected(null); });
      }
    }, 280);
  }

  async function handlePickPhoto(promptId) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 5],
    });
    if (!picked.canceled && picked.assets[0]) {
      setPhotos(p => ({ ...p, [promptId]: picked.assets[0].uri }));
    }
  }

  async function handleTakePhoto(promptId) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow camera access in Settings.');
      return;
    }
    const taken = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 5],
    });
    if (!taken.canceled && taken.assets[0]) {
      setPhotos(p => ({ ...p, [promptId]: taken.assets[0].uri }));
    }
  }

  function handleNextPhoto() {
    if (photoIndex < PHOTO_PROMPTS.length - 1) {
      animateTo(() => setPhotoIndex(i => i + 1));
    } else {
      finishQuiz();
    }
  }

  function handleSkipPhoto() {
    handleNextPhoto();
  }

  async function finishQuiz() {
    const finalAnswers = { ...answers, photoUris: photos };
    await saveQuizAnswersLocally(finalAnswers);
    const result = analyzeColorSeason(finalAnswers);
    navigation.navigate('ResultsGate', { result, answers: finalAnswers });
  }

  const progress = (currentStep + 1) / totalSteps;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {phase === 'text' ? (
          <TextQuestion
            question={TEXT_QUESTIONS[textIndex]}
            stepIndex={textIndex}
            total={TEXT_QUESTIONS.length}
            selected={selected}
            onSelect={handleTextSelect}
          />
        ) : (
          <PhotoPrompt
            prompt={PHOTO_PROMPTS[photoIndex]}
            stepIndex={photoIndex}
            total={PHOTO_PROMPTS.length}
            photoUri={photos[PHOTO_PROMPTS[photoIndex].id]}
            onPickPhoto={handlePickPhoto}
            onTakePhoto={handleTakePhoto}
            onNext={handleNextPhoto}
            onSkip={handleSkipPhoto}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Text question component
// ─────────────────────────────────────────────

function TextQuestion({ question, stepIndex, total, selected, onSelect }) {
  return (
    <ScrollView contentContainerStyle={styles.questionWrap} showsVerticalScrollIndicator={false}>
      <View style={styles.stepLabel}>
        <Text style={styles.stepNum}>{stepIndex + 1} / {total}</Text>
        <Text style={styles.stepType}>Profile</Text>
      </View>

      <Text style={styles.questionText}>{question.label}</Text>
      {question.caption && (
        <Text style={styles.captionText}>{question.caption}</Text>
      )}

      <View style={styles.optionsWrap}>
        {question.options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionBtn,
              selected === opt.value && styles.optionBtnSelected,
            ]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            {opt.swatch && (
              <View style={[styles.optionSwatch, { backgroundColor: opt.swatch }]} />
            )}
            <Text style={[
              styles.optionLabel,
              selected === opt.value && styles.optionLabelSelected,
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────
// Photo prompt component
// ─────────────────────────────────────────────

function PhotoPrompt({ prompt, stepIndex, total, photoUri, onPickPhoto, onTakePhoto, onNext, onSkip }) {
  return (
    <ScrollView contentContainerStyle={styles.questionWrap} showsVerticalScrollIndicator={false}>
      <View style={styles.stepLabel}>
        <Text style={styles.stepNum}>{stepIndex + 1} / {total}</Text>
        <Text style={styles.stepType}>Photo</Text>
      </View>

      {/* Color swatch + instruction */}
      <View style={styles.promptColorRow}>
        <View style={[styles.promptSwatch, { backgroundColor: prompt.colorHex }]} />
        <Text style={styles.promptColor}>{prompt.color}</Text>
      </View>

      <Text style={styles.questionText}>{prompt.instruction}</Text>

      {/* Why we ask */}
      <View style={styles.whyCard}>
        <Text style={styles.whyLabel}>Why this color</Text>
        <Text style={styles.whyText}>{prompt.why}</Text>
      </View>

      {/* Photo tip */}
      <View style={styles.tipCard}>
        <Text style={styles.tipLabel}>📸  Tip</Text>
        <Text style={styles.tipText}>{prompt.tip}</Text>
      </View>

      {/* Photo preview or upload buttons */}
      {photoUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.changePhotoBtn}
            onPress={() => onPickPhoto(prompt.id)}
          >
            <Text style={styles.changePhotoBtnText}>Change photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadRow}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => onTakePhoto(prompt.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.uploadBtnText}>📷  Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadBtn, styles.uploadBtnSecondary]}
            onPress={() => onPickPhoto(prompt.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.uploadBtnTextSecondary}>🖼  Upload</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation */}
      <TouchableOpacity
        style={[styles.nextBtn, photoUri && styles.nextBtnActive]}
        onPress={onNext}
        activeOpacity={0.85}
      >
        <Text style={[styles.nextBtnText, photoUri && styles.nextBtnTextActive]}>
          {stepIndex < total - 1 ? 'Next photo →' : 'See my results →'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipBtnText}>Skip this one</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  progressTrack: {
    height: 2,
    backgroundColor: COLORS.borderLight,
  },
  progressFill: {
    height: 2,
    backgroundColor: COLORS.accent,
  },

  container: { flex: 1 },

  questionWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },

  stepLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  stepNum: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  stepType: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  questionText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.light,
    lineHeight: 34,
    marginBottom: SPACING.sm,
  },
  captionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },

  optionsWrap: { gap: SPACING.sm },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  optionBtnSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  optionSwatch: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  optionLabelSelected: {
    color: COLORS.accentDark,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  // Photo prompt
  promptColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  promptSwatch: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promptColor: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  whyCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  whyLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  whyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  tipCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accent,
  },
  tipLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.accent,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  tipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  uploadRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  uploadBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.textPrimary,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  uploadBtnSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  uploadBtnText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  uploadBtnTextSecondary: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  previewWrap: { marginBottom: SPACING.md },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    resizeMode: 'cover',
  },
  changePhotoBtn: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
  },
  changePhotoBtnText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },

  nextBtn: {
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  nextBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  nextBtnText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textTertiary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  nextBtnTextActive: {
    color: '#FAF8F5',
  },

  skipBtn: { alignSelf: 'center', paddingVertical: SPACING.sm },
  skipBtnText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },
});
