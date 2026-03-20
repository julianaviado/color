import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Dimensions, Animated, ActivityIndicator,
  Alert, Platform, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { SEASON_PROFILES } from '../data/seasons';
import { hexToRgb, getMatchRating, findClosestPaletteColors } from '../utils/colorAnalysis';
import { extractColorFromBase64PNG, getNearestColorName } from '../utils/pngColorExtract';
import { analyzeColorWithClaude } from '../utils/claudeApi';
import { saveColor } from '../utils/storage';
import { auth } from '../utils/firebase';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');
const SAMPLE_SIZE = 80; // px — area to sample around the crosshair

export default function ColorMatchScreen({ navigation, route }) {
  const { result } = route.params;
  const { subSeason, primarySeason } = result;
  const palette = SEASON_PROFILES[subSeason]?.palette ?? [];

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const intervalRef = useRef(null);

  // UI state
  const [mode, setMode] = useState('live'); // 'live' | 'photo'
  const [isScanning, setIsScanning] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  // Color reading state
  const [sampledColor, setSampledColor]   = useState(null); // { r, g, b }
  const [colorName, setColorName]         = useState('—');
  const [matchRating, setMatchRating]     = useState(null);
  const [closestSwatches, setClosestSwatches] = useState([]);
  const [claudeResult, setClaudeResult]   = useState(null);
  const [deepAnalyzing, setDeepAnalyzing] = useState(false);

  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resultFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isScanning]);

  // Start live scanning on mount
  useEffect(() => {
    if (mode === 'live' && permission?.granted) {
      startLiveScanning();
    }
    return () => stopLiveScanning();
  }, [mode, permission]);

  function startLiveScanning() {
    setIsScanning(true);
    intervalRef.current = setInterval(sampleCenterColor, 500);
  }

  function stopLiveScanning() {
    setIsScanning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  const sampleCenterColor = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.1,
        skipProcessing: true,
        base64: false,
      });

      const { width: pw, height: ph } = photo;
      const cropX = Math.max(0, pw / 2 - SAMPLE_SIZE / 2);
      const cropY = Math.max(0, ph / 2 - SAMPLE_SIZE / 2);

      const cropped = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { crop: { originX: cropX, originY: cropY, width: SAMPLE_SIZE, height: SAMPLE_SIZE } },
          { resize: { width: 1, height: 1 } },
        ],
        { base64: true, format: ImageManipulator.SaveFormat.PNG }
      );

      const rgb = extractColorFromBase64PNG(cropped.base64);
      if (rgb) updateColorReading(rgb);
    } catch {
      // Camera may not be ready yet — silently ignore
    }
  }, []);

  function updateColorReading(rgb) {
    setSampledColor(rgb);
    const name = getNearestColorName(rgb.r, rgb.g, rgb.b);
    setColorName(name);

    const closest = findClosestPaletteColors(rgb, palette, 3);
    setClosestSwatches(closest);

    const rating = getMatchRating(closest[0]?.distance ?? 200);
    setMatchRating(rating);

    Animated.timing(resultFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }

  async function handleDeepAnalysis() {
    if (!cameraRef.current && !capturedPhoto) return;
    stopLiveScanning();
    setDeepAnalyzing(true);
    setClaudeResult(null);

    try {
      const photo = capturedPhoto ?? await cameraRef.current.takePictureAsync({ quality: 0.6, base64: true });
      // Get base64 — either from direct capture or by re-encoding via ImageManipulator
      let imageBase64 = photo.base64;
      if (!imageBase64) {
        const encoded = await ImageManipulator.manipulateAsync(
          photo.uri, [], { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );
        imageBase64 = encoded.base64;
      }

      const analysis = await analyzeColorWithClaude(imageBase64, result);
      if (analysis) {
        setClaudeResult(analysis);
        setColorName(analysis.colorName);
        // Override match rating with Claude's rating
        setMatchRating({
          label: analysis.verdict === 'keep' ? `Keep — ${analysis.rating}/10` : `Avoid — ${analysis.rating}/10`,
          emoji: analysis.verdict === 'keep' ? '✨' : '❌',
          color: analysis.verdict === 'keep' ? COLORS.success : COLORS.error,
        });
      } else {
        Alert.alert('Offline', 'Claude analysis unavailable. Showing offline colour match instead.');
      }
    } catch {
      Alert.alert('Error', 'Could not complete deep analysis. Try again.');
    } finally {
      setDeepAnalyzing(false);
      if (mode === 'live') startLiveScanning();
    }
  }

  async function handlePickPhoto() {
    stopLiveScanning();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      setCapturedPhoto(asset);
      setMode('photo');
      await sampleFromUri(asset.uri, asset.width, asset.height);
    }
  }

  async function sampleFromUri(uri, w, h) {
    try {
      const cropX = Math.max(0, w / 2 - SAMPLE_SIZE / 2);
      const cropY = Math.max(0, h / 2 - SAMPLE_SIZE / 2);
      const cropped = await ImageManipulator.manipulateAsync(
        uri,
        [
          { crop: { originX: cropX, originY: cropY, width: SAMPLE_SIZE, height: SAMPLE_SIZE } },
          { resize: { width: 1, height: 1 } },
        ],
        { base64: true, format: ImageManipulator.SaveFormat.PNG }
      );
      const rgb = extractColorFromBase64PNG(cropped.base64);
      if (rgb) updateColorReading(rgb);
    } catch {}
  }

  async function handleSaveColor(verdict) {
    if (!sampledColor) return;
    const hex = rgbToHex(sampledColor.r, sampledColor.g, sampledColor.b);
    const entry = {
      hex,
      name: claudeResult?.colorName ?? colorName,
      rating: claudeResult?.rating ?? Math.round((1 - (closestSwatches[0]?.distance ?? 200) / 200) * 10),
      verdict,
      reason: claudeResult?.reason ?? '',
      savedAt: Date.now().toString(),
    };
    await saveColor(auth.currentUser?.uid, entry);

    Alert.alert(
      verdict === 'keep' ? '✨ Saved to Keep' : 'Saved to Avoid',
      `${entry.name} has been added to your colour wardrobe.`
    );
  }

  function handleBackToLive() {
    setCapturedPhoto(null);
    setMode('live');
    startLiveScanning();
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // ── Permission not granted ──────────────────
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permContainer}>
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permSub}>
          hue garden needs your camera to match colours while you shop.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={styles.permBtnText}>Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.permBack}>
          <Text style={styles.permBackText}>Not now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const swatchBgColor = sampledColor
    ? rgbToHex(sampledColor.r, sampledColor.g, sampledColor.b)
    : '#808080';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera / Photo view */}
      {mode === 'live' ? (
        <CameraView ref={cameraRef} style={styles.camera} facing="front" flash="off">
          {/* Top bar */}
          <SafeAreaView>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => { stopLiveScanning(); navigation.goBack(); }}>
                <Text style={styles.topBarBtn}>← back</Text>
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>colour matcher</Text>
              <TouchableOpacity onPress={handlePickPhoto}>
                <Text style={styles.topBarBtn}>photo</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Crosshair reticle */}
          <View style={styles.reticleContainer}>
            <Animated.View style={[styles.reticle, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.reticleCorner, styles.reticleTopLeft]} />
              <View style={[styles.reticleCorner, styles.reticleTopRight]} />
              <View style={[styles.reticleCorner, styles.reticleBottomLeft]} />
              <View style={[styles.reticleCorner, styles.reticleBottomRight]} />
            </Animated.View>
          </View>
        </CameraView>
      ) : (
        <View style={[styles.camera, { backgroundColor: '#000' }]}>
          <SafeAreaView>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={handleBackToLive}>
                <Text style={styles.topBarBtn}>← live</Text>
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>photo analysis</Text>
              <TouchableOpacity onPress={handlePickPhoto}>
                <Text style={styles.topBarBtn}>change</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <View style={styles.reticleContainer}>
            <View style={styles.reticle}>
              <View style={[styles.reticleCorner, styles.reticleTopLeft]} />
              <View style={[styles.reticleCorner, styles.reticleTopRight]} />
              <View style={[styles.reticleCorner, styles.reticleBottomLeft]} />
              <View style={[styles.reticleCorner, styles.reticleBottomRight]} />
            </View>
          </View>
        </View>
      )}

      {/* Color readout panel */}
      <Animated.View style={[styles.readout, { opacity: resultFade }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.readoutScroll}>

          {/* Big color swatch + name */}
          <View style={styles.colorRow}>
            <View style={[styles.bigSwatch, { backgroundColor: swatchBgColor }]} />
            <View style={styles.colorInfo}>
              <Text style={styles.colorNameText}>{colorName}</Text>
              {sampledColor && (
                <Text style={styles.hexText}>
                  {rgbToHex(sampledColor.r, sampledColor.g, sampledColor.b).toUpperCase()}
                </Text>
              )}
              {matchRating && (
                <View style={[styles.ratingBadge, { backgroundColor: matchRating.color + '22' }]}>
                  <Text style={[styles.ratingText, { color: matchRating.color }]}>
                    {matchRating.emoji}  {matchRating.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Claude analysis reason */}
          {claudeResult?.reason && (
            <Text style={styles.reasonText}>{claudeResult.reason}</Text>
          )}

          {/* Closest palette colours */}
          {closestSwatches.length > 0 && (
            <View style={styles.closestSection}>
              <Text style={styles.closestLabel}>closest in your palette</Text>
              <View style={styles.closestRow}>
                {closestSwatches.map(sw => (
                  <View key={sw.hex} style={styles.closestItem}>
                    <View style={[styles.closestSwatch, { backgroundColor: sw.hex }]} />
                    <Text style={styles.closestName} numberOfLines={2}>{sw.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Keep / Forget buttons */}
          {matchRating && (
            <View style={styles.verdictRow}>
              <TouchableOpacity
                style={[styles.verdictBtn, styles.keepBtn]}
                onPress={() => handleSaveColor('keep')}
                activeOpacity={0.85}
              >
                <Text style={styles.verdictBtnText}>✨  Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.verdictBtn, styles.forgetBtn]}
                onPress={() => handleSaveColor('avoid')}
                activeOpacity={0.85}
              >
                <Text style={styles.verdictBtnTextDark}>✕  Forget</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Deep analysis CTA */}
          <TouchableOpacity
            onPress={handleDeepAnalysis}
            style={styles.deepBtn}
            activeOpacity={0.85}
            disabled={deepAnalyzing}
          >
            {deepAnalyzing ? (
              <View style={styles.deepBtnInner}>
                <ActivityIndicator color={COLORS.textPrimary} size="small" />
                <Text style={styles.deepBtnText}>  Analysing with AI…</Text>
              </View>
            ) : (
              <Text style={styles.deepBtnText}>◎  Deep analysis with AI</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

const RETICLE_SIZE = 120;
const PANEL_HEIGHT = height * 0.42;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { height: height - PANEL_HEIGHT },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  topBarBtn: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.sm,
    letterSpacing: 0.5,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.xs,
    letterSpacing: 3,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  reticleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    position: 'relative',
  },
  reticleCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
  },
  reticleTopLeft:     { top: 0,  left: 0,  borderTopWidth: 2, borderLeftWidth: 2 },
  reticleTopRight:    { top: 0,  right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  reticleBottomLeft:  { bottom: 0, left: 0,  borderBottomWidth: 2, borderLeftWidth: 2 },
  reticleBottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },

  // Readout panel
  readout: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  readoutScroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  bigSwatch: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  colorInfo: { flex: 1, gap: SPACING.xs },
  colorNameText: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '300',
    color: COLORS.textPrimary,
  },
  hexText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 2,
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  closestSection: { marginBottom: SPACING.md },
  closestLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  closestRow: { flexDirection: 'row', gap: SPACING.md },
  closestItem: { alignItems: 'center', flex: 1 },
  closestSwatch: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    ...SHADOWS.sm,
  },
  closestName: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  verdictRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  verdictBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  keepBtn: { backgroundColor: COLORS.success },
  forgetBtn: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  verdictBtnText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  verdictBtnTextDark: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  deepBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  deepBtnInner: { flexDirection: 'row', alignItems: 'center' },
  deepBtnText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  // Permission screen
  permContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  permTitle: {
    fontFamily: 'Georgia',
    fontSize: TYPOGRAPHY.sizes.xl,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  permSub: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  permBtn: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  permBtnText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  permBack: { paddingVertical: SPACING.sm },
  permBackText: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.textTertiary },
});
