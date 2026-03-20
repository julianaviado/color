import { SEASON_PROFILES } from '../data/seasons';

// ─────────────────────────────────────────────
// Scoring Tables
// ─────────────────────────────────────────────

const HAIR_TEMP = {
  platinum: 5.5, golden_blonde: 2.0, strawberry_blonde: 2.5,
  auburn: 3.0, medium_brown: 5.0, dark_brown: 5.5, ash: 7.5, black: 6.0,
};

const HAIR_DEPTH = {
  platinum: 1.0, golden_blonde: 2.0, strawberry_blonde: 2.5,
  auburn: 4.0, medium_brown: 5.0, dark_brown: 7.5, ash: 3.5, black: 9.0,
};

const EYE_TEMP = {
  dark_brown: 3.0, hazel: 3.5, amber: 2.0,
  blue_green: 6.0, light_blue: 8.0, grey: 9.0,
};

const SKIN_UNDERTONE_TEMP = {
  peachy: 2.0, golden_olive: 2.5, pink_rosy: 7.5, neutral_beige: 5.0, blue_pink: 9.0,
};

const SKIN_DEPTH_MAP = {
  very_fair: 1.0, fair: 2.5, light_medium: 4.0, medium_tan: 6.0, deep: 8.0, very_deep: 10.0,
};

const CONTRAST_MAP = {
  very_high: 9.5, high: 7.0, medium: 5.0, low: 2.5,
};

// ─────────────────────────────────────────────
// Main Analysis Function
// ─────────────────────────────────────────────

export function analyzeColorSeason(answers) {
  // ── Temperature (0 = very warm, 10 = very cool) ──
  const tempScores = [];
  if (answers.veinColor === 'blue_purple') tempScores.push(9.0);
  else if (answers.veinColor === 'green') tempScores.push(2.0);
  else tempScores.push(5.0);

  if (HAIR_TEMP[answers.hairColor] !== undefined) tempScores.push(HAIR_TEMP[answers.hairColor]);
  if (EYE_TEMP[answers.eyeColor] !== undefined) tempScores.push(EYE_TEMP[answers.eyeColor]);
  if (SKIN_UNDERTONE_TEMP[answers.skinUndertone] !== undefined) tempScores.push(SKIN_UNDERTONE_TEMP[answers.skinUndertone]);

  if (answers.bestWhite === 'pure_white') tempScores.push(8.0);
  else if (answers.bestWhite === 'cream') tempScores.push(2.0);
  else tempScores.push(5.0);

  if (answers.jewelry === 'gold') tempScores.push(2.0);
  else if (answers.jewelry === 'silver') tempScores.push(8.5);
  else tempScores.push(5.0);

  const temperature = average(tempScores);

  // ── Depth (0 = very light, 10 = very deep) ──
  const depthScores = [];
  if (HAIR_DEPTH[answers.hairColor] !== undefined) depthScores.push(HAIR_DEPTH[answers.hairColor]);
  if (SKIN_DEPTH_MAP[answers.skinDepth] !== undefined) depthScores.push(SKIN_DEPTH_MAP[answers.skinDepth]);

  const depth = depthScores.length > 0 ? average(depthScores) : 5.0;

  // ── Saturation (0 = muted, 10 = vivid) ──
  const satScores = [];
  if (answers.featureClarity === 'very_clear') satScores.push(9.5);
  else if (answers.featureClarity === 'fairly_clear') satScores.push(7.0);
  else if (answers.featureClarity === 'somewhat_soft') satScores.push(3.5);
  else if (answers.featureClarity === 'very_soft') satScores.push(1.5);

  const saturation = satScores.length > 0 ? average(satScores) : 5.0;

  // ── Contrast ──
  const contrastVal = CONTRAST_MAP[answers.contrast] ?? 5.0;
  // Cross-check against depth spread
  const hairDepthVal = HAIR_DEPTH[answers.hairColor] ?? 5;
  const skinDepthVal = SKIN_DEPTH_MAP[answers.skinDepth] ?? 5;
  const calculatedContrast = Math.abs(hairDepthVal - skinDepthVal) * 1.3;
  const contrast = average([contrastVal, Math.min(10, calculatedContrast)]);

  // ── Match to one of the 12 seasons ──
  const { subSeason } = findClosestSeason(temperature, depth, saturation);
  const seasonData = SEASON_PROFILES[subSeason];
  const primarySeason = seasonData.family;

  return {
    primarySeason,
    subSeason,
    secondaryBorrowing: seasonData.secondaryBorrowing,
    borrowingNote: seasonData.borrowingNote,
    traits: {
      temperature: {
        value: temperature,
        label: getTemperatureLabel(temperature),
      },
      depth: {
        value: depth,
        label: getDepthLabel(depth),
      },
      saturation: {
        value: saturation,
        label: getSaturationLabel(saturation),
      },
      contrast: {
        value: contrast,
        label: getContrastLabel(contrast),
      },
    },
  };
}

