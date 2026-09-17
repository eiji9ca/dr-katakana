/**
 * Particle System for celebratory match explosions and fireworks.
 */

import { CELL_SIZE } from './constants.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /**
   * Spawn glowing celebratory particle sparks at grid coordinates
   * @param {number} row
   * @param {number} col
   * @param {string} color
   * @param {number} count
   */
  spawnExplosion(row, col, color = '#FDE047', count = 10) {
    const cx = col * CELL_SIZE + CELL_SIZE / 2;
    const cy = row * CELL_SIZE + CELL_SIZE / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 90 + 30; // px/sec
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20, // initial upward lift
        size: Math.random() * 3.5 + 2,
        color: color,
        alpha: 1.0,
        life: 0.45 + Math.random() * 0.25, // seconds
        maxLife: 0.45 + Math.random() * 0.25,
      });
    }
  }

  /**
   * Update particle positions and fade lifetimes
   * @param {number} dt Delta time in ms
   */
  update(dt) {
    const dtSec = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vy += 180 * dtSec; // gravity acceleration
      p.life -= dtSec;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Draw active particles on the canvas
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.particles.length === 0) return;
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Remove all particles
   */
  clear() {
    this.particles = [];
  }
}
