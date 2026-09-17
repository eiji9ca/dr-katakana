/**
 * Dr. Katakana - Next Capsule Preview Canvas Renderer
 * Renders the queued next capsule in the sidebar preview box.
 */

import { CONNECT_DIR, GAME_MODES, FOCUS_THEME } from '../constants.js';
import { dictionary } from '../Dictionary.js';

export class NextPreviewRenderer {
  /**
   * Draw the Next Capsule in a standalone canvas context (for preview HUD)
   * Option 1: "Ink & Porcelain" Monochrome
   * @param {HTMLCanvasElement} targetCanvas
   * @param {Object} nextCapsuleData
   * @param {string} mode
   */
  static draw(targetCanvas, nextCapsuleData, mode = GAME_MODES.NORMAL) {
    if (!targetCanvas || !nextCapsuleData) return;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const width = targetCanvas.width;
    const height = targetCanvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dark preview background
    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, 0, width, height);

    // Subtle container border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    const { entry1, entry2 } = nextCapsuleData;
    const blockSize = 32;
    const startX = (width - blockSize * 2) / 2;
    const startY = (height - blockSize) / 2;

    const drawPreviewBlock = (x, y, entry, isLeft, displayType = null) => {
      const radii = isLeft ? [8, 0, 0, 8] : [0, 8, 8, 0];
      const safeEntry = entry || dictionary.getRandomEntry() || { katakana: 'ア', romaji: 'A' };
      const text = dictionary.getCapsuleDisplayText(safeEntry, mode, displayType);

      ctx.save();
      // Capsule background (crisp porcelain ivory)
      ctx.beginPath();
      const r = 8;
      const [tl, tr, br, bl] = radii;
      ctx.moveTo(x + tl, y);
      ctx.lineTo(x + blockSize - tr, y);
      if (tr > 0) ctx.arcTo(x + blockSize, y, x + blockSize, y + tr, tr);
      ctx.lineTo(x + blockSize, y + blockSize - br);
      if (br > 0) ctx.arcTo(x + blockSize, y + blockSize, x + blockSize - br, y + blockSize, br);
      ctx.lineTo(x + bl, y + blockSize);
      if (bl > 0) ctx.arcTo(x, y + blockSize, x, y + blockSize - bl, bl);
      ctx.lineTo(x, y + tl);
      if (tl > 0) ctx.arcTo(x, y, x + tl, y, tl);
      ctx.closePath();

      ctx.fillStyle = FOCUS_THEME.capsuleBg;
      ctx.fill();

      // Border outline
      ctx.strokeStyle = FOCUS_THEME.capsuleBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top gloss
      ctx.fillStyle = FOCUS_THEME.capsuleGloss;
      ctx.fillRect(x + 3, y + 2, blockSize - 6, 4);

      // Connection seam indicator
      ctx.strokeStyle = FOCUS_THEME.capsuleSeam;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (isLeft) {
        ctx.moveTo(x + blockSize, y + 2);
        ctx.lineTo(x + blockSize, y + blockSize - 2);
      } else {
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x, y + blockSize - 2);
      }
      ctx.stroke();

      // Deep midnight ink typography
      ctx.fillStyle = FOCUS_THEME.capsuleText;
      ctx.font = text.length > 1 ? 'bold 11px monospace' : 'bold 15px "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + blockSize / 2, y + blockSize / 2);
      ctx.restore();
    };

    drawPreviewBlock(startX, startY, entry1, true, nextCapsuleData.displayType1);
    drawPreviewBlock(startX + blockSize, startY, entry2, false, nextCapsuleData.displayType2);
  }
}