// ─────────────────────────────────────────────
// Closest season matching via weighted distance
// ─────────────────────────────────────────────

function findClosestSeason(temperature, depth, saturation) {
  const candidates = Object.entries(SEASON_PROFILES).map(([name, profile]) => {
    const { dominantTraits: t } = profile;
    // Temperature is weighted higher as it is the primary axis
    const dist = Math.sqrt(
      2.2 * Math.pow(temperature - t.temperature, 2) +
      1.4 * Math.pow(depth - t.depth, 2) +
      1.4 * Math.pow(saturation - t.saturation, 2)
    );
    return { subSeason: name, distance: dist };
  });

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0];
}

// ─────────────────────────────────────────────
// Color distance for camera matching
// Uses weighted Euclidean distance (perceptual)
// ─────────────────────────────────────────────

export function colorDistance(rgb1, rgb2) {
  const rMean = (rgb1.r + rgb2.r) / 2;
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  );
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function getMatchRating(distance) {
  if (distance < 28) return { label: 'Perfect Match', emoji: '✨', color: '#2ECC71' };
  if (distance < 55) return { label: 'Great Match',   emoji: '💚', color: '#27AE60' };
  if (distance < 85) return { label: 'Good Match',    emoji: '👍', color: '#F39C12' };
  if (distance < 115) return { label: 'Near Match',   emoji: '🤔', color: '#E67E22' };
  if (distance < 150) return { label: 'Proceed with Caution', emoji: '⚠️', color: '#E74C3C' };
  return { label: 'Avoid',                             emoji: '❌', color: '#C0392B' };
}

export function findClosestPaletteColors(sampledRgb, palette, top = 3) {
  return palette
    .map(swatch => ({
      ...swatch,
      rgb: hexToRgb(swatch.hex),
      distance: colorDistance(sampledRgb, hexToRgb(swatch.hex)),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, top);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getTemperatureLabel(v) {
  if (v <= 2.5) return 'Very Warm';
  if (v <= 4.5) return 'Warm';
  if (v <= 5.5) return 'Neutral';
  if (v <= 7.5) return 'Cool';
  return 'Very Cool';
}

function getDepthLabel(v) {
  if (v <= 2) return 'Very Light';
  if (v <= 4) return 'Light';
  if (v <= 6) return 'Medium';
  if (v <= 8) return 'Deep';
  return 'Very Deep';
}

function getSaturationLabel(v) {
  if (v <= 2) return 'Very Muted';
  if (v <= 4) return 'Muted';
  if (v <= 6) return 'Medium';
  if (v <= 8) return 'Bright';
  return 'Very Bright';
}

function getContrastLabel(v) {
  if (v <= 2) return 'Very Low';
  if (v <= 4) return 'Low';
  if (v <= 6) return 'Medium';
  if (v <= 8) return 'High';
  return 'Very High';
}
