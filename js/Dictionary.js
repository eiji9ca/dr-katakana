/**
 * Dr. Katakana - Dictionary Data Model
 * Katakana <-> Romaji mapping, mode-aware text resolvers, and lookup helpers.
 */

import { KATAKANA_DICTIONARY, ALL_KATAKANA_DICTIONARY } from './data/katakanaRepository.js';
import { GAME_MODES } from './constants.js';

export class Dictionary {
  constructor(entries = KATAKANA_DICTIONARY) {
    // Master lookup tables for all 46 Katakana alphabet entries
    this.masterById = new Map();
    this.masterByKatakana = new Map();
    this.masterByHiragana = new Map();
    this.masterByRomaji = new Map();
    if (Array.isArray(ALL_KATAKANA_DICTIONARY)) {
      for (const item of ALL_KATAKANA_DICTIONARY) {
        this.masterById.set(item.id, item);
        this.masterByKatakana.set(item.katakana, item);
        if (item.hiragana) {
          this.masterByHiragana.set(item.hiragana, item);
        }
        if (item.romaji) {
          this.masterByRomaji.set(item.romaji.toUpperCase(), item);
        }
      }
    }

    this.setEntries(entries);
  }

  /**
   * Rebuild internal lookup maps with a new set of entries
   * @param {Array<Object>} entries
   */
  setEntries(entries) {
    this.entries = (entries && entries.length > 0) ? entries : KATAKANA_DICTIONARY;
    this.byId = new Map();
    this.byKatakana = new Map();
    this.byHiragana = new Map();
    this.byRomaji = new Map();

    for (const item of this.entries) {
      this.byId.set(item.id, item);
      this.byKatakana.set(item.katakana, item);
      if (item.hiragana) {
        this.byHiragana.set(item.hiragana, item);
      }
      if (item.romaji) {
        this.byRomaji.set(item.romaji.toUpperCase(), item);
      }
    }
  }

  /**
   * Get entry by unique ID (e.g., 'ka')
   * @param {string} id
   */
  getById(id) {
    return this.byId.get(id) || this.masterById.get(id);
  }

  /**
   * Get entry by Katakana glyph (e.g., 'カ')
   * @param {string} kana
   */
  getByKatakana(kana) {
    return this.byKatakana.get(kana) || this.masterByKatakana.get(kana);
  }

  /**
   * Get entry by Hiragana glyph (e.g., 'か')
   * @param {string} hira
   */
  getByHiragana(hira) {
    if (!hira) return undefined;
    return this.byHiragana.get(hira) || this.masterByHiragana.get(hira);
  }

  /**
   * Get entry by Romaji string (e.g., 'KA')
   * @param {string} romaji
   */
  getByRomaji(romaji) {
    if (!romaji) return undefined;
    return this.byRomaji.get(romaji.toUpperCase()) || this.masterByRomaji.get(romaji.toUpperCase());
  }

  /**
   * Return a random entry from the active subset
   * @returns {Object}
   */
  getRandomEntry() {
    if (!this.entries || this.entries.length === 0) {
      return (ALL_KATAKANA_DICTIONARY && ALL_KATAKANA_DICTIONARY[0]) || { id: 'a', katakana: 'ア', hiragana: 'あ', romaji: 'A', color: '#EF4444' };
    }
    const idx = Math.floor(Math.random() * this.entries.length);
    return this.entries[idx];
  }

  /**
   * Return N unique random entries (useful for virus spawning)
   * @param {number} count
   */
  getRandomUniqueEntries(count) {
    const shuffled = [...this.entries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, this.entries.length));
  }

  /**
   * Mode-Aware Text Resolver for Viruses:
   * Mixed Mode: Respects individual virus.displayType (mix of Katakana & Hiragana)
   * Normal Mode: Viruses display Hiragana (あ) -> Player must match with Katakana (ア)
   * Reverse Mode: Viruses display Katakana (ア) -> Player must match with Hiragana (あ)
   * @param {Object} entry
   * @param {string} mode
   * @param {string} [displayType] Optional explicit override ('katakana' | 'hiragana' | 'romaji')
   * @returns {string}
   */
  getVirusDisplayText(entry, mode = GAME_MODES.MIXED, displayType = null) {
    if (!entry) return '';
    if (displayType === 'katakana') return entry.katakana;
    if (displayType === 'hiragana') return entry.hiragana || entry.romaji;
    if (displayType === 'romaji') return entry.hiragana || entry.romaji;
    if (mode === GAME_MODES.REVERSE) return entry.katakana;
    if (mode === GAME_MODES.NORMAL) return entry.hiragana || entry.romaji;
    // Default fallback in mixed mode if no explicit displayType
    return entry.hiragana || entry.romaji;
  }

  /**
   * Mode-Aware Text Resolver for Capsules:
   * Mixed Mode: Respects individual half.displayType (mix of Katakana & Hiragana)
   * Normal Mode: Capsules display Katakana (ア)
   * Reverse Mode: Capsules display Hiragana (あ)
   * @param {Object} entry
   * @param {string} mode
   * @param {string} [displayType] Optional explicit override ('katakana' | 'hiragana' | 'romaji')
   * @returns {string}
   */
  getCapsuleDisplayText(entry, mode = GAME_MODES.MIXED, displayType = null) {
    if (!entry) return '';
    if (displayType === 'katakana') return entry.katakana;
    if (displayType === 'hiragana') return entry.hiragana || entry.katakana;
    if (displayType === 'romaji') return entry.hiragana || entry.romaji;
    if (mode === GAME_MODES.REVERSE) return entry.hiragana || entry.romaji;
    if (mode === GAME_MODES.NORMAL) return entry.katakana;
    // Default fallback in mixed mode if no explicit displayType
    return entry.katakana;
  }

  /**
   * Check if a capsule piece matches a virus
   * @param {Object} virusEntry
   * @param {Object} capsuleEntry
   * @returns {boolean}
   */
  isMatch(virusEntry, capsuleEntry) {
    if (!virusEntry || !capsuleEntry) return false;
    return virusEntry.id === capsuleEntry.id;
  }

  /**
   * Format learning pair for prompt/feedback (e.g., "ア = あ")
   * @param {Object} entry
   * @returns {string}
   */
  formatPair(entry) {
    if (!entry) return '';
    const hiraOrRomaji = entry.hiragana || entry.romaji;
    return `${entry.katakana} = ${hiraOrRomaji}`;
  }
}

// Export singleton instance for convenience
export const dictionary = new Dictionary();
