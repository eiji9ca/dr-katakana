/**
 * Dr. Katakana - Color Palette & Theme Tokens
 * Option 1: "Ink & Porcelain" Monochrome Focus Palette
 * Distraction-free, pure character recognition inspired by Japanese calligraphy (shodō).
 */

// Focus Mode (Ink & Porcelain Monochrome Palette - Zero Distraction)
export const FOCUS_THEME = {
  // Living Viruses: Sleek charcoal slate with clean luminous white typography
  virusBg: '#1E293B',
  virusBorder: '#475569',
  virusFeeler: '#334155',
  virusNucleus: 'rgba(0, 0, 0, 0.45)',
  virusText: '#FFFFFF',

  // Falling & Static Medical Capsules: Crisp porcelain ivory with deep midnight ink typography
  capsuleBg: '#F8FAFC',
  capsuleBorder: '#94A3B8',
  capsuleGloss: 'rgba(255, 255, 255, 0.7)',
  capsuleText: '#0F172A',
  capsuleSeam: '#475569',

  // Match and Elimination Flash
  matchFlash: '#FFFFFF',
  matchHalo: '#FDE047',

  // Ghost landing guide
  ghostBg: 'rgba(248, 250, 252, 0.08)',
  ghostBorder: 'rgba(148, 163, 184, 0.5)',
};

// Retro pill color array (porcelain ivory monochrome)
export const RETRO_PILL_COLORS = [FOCUS_THEME.capsuleBg];

// UI & Bottle Canvas Palette
export const PALETTE = {
  canvasBg: '#090D16',                 // Deep obsidian slate
  gridLine: 'rgba(51, 65, 85, 0.25)',   // Minimal subtle grid lines
  gridBorder: '#334155',               // Clean slate border
  bottleBorder: '#475569',             // Refined slate glass border
  bottleNeck: '#334155',               // Sleek slate entry chute
  textPrimary: '#F8FAFC',              // Pure white
  textMuted: '#94A3B8',                // Light slate
  accentCyan: '#38BDF8',
  accentGreen: '#34D399',
};

/**
 * Returns the porcelain ivory color for falling and locked capsules
 * @returns {string} Hex color string
 */
export function getRandomPillColor() {
  return FOCUS_THEME.capsuleBg;
}

/**
 * Returns the charcoal slate color for living viruses
 * @returns {string} Hex color string
 */
export function getVirusColor() {
  return FOCUS_THEME.virusBg;
}
