import { SEASON_PROFILES } from '../data/seasons';

// ─────────────────────────────────────────────
// Skin depth mapping
// ─────────────────────────────────────────────

const SKIN_DEPTH_MAP = {
  fair:       1.5,
  light:      3.0,
  medium:     5.0,
  tan:        6.5,
  deep:       8.5,
  very_deep: 10.0,
};

// Ethnicity-informed temperature priors.
// These are soft population-level tendencies, not rules.
// They are low-weight — photos always override.
const ETHNICITY_TEMP_PRIOR = {
  east_asian:     4.5,  // tends neutral-warm
  sea_filipino:   3.5,  // tends warm, often olive
  south_asian:    4.0,  // tends warm to neutral-warm
  black_american: 4.5,  // wide range — soft warm prior
  latina:         4.0,  // tends warm
  middle_eastern: 4.5,  // tends neutral-warm to warm
  white_european: 5.5,  // widest range — neutral prior
  mixed:          5.0,  // neutral prior
  other:          5.0,
};


// ─────────────────────────────────────────────
// Main Analysis Function
// ─────────────────────────────────────────────

export function analyzeColorSeason(answers) {
  // ── Temperature (0 = very warm, 10 = very cool) ──
  // Primary signal: white/cream test (observable, unbiased)
  // Secondary signal: ethnicity prior (soft population tendency, low weight)
  const tempScores = [];

  if (answers.bestWhite === 'pure_white') tempScores.push(8.0);
  else if (answers.bestWhite === 'cream') tempScores.push(2.0);
  // 'both' or missing → no push, ethnicity prior carries it

  // Ethnicity prior — low weight (single score), photos will override via Claude
  const ethnicityPrior = ETHNICITY_TEMP_PRIOR[answers.ethnicity];
  if (ethnicityPrior !== undefined) tempScores.push(ethnicityPrior);

  const temperature = tempScores.length > 0 ? average(tempScores) : 5.0;

  // ── Depth (0 = very light, 10 = very deep) ──
  const depth = SKIN_DEPTH_MAP[answers.skinDepth] ?? 5.0;

  // ── Saturation (0 = muted, 10 = vivid) ──
  // No reliable text-only signal — default to neutral.
  // Claude photo analysis overrides this on the results screen.
  const saturation = 5.0;

  // ── Contrast ──
  const contrastMap = { very_high: 9.5, high: 7.5, medium: 5.0, low: 2.5 };
  const contrast = contrastMap[answers.contrast] ?? 5.0;

  // ── Seasonal variation (informational — shown on results, doesn't change season) ──
  const seasonalVariation = answers.seasonalChange ?? 'none';

  // ── Skin condition (informational — used in recommendations, not season matching) ──
  const skinCondition = answers.skinCondition ?? 'none';

  // ── Match to one of the 12 seasons ──
  const { subSeason } = findClosestSeason(temperature, depth, saturation);
  const seasonData = SEASON_PROFILES[subSeason];
  const primarySeason = seasonData.family;

  return {
    primarySeason,
    subSeason,
    secondaryBorrowing: seasonData.secondaryBorrowing,
    borrowingNote:      seasonData.borrowingNote,
    seasonalVariation,
    skinCondition,
    traits: {
      temperature: { value: temperature,  label: getTemperatureLabel(temperature) },
      depth:       { value: depth,        label: getDepthLabel(depth) },
      saturation:  { value: saturation,   label: getSaturationLabel(saturation) },
      contrast:    { value: contrast,     label: getContrastLabel(contrast) },
    },
  };
}

// ─────────────────────────────────────────────
// Closest season matching via weighted distance
// ─────────────────────────────────────────────

function findClosestSeason(temperature, depth, saturation) {
  const candidates = Object.entries(SEASON_PROFILES).map(([name, profile]) => {
    const { dominantTraits: t } = profile;
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
// Color distance for camera matching (perceptual)
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
  if (distance < 28)  return { label: 'Perfect Match',        emoji: '✨', color: '#2ECC71' };
  if (distance < 55)  return { label: 'Great Match',          emoji: '💚', color: '#27AE60' };
  if (distance < 85)  return { label: 'Good Match',           emoji: '👍', color: '#F39C12' };
  if (distance < 115) return { label: 'Near Match',           emoji: '🤔', color: '#E67E22' };
  if (distance < 150) return { label: 'Proceed with Caution', emoji: '⚠️', color: '#E74C3C' };
  return               { label: 'Avoid',                      emoji: '❌', color: '#C0392B' };
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
  if (v <= 2)  return 'Fair';
  if (v <= 4)  return 'Light';
  if (v <= 6)  return 'Medium';
  if (v <= 8)  return 'Deep';
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
