/**
 * Dr. Katakana - Capsule Entity & Physics
 * Milestone 3: 2-part connected capsule, bounds collision, rotation with wall-kicks, and locking
 */

import {
  ORIENTATIONS,
  CONNECT_DIR,
  CAPSULE_SPAWN,
} from './constants.js';

export class Capsule {
  /**
   * @param {Object} entry1 Left/Pivot Katakana dictionary entry
   * @param {Object} entry2 Right/Partner Katakana dictionary entry
   * @param {number} [spawnRow=0]
   * @param {number} [spawnCol=3]
   * @param {string|null} [displayType1=null] 'katakana' | 'romaji'
   * @param {string|null} [displayType2=null] 'katakana' | 'romaji'
   * @param {string|null} [color1=null] Hex color
   * @param {string|null} [color2=null] Hex color
   */
  constructor(
    entry1,
    entry2,
    spawnRow = CAPSULE_SPAWN.ROW,
    spawnCol = CAPSULE_SPAWN.COL,
    displayType1 = null,
    displayType2 = null,
    color1 = null,
    color2 = null
  ) {
    this.id = `cap_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Part 1 is the primary pivot
    this.part1 = {
      row: spawnRow,
      col: spawnCol,
      entry: entry1,
      displayType: displayType1,
      color: color1,
    };

    // Part 2 is the connected partner (starts horizontal to the right)
    this.part2 = {
      row: spawnRow,
      col: spawnCol + 1,
      entry: entry2,
      displayType: displayType2,
      color: color2,
    };

    this.orientation = ORIENTATIONS.HORIZONTAL; // 0: Horizontal, 1: Vert Up, 2: Horiz Flip, 3: Vert Down
    this.lockTimer = 0;
    this.isGrounded = false;
  }

  /**
   * Get relative offsets [dr, dc] of Part 2 with respect to Part 1
   * @param {number} orientation
   * @returns {[number, number]}
   */
  getPart2Offset(orientation = this.orientation) {
    switch (orientation) {
      case ORIENTATIONS.HORIZONTAL:      // Part 2 is to the right
        return [0, 1];
      case ORIENTATIONS.VERTICAL_UP:     // Part 2 is above Part 1
        return [-1, 0];
      case ORIENTATIONS.HORIZONTAL_FLIP: // Part 2 is to the left
        return [0, -1];
      case ORIENTATIONS.VERTICAL_DOWN:   // Part 2 is below Part 1
        return [1, 0];
      default:
        return [0, 1];
    }
  }

  /**
   * Determine connection directions for each half based on current orientation
   * @param {number} orientation
   * @returns {{ dir1: string, dir2: string }}
   */
  getConnectionDirs(orientation = this.orientation) {
    switch (orientation) {
      case ORIENTATIONS.HORIZONTAL:
        return { dir1: CONNECT_DIR.RIGHT, dir2: CONNECT_DIR.LEFT };
      case ORIENTATIONS.VERTICAL_UP:
        return { dir1: CONNECT_DIR.UP, dir2: CONNECT_DIR.DOWN };
      case ORIENTATIONS.HORIZONTAL_FLIP:
        return { dir1: CONNECT_DIR.LEFT, dir2: CONNECT_DIR.RIGHT };
      case ORIENTATIONS.VERTICAL_DOWN:
        return { dir1: CONNECT_DIR.DOWN, dir2: CONNECT_DIR.UP };
      default:
        return { dir1: CONNECT_DIR.NONE, dir2: CONNECT_DIR.NONE };
    }
  }

  /**
   * Check if specific coordinates for both parts are valid within grid and not blocked
   * @param {number} r1 Part 1 row
   * @param {number} c1 Part 1 col
   * @param {number} r2 Part 2 row
   * @param {number} c2 Part 2 col
   * @param {import('./Grid.js').Grid} grid
   * @returns {boolean}
   */
  isPositionValid(r1, c1, r2, c2, grid) {
    // Check bounds
    if (!grid.isValid(r1, c1) || !grid.isValid(r2, c2)) {
      return false;
    }

    // Check collision with existing blocks
    if (!grid.isEmpty(r1, c1) || !grid.isEmpty(r2, c2)) {
      return false;
    }

    return true;
  }

  /**
   * Check if current capsule can legally move down 1 row
   * @param {import('./Grid.js').Grid} grid
   * @returns {boolean}
   */
  canMoveDown(grid) {
    const nextR1 = this.part1.row + 1;
    const nextC1 = this.part1.col;
    const nextR2 = this.part2.row + 1;
    const nextC2 = this.part2.col;

    // Both new spots must be within grid
    if (!grid.isValid(nextR1, nextC1) || !grid.isValid(nextR2, nextC2)) {
      return false;
    }

    // If vertical and Part 2 is below Part 1, we only need to test if next spot for Part 2 is free
    if (this.orientation === ORIENTATIONS.VERTICAL_DOWN) {
      return grid.isEmpty(nextR2, nextC2);
    }

    // If vertical and Part 1 is below Part 2, we only need to test if next spot for Part 1 is free
    if (this.orientation === ORIENTATIONS.VERTICAL_UP) {
      return grid.isEmpty(nextR1, nextC1);
    }

    // If horizontal, both destination cells below must be empty
    return grid.isEmpty(nextR1, nextC1) && grid.isEmpty(nextR2, nextC2);
  }

  /**
   * Move capsule down by 1 cell
   * @param {import('./Grid.js').Grid} grid
   * @returns {boolean} True if successfully moved, false if blocked
   */
  moveDown(grid) {
    if (!this.canMoveDown(grid)) {
      this.isGrounded = true;
      return false;
    }

    this.part1.row += 1;
    this.part2.row += 1;
    this.isGrounded = !this.canMoveDown(grid);
    if (!this.isGrounded) {
      this.lockTimer = 0; // Reset lock delay when continuing to fall
    }
    return true;
  }

  /**
   * Move capsule left by 1 column
   * @param {import('./Grid.js').Grid} grid
   * @returns {boolean}
   */
  moveLeft(grid) {
    const nextC1 = this.part1.col - 1;
    const nextC2 = this.part2.col - 1;

    // Boundary check
    if (nextC1 < 0 || nextC2 < 0) return false;

    // In horizontal flip, Part 2 is to the left of Part 1
    if (this.orientation === ORIENTATIONS.HORIZONTAL_FLIP) {
      if (!grid.isEmpty(this.part2.row, nextC2)) return false;
    } else if (this.orientation === ORIENTATIONS.HORIZONTAL) {
      if (!grid.isEmpty(this.part1.row, nextC1)) return false;
    } else {
      // Vertical
      if (!grid.isEmpty(this.part1.row, nextC1) || !grid.isEmpty(this.part2.row, nextC2)) {
        return false;
      }
    }

    this.part1.col = nextC1;
    this.part2.col = nextC2;
    this.isGrounded = !this.canMoveDown(grid);
    return true;
  }

  /**
   * Move capsule right by 1 column
   * @param {import('./Grid.js').Grid} grid
   * @returns {boolean}
   */
  moveRight(grid) {
    const nextC1 = this.part1.col + 1;
    const nextC2 = this.part2.col + 1;

    // Boundary check
    if (nextC1 >= grid.cols || nextC2 >= grid.cols) return false;

    // In horizontal normal, Part 2 is to the right of Part 1
    if (this.orientation === ORIENTATIONS.HORIZONTAL) {
      if (!grid.isEmpty(this.part2.row, nextC2)) return false;
    } else if (this.orientation === ORIENTATIONS.HORIZONTAL_FLIP) {
      if (!grid.isEmpty(this.part1.row, nextC1)) return false;
    } else {
      // Vertical
      if (!grid.isEmpty(this.part1.row, nextC1) || !grid.isEmpty(this.part2.row, nextC2)) {
        return false;
      }
    }

    this.part1.col = nextC1;
    this.part2.col = nextC2;
    this.isGrounded = !this.canMoveDown(grid);
    return true;
  }

  /**
   * Rotate Clockwise (E key) with intelligent wall-kick & floor-kick resolution
   * @param {import('./Grid.js').Grid} grid
   * @returns {boolean}
   */
  rotateCW(grid) {
    const nextOrientation = (this.orientation + 1) % 4;
    return this.applyRotation(nextOrientation, grid);
  }

  /**
   * Rotate Counter-Clockwise (Q key) with intelligent wall-kick & floor-kick resolution
   * @param {import('./Grid.js').Grid} grid
   * @returns {boolean}
   */
  rotateCCW(grid) {
    const nextOrientation = (this.orientation + 3) % 4;
    return this.applyRotation(nextOrientation, grid);
  }

  /**
   * Attempts to rotate to target orientation, trying standard position and kick offsets
   * @param {number} targetOrientation
   * @param {import('./Grid.js').Grid} grid
   * @returns {boolean}
   */
  applyRotation(targetOrientation, grid) {
    const [dr, dc] = this.getPart2Offset(targetOrientation);

    // Candidate test shifts for wall-kicks: [dr_shift, dc_shift]
    // 1. [0, 0] Standard rotation around Part 1
    // 2. [0, -1] Kick left (if rotating against right wall or right obstacle)
    // 3. [0, 1] Kick right (if rotating against left wall or left obstacle)
    // 4. [-1, 0] Kick up (if rotating against floor or block below)
    const kickCandidates = [
      [0, 0],
      [0, -1],
      [0, 1],
      [-1, 0],
    ];

    for (const [shiftR, shiftC] of kickCandidates) {
      const testP1R = this.part1.row + shiftR;
      const testP1C = this.part1.col + shiftC;
      const testP2R = testP1R + dr;
      const testP2C = testP1C + dc;

      if (this.isPositionValid(testP1R, testP1C, testP2R, testP2C, grid)) {
        // Valid rotation found! Apply position and orientation
        this.part1.row = testP1R;
        this.part1.col = testP1C;
        this.part2.row = testP2R;
        this.part2.col = testP2C;
        this.orientation = targetOrientation;
        this.isGrounded = !this.canMoveDown(grid);
        return true;
      }
    }

    // Rotation blocked by walls/obstacles
    return false;
  }

  /**
   * Hard Drop (Space key): Instantly drops the capsule to the lowest valid position
   * @param {import('./Grid.js').Grid} grid
   * @returns {number} Cells dropped
   */
  hardDrop(grid) {
    let dropCount = 0;
    while (this.canMoveDown(grid)) {
      this.moveDown(grid);
      dropCount++;
    }
    this.isGrounded = true;
    return dropCount;
  }

  /**
   * Calculate Ghost position (where this capsule will land if dropped)
   * @param {import('./Grid.js').Grid} grid
   * @returns {{ part1: { row: number, col: number }, part2: { row: number, col: number } }}
   */
  getGhostPosition(grid) {
    let r1 = this.part1.row;
    let r2 = this.part2.row;
    const c1 = this.part1.col;
    const c2 = this.part2.col;

    // Simulation loop down
    while (true) {
      const nextR1 = r1 + 1;
      const nextR2 = r2 + 1;

      if (!grid.isValid(nextR1, c1) || !grid.isValid(nextR2, c2)) {
        break;
      }

      if (this.orientation === ORIENTATIONS.VERTICAL_DOWN) {
        if (!grid.isEmpty(nextR2, c2)) break;
      } else if (this.orientation === ORIENTATIONS.VERTICAL_UP) {
        if (!grid.isEmpty(nextR1, c1)) break;
      } else {
        if (!grid.isEmpty(nextR1, c1) || !grid.isEmpty(nextR2, c2)) break;
      }

      r1 = nextR1;
      r2 = nextR2;
    }

    return {
      part1: { row: r1, col: c1 },
      part2: { row: r2, col: c2 },
    };
  }

  /**
   * Returns current halves with their respective connection directions, display types, and colors
   */
  getHalves() {
    const { dir1, dir2 } = this.getConnectionDirs();
    return [
      {
        row: this.part1.row,
        col: this.part1.col,
        entry: this.part1.entry,
        displayType: this.part1.displayType,
        color: this.part1.color,
        connectDir: dir1,
        capsuleId: this.id,
      },
      {
        row: this.part2.row,
        col: this.part2.col,
        entry: this.part2.entry,
        displayType: this.part2.displayType,
        color: this.part2.color,
        connectDir: dir2,
        capsuleId: this.id,
      },
    ];
  }

  /**
   * Locks this falling capsule permanently into the grid matrix as static blocks
   * @param {import('./Grid.js').Grid} grid
   */
  lockIntoGrid(grid) {
    const halves = this.getHalves();
    for (const half of halves) {
      grid.addCapsuleHalf(
        half.row,
        half.col,
        half.entry,
        half.connectDir,
        half.capsuleId,
        half.displayType,
        half.color
      );
    }
  }
}
