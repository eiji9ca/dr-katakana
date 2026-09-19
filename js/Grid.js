/**
 * Dr. Katakana - Grid State Engine
 * Milestone 2: 2D Bottle Grid matrix, cell state management, virus population, and static block placement
 */

import {
  GRID_COLS,
  GRID_ROWS,
  CELL_TYPES,
  CONNECT_DIR,
  GAME_MODES,
  getRandomPillColor,
  getVirusColor,
} from './constants.js';
import { dictionary } from './Dictionary.js';

export class Grid {
  /**
   * @param {number} cols Number of columns (default 8)
   * @param {number} rows Number of rows (default 16)
   */
  constructor(cols = GRID_COLS, rows = GRID_ROWS) {
    this.cols = cols;
    this.rows = rows;
    /** @type {Array<Array<Object|null>>} */
    this.cells = [];
    this.clear();
  }

  /**
   * Resets all grid cells to null (empty)
   */
  clear() {
    this.cells = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null)
    );
  }

  /**
   * Check if coordinate is within grid bounds
   * @param {number} row
   * @param {number} col
   * @returns {boolean}
   */
  isValid(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  /**
   * Check if cell is empty
   * @param {number} row
   * @param {number} col
   * @returns {boolean}
   */
  isEmpty(row, col) {
    if (!this.isValid(row, col)) return false;
    return this.cells[row][col] === null;
  }

  /**
   * Get cell at row, col
   * @param {number} row
   * @param {number} col
   * @returns {Object|null}
   */
  get(row, col) {
    if (!this.isValid(row, col)) return null;
    return this.cells[row][col];
  }

  /**
   * Set cell data at row, col
   * @param {number} row
   * @param {number} col
   * @param {Object|null} cellData
   */
  set(row, col, cellData) {
    if (!this.isValid(row, col)) return;
    if (cellData) {
      cellData.row = row;
      cellData.col = col;
    }
    this.cells[row][col] = cellData;
  }

  /**
   * Remove cell at row, col
   * @param {number} row
   * @param {number} col
   */
  remove(row, col) {
    if (this.isValid(row, col)) {
      this.cells[row][col] = null;
    }
  }

  /**
   * Add a static virus to the grid
   * @param {number} row
   * @param {number} col
   * @param {Object} dictEntry
   * @param {string} [displayType=null] 'katakana' | 'hiragana'
   * @param {string} [color=null] Hex color
   * @returns {Object}
   */
  addVirus(row, col, dictEntry, displayType = null, color = null) {
    const entry = dictEntry || dictionary.getRandomEntry();
    const virus = {
      type: CELL_TYPES.VIRUS,
      id: `v_${row}_${col}`,
      entry,
      row,
      col,
      displayType: displayType || 'hiragana',
      color: color || getVirusColor(),
      pulseOffset: Math.random() * Math.PI * 2, // Desynchronizes pulse animations
    };
    this.set(row, col, virus);
    return virus;
  }

  /**
   * Add a static capsule half block to the grid
   * @param {number} row
   * @param {number} col
   * @param {Object} dictEntry
   * @param {string} connectDir Direction pointing to partner half ('none' | 'left' | 'right' | 'up' | 'down')
   * @param {string} [capsuleId]
   * @param {string} [displayType=null] 'katakana' | 'romaji'
   * @param {string} [color=null] Hex color
   * @returns {Object}
   */
  addCapsuleHalf(
    row,
    col,
    dictEntry,
    connectDir = CONNECT_DIR.NONE,
    capsuleId = null,
    displayType = null,
    color = null
  ) {
    const entry = dictEntry || dictionary.getRandomEntry();
    const half = {
      type: CELL_TYPES.CAPSULE_HALF,
      id: `c_${row}_${col}`,
      capsuleId: capsuleId || `cap_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      entry,
      row,
      col,
      connectDir,
      displayType: displayType || 'katakana',
      color: color || getRandomPillColor(),
    };
    this.set(row, col, half);
    return half;
  }

  /**
   * Add a complete 2-part horizontal capsule into adjacent cells
   * @param {number} row
   * @param {number} col Left cell col
   * @param {Object} leftEntry
   * @param {Object} rightEntry
   * @param {string} [leftDisplayType=null]
   * @param {string} [rightDisplayType=null]
   * @param {string} [leftColor=null]
   * @param {string} [rightColor=null]
   */
  addHorizontalCapsule(
    row,
    col,
    leftEntry,
    rightEntry,
    leftDisplayType = null,
    rightDisplayType = null,
    leftColor = null,
    rightColor = null
  ) {
    if (!this.isValid(row, col) || !this.isValid(row, col + 1)) return null;
    const capsuleId = `cap_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const leftHalf = this.addCapsuleHalf(row, col, leftEntry, CONNECT_DIR.RIGHT, capsuleId, leftDisplayType, leftColor);
    const rightHalf = this.addCapsuleHalf(row, col + 1, rightEntry, CONNECT_DIR.LEFT, capsuleId, rightDisplayType, rightColor);
    return { leftHalf, rightHalf, capsuleId };
  }

  /**
   * Add a complete 2-part vertical capsule into adjacent cells
   * @param {number} row Top cell row
   * @param {number} col
   * @param {Object} topEntry
   * @param {Object} bottomEntry
   * @param {string} [topDisplayType=null]
   * @param {string} [bottomDisplayType=null]
   * @param {string} [topColor=null]
   * @param {string} [bottomColor=null]
   */
  addVerticalCapsule(
    row,
    col,
    topEntry,
    bottomEntry,
    topDisplayType = null,
    bottomDisplayType = null,
    topColor = null,
    bottomColor = null
  ) {
    if (!this.isValid(row, col) || !this.isValid(row + 1, col)) return null;
    const capsuleId = `cap_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const topHalf = this.addCapsuleHalf(row, col, topEntry, CONNECT_DIR.DOWN, capsuleId, topDisplayType, topColor);
    const bottomHalf = this.addCapsuleHalf(row + 1, col, bottomEntry, CONNECT_DIR.UP, capsuleId, bottomDisplayType, bottomColor);
    return { topHalf, bottomHalf, capsuleId };
  }

  /**
   * Populate random viruses in the lower region of the bottle (rows 6 to 15)
   * Classic Dr. Mario rule: never populate top rows to avoid instant death.
   * @param {number} count Number of viruses to spawn (default 4)
   * @param {string} [mode=GAME_MODES.MIXED]
   */
  populateViruses(count = 4, mode = GAME_MODES.MIXED) {
    this.clear();
    const minRow = 7;
    const maxRow = this.rows - 1;

    // Collect all valid available lower coordinates
    const availableCoords = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = 0; c < this.cols; c++) {
        availableCoords.push({ r, c });
      }
    }

    // Shuffle coords
    for (let i = availableCoords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableCoords[i], availableCoords[j]] = [availableCoords[j], availableCoords[i]];
    }

    const targetCount = Math.min(count, availableCoords.length);
    for (let i = 0; i < targetCount; i++) {
      const coord = availableCoords[i];
      const entry = dictionary.getRandomEntry();

      let displayType;
      if (mode === GAME_MODES.MIXED) {
        displayType = Math.random() < 0.5 ? 'katakana' : 'hiragana';
      } else if (mode === GAME_MODES.REVERSE) {
        displayType = 'katakana';
      } else {
        displayType = 'hiragana';
      }

      const color = getVirusColor();
      this.addVirus(coord.r, coord.c, entry, displayType, color);
    }
  }

  /**
   * Set up a rich diagnostic test scenario showcasing:
   * 1. Animated Viruses with a mix of Katakana & Hiragana text
   * 2. Connected horizontal capsules
   * 3. Connected vertical capsules
   * 4. Disconnected/single falling capsule halves
   * 5. Decoupled retro medical colors requiring actual kana reading
   */
  loadDiagnosticScenario(mode = GAME_MODES.MIXED) {
    this.clear();

    const pool = (dictionary.entries && dictionary.entries.length > 0)
      ? dictionary.entries
      : [
          dictionary.getById('a') || { id: 'a', katakana: 'ア', hiragana: 'あ', romaji: 'A', color: '#EF4444' },
          dictionary.getById('i') || { id: 'i', katakana: 'イ', hiragana: 'い', romaji: 'I', color: '#F97316' },
          dictionary.getById('u') || { id: 'u', katakana: 'ウ', hiragana: 'う', romaji: 'U', color: '#10B981' },
          dictionary.getById('e') || { id: 'e', katakana: 'エ', hiragana: 'え', romaji: 'E', color: '#3B82F6' },
          dictionary.getById('o') || { id: 'o', katakana: 'オ', hiragana: 'お', romaji: 'O', color: '#8B5CF6' },
        ];

    const e0 = pool[0 % pool.length];
    const e1 = pool[1 % pool.length];
    const e2 = pool[2 % pool.length];
    const e3 = pool[3 % pool.length] || e0;
    const e4 = pool[4 % pool.length] || e1;

    const virusColor = getVirusColor();
    const capsuleColor = getRandomPillColor();

    // Virus 1: at row 14, col 4 (Hiragana)
    this.addVirus(14, 4, e0, 'hiragana', virusColor);

    // Virus 2: at row 13, col 1 (Katakana)
    this.addVirus(13, 1, e1, 'katakana', virusColor);

    // Virus 3: at row 11, col 6 (Hiragana)
    this.addVirus(11, 6, e2, 'hiragana', virusColor);

    // Virus 4: at row 9, col 3 (Katakana)
    this.addVirus(9, 3, e3, 'katakana', virusColor);

    // Horizontal 2-part capsule at bottom row (row 15, cols 0 and 1)
    this.addHorizontalCapsule(15, 0, e2, e4, 'katakana', 'hiragana', capsuleColor, capsuleColor);

    // Horizontal 2-part capsule adjacent to virus at row 14, cols 2 & 3 (shows Katakana + Hiragana matching sound e0)
    this.addHorizontalCapsule(14, 2, e0, e0, 'katakana', 'hiragana', capsuleColor, capsuleColor);

    // Vertical 2-part capsule at col 6 (rows 13 & 14)
    this.addVerticalCapsule(13, 6, e4, e1, 'hiragana', 'katakana', capsuleColor, capsuleColor);

    // Single detached capsule half at row 15, col 4 (rests below virus, matching sound e0)
    this.addCapsuleHalf(15, 4, e0, CONNECT_DIR.NONE, null, 'katakana', capsuleColor);
  }

  /**
   * Get all virus objects currently in the grid
   * @returns {Array<Object>}
   */
  getViruses() {
    const list = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        if (cell && cell.type === CELL_TYPES.VIRUS) {
          list.push(cell);
        }
      }
    }
    return list;
  }

  /**
   * Count remaining viruses
   * @returns {number}
   */
  getVirusCount() {
    return this.getViruses().length;
  }

  /**
   * Count total non-empty cells
   * @returns {number}
   */
  getTotalOccupiedCount() {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c] !== null) count++;
      }
    }
    return count;
  }
}
