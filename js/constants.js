/**
 * Dr. Katakana - Game Constants & Configurations
 */

// Grid Specifications (Standard Dr. Mario bottle is 8 columns x 16 rows)
export const GRID_COLS = 8;
export const GRID_ROWS = 16;
export const CELL_SIZE = 36; // Logical pixel size for each cell

// Logical Canvas Dimensions
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;   // 288px
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE; // 576px

// Color Palette & Themes (decoupled color generator)
export {
  FOCUS_THEME,
  PALETTE,
  RETRO_PILL_COLORS,
  getRandomPillColor,
  getVirusColor,
} from './core/colors.js';

// Educational Katakana Curriculum & Sets
export {
  ALL_KATAKANA_DICTIONARY,
  KATAKANA_ROWS,
  KATAKANA_SETS,
  KATAKANA_DICTIONARY,
  STAGE_CONFIGS,
  getEntriesForRows,
  getRandomKanaSubset,
} from './data/katakanaRepository.js';

// Game Modes (Reverse Mode & Mixed Mode Ready)
export const GAME_MODES = {
  MIXED: 'mixed',     // Both viruses and capsules are a dynamic mix of Katakana & English Romaji
  NORMAL: 'normal',   // Viruses = Romaji (e.g., KA), Capsules = Katakana (e.g., カ)
  REVERSE: 'reverse', // Viruses = Katakana (e.g., カ), Capsules = Romaji (e.g., KA)
};

// Cell Entity Types in the Grid Matrix
export const CELL_TYPES = {
  EMPTY: 'empty',
  VIRUS: 'virus',
  CAPSULE_HALF: 'capsule_half',
};

// Connection directions for capsule halves
export const CONNECT_DIR = {
  NONE: 'none',   // Detached independent half (falls solo)
  LEFT: 'left',   // Partner is to the left
  RIGHT: 'right', // Partner is to the right
  UP: 'up',       // Partner is above
  DOWN: 'down',   // Partner is below
};

// Target Frame Rate
export const TARGET_FPS = 60;
export const FIXED_TIMESTEP = 1000 / TARGET_FPS; // ~16.66ms

// Fall Speeds & Delays (in milliseconds)
export const FALL_SPEEDS = {
  NORMAL: 750,      // Normal automatic gravity drop step
  SOFT_DROP: 65,    // Held 'S' soft drop speed
  LOCK_DELAY: 220,  // Ground contact grace period before locking to grid
};

// Spawn Coordinates (Chute entrance at top: columns 3 and 4, row 0)
export const CAPSULE_SPAWN = {
  ROW: 0,
  COL: 3,
};

// Capsule Orientations relative to Part 1 (Pivot at [row, col])
export const ORIENTATIONS = {
  HORIZONTAL: 0,
  VERTICAL_UP: 1,
  HORIZONTAL_FLIP: 2,
  VERTICAL_DOWN: 3,
};

// Match Engine Rules
export const MATCH_MIN_LENGTH = 3;

// Elimination & Cascade Animation Durations (in ms)
export const TIMINGS = {
  MATCH_FLASH: 300,    // Duration pieces flash/pulse before vanishing
  CASCADE_DELAY: 120,  // Pause before unsupported pieces fall
  CASCADE_STEP: 60,    // Speed per row of unsupported falling blocks
};
