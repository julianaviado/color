import { SEASON_PROFILES } from '../data/seasons';

// ─────────────────────────────────────────────
// Skin undertone mapping (primary axis — skin only)
// ─────────────────────────────────────────────

const SKIN_UNDERTONE_TEMP = {
  golden_yellow:  2.0,   // warm
  peachy:         2.5,   // warm-neutral
  neutral_beige:  5.0,   // neutral
  pink_rosy:      7.5,   // cool
  blue_pink:      9.0,   // cool
  olive_green:    3.5,   // warm-olive
  gray_ashy:      8.0,   // cool-olive
};

const SKIN_DEPTH_MAP = {
  fair:       1.5,
  light:      3.0,
  medium:     5.0,
  tan:        6.5,
  deep:       8.5,
  very_deep: 10.0,
};


// ─────────────────────────────────────────────
// Main Analysis Function
// ─────────────────────────────────────────────

export function analyzeColorSeason(answers) {
  // ── Temperature (0 = very warm, 10 = very cool) ──
  const tempScores = [];

  // Skin undertone is the primary signal
  if (SKIN_UNDERTONE_TEMP[answers.skinUndertone] !== undefined) {
    // Weight undertone heavily — it's the most reliable axis
    tempScores.push(SKIN_UNDERTONE_TEMP[answers.skinUndertone]);
    tempScores.push(SKIN_UNDERTONE_TEMP[answers.skinUndertone]);
  }

  // White/cream test — classic temperature diagnostic
  if (answers.bestWhite === 'pure_white') tempScores.push(8.0);
  else if (answers.bestWhite === 'cream')  tempScores.push(2.0);
  else tempScores.push(5.0);

  // Jewelry
  if (answers.jewelry === 'gold')   tempScores.push(2.0);
  else if (answers.jewelry === 'silver') tempScores.push(8.5);
  else tempScores.push(5.0);

  const temperature = average(tempScores);

  // ── Depth (0 = very light, 10 = very deep) ──
  const depthScores = [];
  if (SKIN_DEPTH_MAP[answers.skinDepth] !== undefined) {
    depthScores.push(SKIN_DEPTH_MAP[answers.skinDepth]);
    depthScores.push(SKIN_DEPTH_MAP[answers.skinDepth]); // double-weight skin depth
  }
  const depth = depthScores.length > 0 ? average(depthScores) : 5.0;

  // ── Saturation (0 = muted, 10 = vivid) ──
  const satScores = [];
  if (answers.featureClarity === 'very_clear')    satScores.push(9.5);
  else if (answers.featureClarity === 'fairly_clear')  satScores.push(7.0);
  else if (answers.featureClarity === 'somewhat_soft') satScores.push(3.5);
  else if (answers.featureClarity === 'very_soft')     satScores.push(1.5);

  const saturation = satScores.length > 0 ? average(satScores) : 5.0;

  // ── Contrast ──
  const contrastScores = [];
  if (answers.contrast === 'very_high') contrastScores.push(9.5);
  else if (answers.contrast === 'high')   contrastScores.push(7.5);
  else if (answers.contrast === 'medium') contrastScores.push(5.0);
  else if (answers.contrast === 'low')    contrastScores.push(2.5);
  const contrast = contrastScores.length > 0 ? average(contrastScores) : 5.0;

  // ── Match to one of the 12 seasons ──
  const { subSeason } = findClosestSeason(temperature, depth, saturation);
  const seasonData = SEASON_PROFILES[subSeason];
  const primarySeason = seasonData.family;

  return {
    primarySeason,
    subSeason,
    secondaryBorrowing: seasonData.secondaryBorrowing,
    borrowingNote:      seasonData.borrowingNote,
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
