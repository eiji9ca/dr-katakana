/**
 * Dr. Katakana - Katakana Data Repository
 * Loads pure JSON datasets and provides lookup, deck filtering, and subset selection helpers.
 */

import katakanaData from '../../data/katakana.json';
import decksData from '../../data/decks.json';
import stagesData from '../../data/stages.json';

// All 46 Gojūon Katakana characters
export const ALL_KATAKANA_DICTIONARY = katakanaData;

// Stage configs
export const STAGE_CONFIGS = stagesData;

// Map characters by ID for fast lookup
const charById = new Map(katakanaData.map(char => [char.id, char]));

// Hydrate row definitions with entries array
export const KATAKANA_ROWS = decksData.rows.map(row => ({
  id: row.id,
  name: row.name,
  preview: row.preview,
  kanaRange: row.kanaRange,
  entries: row.charIds.map(id => charById.get(id)).filter(Boolean),
}));

// Hydrate preset sets
export const KATAKANA_SETS = {};
for (const [key, preset] of Object.entries(decksData.presets)) {
  const rowIdSet = new Set(preset.rowIds);
  const matchedRows = KATAKANA_ROWS.filter(r => rowIdSet.has(r.id));
  KATAKANA_SETS[key] = {
    name: preset.name,
    entries: matchedRows.flatMap(r => r.entries),
  };
}

// Default initial dictionary (A-Row)
export const KATAKANA_DICTIONARY = KATAKANA_SETS.vowels_a?.entries || KATAKANA_ROWS[0].entries;

/**
 * Retrieve entries for selected Katakana row IDs
 * @param {string[]} rowIds
 * @returns {Array<Object>}
 */
export function getEntriesForRows(rowIds = ['A']) {
  if (!rowIds || rowIds.length === 0 || rowIds.includes('ALL')) {
    return KATAKANA_ROWS[0].entries;
  }
  const idSet = new Set(rowIds);
  const matchedRows = KATAKANA_ROWS.filter(r => idSet.has(r.id));
  const entries = matchedRows.flatMap(r => r.entries);
  return entries.length > 0 ? entries : KATAKANA_ROWS[0].entries;
}

/**
 * Randomly pick N unique Katakana letters from the entire 46-character alphabet
 * @param {number} count - between 3 and 5
 * @returns {Array<Object>}
 */
export function getRandomKanaSubset(count = 5) {
  const safeCount = Math.max(3, Math.min(5, Math.floor(count) || 5));
  const pool = [...ALL_KATAKANA_DICTIONARY];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }
  return pool.slice(0, safeCount);
}
