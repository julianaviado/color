// ─────────────────────────────────────────────
// Hue Garden — Design System
// Inspired by qoves.com editorial aesthetic:
// clean, clinical, warm-white, serif headings
// ─────────────────────────────────────────────

export const COLORS = {
  // Backgrounds
  background:    '#FAF8F5',   // warm off-white
  surface:       '#FFFFFF',
  surfaceAlt:    '#F4F0EB',   // soft warm grey

  // Text
  textPrimary:   '#1A1814',   // near-black, warm
  textSecondary: '#6B6460',   // warm mid-grey
  textTertiary:  '#A09A95',   // light warm grey
  textInverse:   '#FAF8F5',

  // Brand
  accent:        '#C4846E',   // warm terracotta — Hue Garden signature
  accentLight:   '#F0D8CF',
  accentDark:    '#8C5A48',

  // Borders
  border:        '#E8E0D8',
  borderLight:   '#F0EAE4',

  // Season families
  spring:        '#E8A87C',
  summer:        '#9BAFD9',
  autumn:        '#C06040',
  winter:        '#4A6080',

  // Status
  success:       '#4CAF7A',
  warning:       '#E8A020',
  error:         '#D64040',

  // Overlay
  overlay:       'rgba(26,24,20,0.5)',
  overlayLight:  'rgba(26,24,20,0.15)',
};

export const TYPOGRAPHY = {
  // Albert Sans — clean, editorial, geometric sans
  heading: {
    fontFamily: 'AlbertSans_300Light',
  },
  headingItalic: {
    fontFamily: 'AlbertSans_300Light_Italic',
  },
  body: {
    fontFamily: 'AlbertSans_400Regular',
  },
  fonts: {
    light:       'AlbertSans_300Light',
    lightItalic: 'AlbertSans_300Light_Italic',
    regular:     'AlbertSans_400Regular',
    italic:      'AlbertSans_400Regular_Italic',
    medium:      'AlbertSans_500Medium',
    semibold:    'AlbertSans_600SemiBold',
    bold:        'AlbertSans_700Bold',
  },

  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   26,
    xxl:  34,
    hero: 44,
  },

  weights: {
    light:   '300',
    regular: '400',
    medium:  '500',
    semibold:'600',
    bold:    '700',
  },
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl: 64,
};

export const RADIUS = {
  sm:   6,
  md:   12,
  lg:   20,
  xl:   32,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Season gradient colors for cards
export const SEASON_GRADIENTS = {
  Spring:  ['#F5E6D0', '#F0C4A0', '#FAF8F5'],
  Summer:  ['#E0E8F5', '#C8D8F0', '#FAF8F5'],
  Autumn:  ['#F0DCC8', '#E0A878', '#FAF8F5'],
  Winter:  ['#D8E0F0', '#9BAFD9', '#FAF8F5'],
};

export const SEASON_ACCENT_COLORS = {
  'True Spring':    '#E8A878',
  'Light Spring':   '#F0C4A0',
  'Bright Spring':  '#E85033',
  'True Summer':    '#9BAFD9',
  'Light Summer':   '#C8D8F0',
  'Soft Summer':    '#A890A8',
  'True Autumn':    '#C06040',
  'Deep Autumn':    '#7A3020',
  'Soft Autumn':    '#C4A882',
  'True Winter':    '#4A6080',
  'Deep Winter':    '#1A2A4A',
  'Bright Winter':  '#0044CC',
};
