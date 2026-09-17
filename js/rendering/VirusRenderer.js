/**
 * Dr. Katakana - Living Virus Canvas Renderer
 * Option 1: "Ink & Porcelain" Monochrome
 * Renders charcoal slate microbial viruses with luminous white typography.
 */

import { CELL_SIZE, FOCUS_THEME } from '../constants.js';
import { dictionary } from '../Dictionary.js';

export class VirusRenderer {
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
   * Draw an animated living Virus at grid cell [row, col]
   * @param {number} row
   * @param {number} col
   * @param {Object} virus
   * @param {string} mode
   * @param {number} timestamp
   * @param {boolean} [isMatching=false]
   */
  drawVirus(row, col, virus, mode, timestamp, isMatching = false) {
    const ctx = this.ctx;
    const cx = col * CELL_SIZE + CELL_SIZE / 2;
    const cy = row * CELL_SIZE + CELL_SIZE / 2;

    const entry = virus.entry || dictionary.getRandomEntry() || { katakana: 'ア', romaji: 'A' };
    const text = dictionary.getVirusDisplayText(entry, mode, virus.displayType);

    // Monochrome theme tokens
    const bodyColor = isMatching ? FOCUS_THEME.matchFlash : FOCUS_THEME.virusBg;
    const feelerColor = isMatching ? FOCUS_THEME.matchFlash : FOCUS_THEME.virusFeeler;
    const textColor = isMatching ? FOCUS_THEME.capsuleText : FOCUS_THEME.virusText;

    // Subtle desynchronized breathing cycle (or rapid flash if matching)
    const t = isMatching
      ? (timestamp / 1000) * 18
      : (timestamp / 1000) * 3 + (virus.pulseOffset || 0);
    const pulse = Math.sin(t) * (isMatching ? 3.5 : 1.5);
    const baseRadius = CELL_SIZE * 0.41;
    const radius = Math.max(8, baseRadius + pulse);

    ctx.save();

    if (isMatching) {
      ctx.shadowColor = FOCUS_THEME.matchHalo;
      ctx.shadowBlur = 18;
    }

    // 1. Microbial perimeter feelers (6 orbital nodes)
    const feelerCount = 6;
    ctx.fillStyle = feelerColor;
    for (let i = 0; i < feelerCount; i++) {
      const angle = (Math.PI * 2 * i) / feelerCount + (t * 0.2);
      const feelerDist = radius + 3.5 + Math.sin(t * 2 + i) * 1.2;
      const fx = cx + Math.cos(angle) * feelerDist;
      const fy = cy + Math.sin(angle) * feelerDist;

      ctx.beginPath();
      ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Main Virus Body Circle (Deep charcoal slate)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = bodyColor;
    ctx.fill();

    // Outer refined slate border
    ctx.strokeStyle = isMatching ? FOCUS_THEME.matchHalo : FOCUS_THEME.virusBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Inner darker nucleus ring for depth
    if (!isMatching) {
      ctx.strokeStyle = FOCUS_THEME.virusNucleus;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 4. Specular glossy highlight arc at top-left
    ctx.beginPath();
    ctx.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.5, Math.PI * 1.0, Math.PI * 1.5);
    ctx.strokeStyle = isMatching ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Centered Sound Text (Crisp luminous white)
    ctx.fillStyle = textColor;
    ctx.shadowColor = isMatching ? 'transparent' : 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = isMatching ? 0 : 4;

    if (text.length > 1) {
      ctx.font = 'bold 12px monospace, system-ui';
    } else {
      ctx.font = 'bold 16px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);

    ctx.restore();
  }
}
