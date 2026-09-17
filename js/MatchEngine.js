/**
 * Dr. Katakana - Match & Physics Engine
 * Milestone 4: 3+ contiguous matching letters (rows & columns), virus and pure-capsule elimination,
 * partner decoupling, cascade gravity for unsupported blocks, and combo tracking.
 */

import {
  CELL_TYPES,
  CONNECT_DIR,
  MATCH_MIN_LENGTH,
} from './constants.js';

export class MatchEngine {
  /**
   * Find all contiguous lines of 3 or more matching Katakana sounds (horizontal and vertical).
   * Supports:
   * 1. 3+ contiguous capsule halves alone (clearing excess pills).
   * 2. 3+ contiguous pieces containing 1 or more viruses (clearing pills + destroying viruses).
   * 
   * @param {import('./Grid.js').Grid} grid
   * @returns {{
   *   matchedCells: Array<{ row: number, col: number, cell: Object }>,
   *   matchedViruses: Array<{ row: number, col: number, virus: Object }>,
   *   lines: Array<{ orientation: 'horizontal'|'vertical', entryId: string, cells: Array<{ row: number, col: number }> }>
   * }}
   */
  static findMatches(grid) {
    const matchedCoordsSet = new Set();
    const matchedCells = [];
    const matchedViruses = [];
    const lines = [];

    const coordKey = (r, c) => `${r},${c}`;

    const commitRun = (run, orientation, entryId) => {
      if (!run || run.length < MATCH_MIN_LENGTH || !entryId) return;
      lines.push({
        orientation,
        entryId,
        cells: [...run],
      });
      for (const item of run) {
        const key = coordKey(item.row, item.col);
        if (!matchedCoordsSet.has(key)) {
          matchedCoordsSet.add(key);
          matchedCells.push(item);
          if (item.cell.type === CELL_TYPES.VIRUS) {
            matchedViruses.push(item);
          }
        }
      }
    };

    // 1. Scan Horizontal Lines (along each row)
    for (let r = 0; r < grid.rows; r++) {
      let currentRun = [];
      let currentId = null;

      for (let c = 0; c < grid.cols; c++) {
        const cell = grid.get(r, c);
        const cellId = cell && cell.entry ? cell.entry.id : null;

        if (cellId && cellId === currentId) {
          currentRun.push({ row: r, col: c, cell });
        } else {
          commitRun(currentRun, 'horizontal', currentId);
          currentRun = cellId ? [{ row: r, col: c, cell }] : [];
          currentId = cellId;
        }
      }
      commitRun(currentRun, 'horizontal', currentId);
    }

    // 2. Scan Vertical Lines (along each column)
    for (let c = 0; c < grid.cols; c++) {
      let currentRun = [];
      let currentId = null;

      for (let r = 0; r < grid.rows; r++) {
        const cell = grid.get(r, c);
        const cellId = cell && cell.entry ? cell.entry.id : null;

        if (cellId && cellId === currentId) {
          currentRun.push({ row: r, col: c, cell });
        } else {
          commitRun(currentRun, 'vertical', currentId);
          currentRun = cellId ? [{ row: r, col: c, cell }] : [];
          currentId = cellId;
        }
      }
      commitRun(currentRun, 'vertical', currentId);
    }

    return {
      matchedCells,
      matchedViruses,
      lines,
    };
  }

  /**
   * Clears matched cells from the grid and detaches any surviving partners
   * @param {import('./Grid.js').Grid} grid
   * @param {Array<{ row: number, col: number, cell: Object }>} matchedCells
   */
  static clearMatchedCells(grid, matchedCells) {
    const matchedCoords = new Set(matchedCells.map(m => `${m.row},${m.col}`));

    for (const match of matchedCells) {
      const { row, col, cell } = match;

      if (cell.type === CELL_TYPES.CAPSULE_HALF && cell.connectDir !== CONNECT_DIR.NONE) {
        // Find partner
        let pRow = row;
        let pCol = col;
        if (cell.connectDir === CONNECT_DIR.RIGHT) pCol = col + 1;
        else if (cell.connectDir === CONNECT_DIR.LEFT) pCol = col - 1;
        else if (cell.connectDir === CONNECT_DIR.DOWN) pRow = row + 1;
        else if (cell.connectDir === CONNECT_DIR.UP) pRow = row - 1;

        // If partner is not also being cleared, detach partner into a single standalone half!
        if (grid.isValid(pRow, pCol) && !matchedCoords.has(`${pRow},${pCol}`)) {
          const partner = grid.get(pRow, pCol);
          if (partner && partner.type === CELL_TYPES.CAPSULE_HALF && partner.capsuleId === cell.capsuleId) {
            partner.connectDir = CONNECT_DIR.NONE;
          }
        }
      }

      // Remove the cell from the grid
      grid.remove(row, col);
    }
  }

  /**
   * Applies 1 step of cascade gravity to unsupported floating capsule blocks.
   * Viruses never fall. Connected horizontal pairs must BOTH be able to fall.
   * 
   * @param {import('./Grid.js').Grid} grid
   * @returns {boolean} True if any block moved down, false if everything is settled
   */
  static applyGravityStep(grid) {
    let movedAny = false;
    const processedPairs = new Set();

    // Iterate from bottom row upwards so falling pieces stack cleanly
    for (let r = grid.rows - 2; r >= 0; r--) {
      for (let c = 0; c < grid.cols; c++) {
        const cell = grid.get(r, c);
        if (!cell || cell.type !== CELL_TYPES.CAPSULE_HALF) continue;

        // Case 1: Standalone single capsule half or vertical capsule half
        if (cell.connectDir === CONNECT_DIR.NONE) {
          // Check if space below is empty
          if (grid.isEmpty(r + 1, c)) {
            grid.set(r + 1, c, cell);
            grid.set(r, c, null);
            movedAny = true;
          }
        } else if (cell.connectDir === CONNECT_DIR.UP) {
          // Bottom half of a vertical capsule
          if (grid.isEmpty(r + 1, c)) {
            const topPartner = grid.get(r - 1, c);
            if (topPartner && topPartner.capsuleId === cell.capsuleId) {
              grid.set(r + 1, c, cell);
              grid.set(r, c, topPartner);
              grid.set(r - 1, c, null);
              movedAny = true;
            }
          }
        } else if (cell.connectDir === CONNECT_DIR.DOWN) {
          // Handled above via CONNECT_DIR.UP to prevent double processing
          continue;
        } else if (cell.connectDir === CONNECT_DIR.RIGHT) {
          // Left half of a horizontal connected capsule pair
          const pairKey = `${cell.capsuleId}`;
          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);

          const rightPartner = grid.get(r, c + 1);
          if (rightPartner && rightPartner.capsuleId === cell.capsuleId) {
            // Both halves must have empty space below them to fall together
            if (grid.isEmpty(r + 1, c) && grid.isEmpty(r + 1, c + 1)) {
              grid.set(r + 1, c, cell);
              grid.set(r + 1, c + 1, rightPartner);
              grid.set(r, c, null);
              grid.set(r, c + 1, null);
              movedAny = true;
            }
          }
        } else if (cell.connectDir === CONNECT_DIR.LEFT) {
          // Handled via CONNECT_DIR.RIGHT
          continue;
        }
      }
    }

    return movedAny;
  }
}
