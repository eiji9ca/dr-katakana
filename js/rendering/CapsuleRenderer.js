/**
 * Dr. Katakana - Capsule Canvas Renderer
 * Option 1: "Ink & Porcelain" Monochrome
 * Renders crisp porcelain ivory pills with deep midnight ink typography.
 */

import {
  CELL_SIZE,
  CONNECT_DIR,
  GAME_MODES,
  FOCUS_THEME,
} from '../constants.js';
import { dictionary } from '../Dictionary.js';

export class CapsuleRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  constructor(ctx) {
    this.ctx = ctx;
  }

  setContext(ctx) {
    this.ctx = ctx;
  }

  /**
   * Draw a Capsule Half block at grid cell [row, col]
   * @param {number} row
   * @param {number} col
   * @param {Object} half
   * @param {string} mode
   * @param {boolean} [isMatching=false]
   * @param {number} [timestamp=0]
   */
  drawCapsuleHalf(row, col, half, mode, isMatching = false, timestamp = 0) {
    const ctx = this.ctx;
    const padding = 2;
    const x = col * CELL_SIZE + padding;
    const y = row * CELL_SIZE + padding;
    const w = CELL_SIZE - padding * 2;
    const h = CELL_SIZE - padding * 2;

    const entry = half.entry || dictionary.getRandomEntry() || { katakana: 'ア', romaji: 'A' };
    
    // Monochrome porcelain colors
    let bodyColor = FOCUS_THEME.capsuleBg;
    let textColor = FOCUS_THEME.capsuleText;

    if (isMatching) {
      const flash = Math.sin((timestamp / 1000) * 20) > 0;
      bodyColor = flash ? FOCUS_THEME.matchFlash : FOCUS_THEME.matchHalo;
      textColor = '#0F172A';
    }

    const text = dictionary.getCapsuleDisplayText(entry, mode, half.displayType);
    const dir = half.connectDir || CONNECT_DIR.NONE;

    ctx.save();

    if (isMatching) {
      ctx.shadowColor = FOCUS_THEME.matchHalo;
      ctx.shadowBlur = 16;
    }

    // Determine corner radii based on connection direction [tl, tr, br, bl]
    const r = 8;
    let radii = [r, r, r, r]; // Default detached pill

    if (dir === CONNECT_DIR.RIGHT) {
      radii = [r, 0, 0, r];
    } else if (dir === CONNECT_DIR.LEFT) {
      radii = [0, r, r, 0];
    } else if (dir === CONNECT_DIR.DOWN) {
      radii = [r, r, 0, 0];
    } else if (dir === CONNECT_DIR.UP) {
      radii = [0, 0, r, r];
    }

    // 1. Draw Capsule Shape (Crisp porcelain ivory)
    this.drawPathWithRadii(x, y, w, h, radii);
    ctx.fillStyle = bodyColor;
    ctx.fill();

    // 2. Subtle 3D Bevel Stroke (Refined slate edge)
    ctx.strokeStyle = isMatching ? 'rgba(255, 255, 255, 0.9)' : FOCUS_THEME.capsuleBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Top Glossy Sheen Bar
    ctx.fillStyle = isMatching ? 'rgba(255, 255, 255, 0.5)' : FOCUS_THEME.capsuleGloss;
    this.drawPathWithRadii(x + 3, y + 3, w - 6, 5, [2, 2, 2, 2]);
    ctx.fill();

    // 4. Connection Seam Indicator line if joined
    if (dir !== CONNECT_DIR.NONE) {
      ctx.strokeStyle = FOCUS_THEME.capsuleSeam;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (dir === CONNECT_DIR.RIGHT) {
        ctx.moveTo(x + w, y + 2);
        ctx.lineTo(x + w, y + h - 2);
      } else if (dir === CONNECT_DIR.LEFT) {
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x, y + h - 2);
      } else if (dir === CONNECT_DIR.DOWN) {
        ctx.moveTo(x + 2, y + h);
        ctx.lineTo(x + w - 2, y + h);
      } else if (dir === CONNECT_DIR.UP) {
        ctx.moveTo(x + 2, y);
        ctx.lineTo(x + w - 2, y);
      }
      ctx.stroke();
    }

    // 5. Centered Katakana / Sound glyph (Deep midnight ink typography)
    ctx.fillStyle = textColor;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    if (text.length > 1) {
      ctx.font = 'bold 12px monospace, system-ui';
    } else {
      ctx.font = 'bold 18px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);

    ctx.restore();
  }

  /**
   * Draw the Active Falling Capsule with active highlight border
   * @param {import('../Capsule.js').Capsule} capsule
   * @param {string} mode
   */
  drawActiveCapsule(capsule, mode = GAME_MODES.NORMAL) {
    if (!capsule) return;
    const halves = capsule.getHalves();

    for (const half of halves) {
      this.drawCapsuleHalf(half.row, half.col, half, mode);
    }

    // Highlight border around active capsule to make it instantly distinguishable
    const ctx = this.ctx;
    ctx.save();
    for (const half of halves) {
      const padding = 2;
      const x = half.col * CELL_SIZE + padding;
      const y = half.row * CELL_SIZE + padding;
      const w = CELL_SIZE - padding * 2;
      const h = CELL_SIZE - padding * 2;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
  }

  /**
   * Draw Ghost Capsule Landing Guide
   * @param {import('../Capsule.js').Capsule} capsule
   * @param {import('../Grid.js').Grid} grid
   * @param {string} mode
   */
  drawGhostCapsule(capsule, grid, mode = GAME_MODES.NORMAL) {
    if (!capsule || !grid) return;

    const ghost = capsule.getGhostPosition(grid);
    if (ghost.part1.row === capsule.part1.row && ghost.part2.row === capsule.part2.row) {
      return;
    }

    const ctx = this.ctx;
    ctx.save();

    const renderGhostHalf = (row, col) => {
      const padding = 2;
      const x = col * CELL_SIZE + padding;
      const y = row * CELL_SIZE + padding;
      const w = CELL_SIZE - padding * 2;
      const h = CELL_SIZE - padding * 2;

      ctx.fillStyle = FOCUS_THEME.ghostBg;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = FOCUS_THEME.ghostBorder;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    };

    renderGhostHalf(ghost.part1.row, ghost.part1.col);
    renderGhostHalf(ghost.part2.row, ghost.part2.col);

    ctx.restore();
  }

  /**
   * Helper to draw a rectangle with custom individual corner radii
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {number[]} radii [topLeft, topRight, bottomRight, bottomLeft]
   */
  drawPathWithRadii(x, y, w, h, radii) {
    const ctx = this.ctx;
    const [tl, tr, br, bl] = radii;

    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    if (tr > 0) ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    if (br > 0) ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    if (bl > 0) ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    if (tl > 0) ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
  }
}
