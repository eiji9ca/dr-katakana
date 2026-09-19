/**
 * Dr. Katakana - Canvas Renderer (Coordinator)
 * Orchestrates grid, virus, capsule, next preview, and particle rendering.
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  PALETTE,
  CELL_TYPES,
  GAME_MODES,
} from './constants.js';
import { VirusRenderer } from './rendering/VirusRenderer.js';
import { CapsuleRenderer } from './rendering/CapsuleRenderer.js';
import { NextPreviewRenderer } from './rendering/NextPreviewRenderer.js';
import { ParticleSystem } from './ParticleSystem.js';

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.dpr = window.devicePixelRatio || 1;

    // Logical dimensions (fixes undefined this.width/this.height NaN bug in overlays)
    this.width = CANVAS_WIDTH;
    this.height = CANVAS_HEIGHT;

    // Sub-renderers
    this.virusRenderer = new VirusRenderer(this.ctx);
    this.capsuleRenderer = new CapsuleRenderer(this.ctx);
    this.particleSystem = new ParticleSystem();

    this.initCanvasSize();
  }

  /**
   * Configures canvas buffer size to match display scale.
   */
  initCanvasSize() {
    this.canvas.width = CANVAS_WIDTH * this.dpr;
    this.canvas.height = CANVAS_HEIGHT * this.dpr;
    this.canvas.style.width = `${CANVAS_WIDTH}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT}px`;

    // Reset transform & scale to DPR
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.virusRenderer.setContext(this.ctx);
    this.capsuleRenderer.setContext(this.ctx);
  }

  /**
   * Clear the entire canvas frame.
   */
  clear() {
    this.ctx.fillStyle = PALETTE.canvasBg;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /**
   * Draw the laboratory bottle grid background and borders.
   */
  drawGrid() {
    const ctx = this.ctx;

    // Draw subtle cell grid lines
    ctx.strokeStyle = PALETTE.gridLine;
    ctx.lineWidth = 1;

    for (let c = 1; c < GRID_COLS; c++) {
      const x = c * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let r = 1; r < GRID_ROWS; r++) {
      const y = r * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Outer bottle border
    ctx.strokeStyle = PALETTE.gridBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_WIDTH - 2, CANVAS_HEIGHT - 2);

    // Top bottle entrance markers (columns 3 and 4)
    const entranceLeft = 3 * CELL_SIZE;
    const entranceRight = 5 * CELL_SIZE;
    ctx.strokeStyle = PALETTE.bottleBorder;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(entranceLeft, 0);
    ctx.lineTo(entranceRight, 0);
    ctx.stroke();
  }

  /**
   * Main Grid Render Pass
   * @param {import('./Grid.js').Grid} grid
   * @param {string} mode
   * @param {number} timestamp
   * @param {Array<{ row: number, col: number }> | null} matchingCoords
   */
  renderGrid(grid, mode = GAME_MODES.NORMAL, timestamp = 0, matchingCoords = null) {
    if (!grid) return;

    const matchSet = matchingCoords ? new Set(matchingCoords.map(m => `${m.row},${m.col}`)) : null;

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const cell = grid.get(r, c);
        if (!cell) continue;

        const isMatching = matchSet ? matchSet.has(`${r},${c}`) : false;

        if (cell.type === CELL_TYPES.VIRUS) {
          this.virusRenderer.drawVirus(r, c, cell, mode, timestamp, isMatching);
        } else if (cell.type === CELL_TYPES.CAPSULE_HALF) {
          this.capsuleRenderer.drawCapsuleHalf(r, c, cell, mode, isMatching, timestamp);
        }
      }
    }
  }

  drawVirus(row, col, virus, mode, timestamp, isMatching = false) {
    this.virusRenderer.drawVirus(row, col, virus, mode, timestamp, isMatching);
  }

  drawCapsuleHalf(row, col, half, mode, isMatching = false, timestamp = 0) {
    this.capsuleRenderer.drawCapsuleHalf(row, col, half, mode, isMatching, timestamp);
  }

  drawActiveCapsule(capsule, mode = GAME_MODES.NORMAL) {
    this.capsuleRenderer.drawActiveCapsule(capsule, mode);
  }

  drawGhostCapsule(capsule, grid, mode = GAME_MODES.NORMAL) {
    this.capsuleRenderer.drawGhostCapsule(capsule, grid, mode);
  }

  drawNextPreview(targetCanvas, nextCapsuleData, mode = GAME_MODES.NORMAL) {
    NextPreviewRenderer.draw(targetCanvas, nextCapsuleData, mode);
  }

  /**
   * Draw floating Combo or Match banner
   * @param {string} text
   * @param {number} [alpha=1]
   */
  drawComboBanner(text, alpha = 1) {
    if (!text) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;

    const boxW = 200;
    const boxH = 44;
    const boxX = (this.width - boxW) / 2;
    const boxY = 60;

    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 16px monospace, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.width / 2, boxY + boxH / 2);
    ctx.restore();
  }

  /**
   * Draw Game Over or Stage Clear Overlay
   * @param {boolean} isVictory
   * @param {number} stage
   * @param {number} score
   * @param {number} highScore
   */
  drawEndGameOverlay(isVictory, stage = 1, score = 0, highScore = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = isVictory ? 'rgba(6, 78, 59, 0.90)' : 'rgba(127, 29, 29, 0.90)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(isVictory ? `STAGE ${stage} CLEAR!` : 'GAME OVER', this.width / 2, this.height / 2 - 40);

    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(
      isVictory ? 'All viruses eliminated! 🎉' : 'Bottle topped out! Chute blocked.',
      this.width / 2,
      this.height / 2 - 12
    );

    ctx.font = 'bold 15px monospace, system-ui';
    ctx.fillStyle = '#FDE047';
    ctx.fillText(`Score: ${score}  |  Best: ${highScore}`, this.width / 2, this.height / 2 + 16);

    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = '#A7F3D0';
    if (isVictory) {
      ctx.fillText(`Click "Next Stage" or Press SPACE`, this.width / 2, this.height / 2 + 48);
    } else {
      ctx.fillStyle = '#FECACA';
      ctx.fillText(`Press SPACE or R to Retry Level ${stage}`, this.width / 2, this.height / 2 + 48);
    }

    ctx.restore();
  }

  /**
   * Draw "Ready to Play" start overlay when waiting for player to start the game
   */
  drawStartPrompt() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fillRect(0, 0, this.width, this.height);

    const boxW = 230;
    const boxH = 96;
    const boxX = (this.width - boxW) / 2;
    const boxY = (this.height - boxH) / 2 - 20;

    // Card background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.96)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText('▶ READY TO PLAY', this.width / 2, boxY + 28);

    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText('Press "Start Game" or', this.width / 2, boxY + 56);
    ctx.font = 'bold 12px monospace, system-ui';
    ctx.fillStyle = '#FDE047';
    ctx.fillText('SPACEBAR to Begin', this.width / 2, boxY + 74);

    ctx.restore();
  }

  /**
   * Draw Pause overlay
   */
  drawPauseOverlay() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 20);

    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Press P or click Resume to continue', this.width / 2, this.height / 2 + 12);
    ctx.restore();
  }

  get particles() {
    return this.particleSystem.particles;
  }

  spawnExplosion(row, col, color = '#FDE047', count = 10) {
    this.particleSystem.spawnExplosion(row, col, color, count);
  }

  updateParticles(dt) {
    this.particleSystem.update(dt);
  }

  drawParticles() {
    this.particleSystem.draw(this.ctx);
  }
}
