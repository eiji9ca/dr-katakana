/**
 * Dr. Katakana - Game Loop Runner
 * Manages requestAnimationFrame, delta time capping, and smoothed FPS calculations.
 */

import { TARGET_FPS } from '../constants.js';

export class GameLoop {
  /**
   * @param {Object} callbacks
   * @param {(dt: number) => void} callbacks.onUpdate
   * @param {(timestamp: number) => void} callbacks.onRender
   * @param {(stats: Object) => void} [callbacks.onStatsUpdate]
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;

    this.isRunning = false;
    this.isPaused = false;
    this.animationFrameId = null;

    this.lastTimestamp = 0;
    this.elapsedTime = 0;
    this.fps = TARGET_FPS;
    this.dt = 0;
    this.frameCount = 0;
    this.fpsUpdateTimer = 0;

    this.tick = this.tick.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
    return this.isPaused;
  }

  tick(currentTimestamp) {
    if (!this.isRunning || this.isPaused) return;

    const rawDt = currentTimestamp - this.lastTimestamp;
    this.lastTimestamp = currentTimestamp;

    // Cap delta time to 100ms to prevent collision spiraling when tab is backgrounded
    this.dt = Math.min(rawDt, 100);
    this.elapsedTime += this.dt;
    this.frameCount++;

    // Calculate smoothed FPS every 250ms
    this.fpsUpdateTimer += this.dt;
    if (this.fpsUpdateTimer >= 250) {
      if (this.dt > 0) {
        const instantFps = 1000 / this.dt;
        this.fps = this.fps * 0.7 + instantFps * 0.3;
      }
      this.fpsUpdateTimer = 0;

      if (this.callbacks.onStatsUpdate) {
        this.callbacks.onStatsUpdate({
          fps: Math.round(this.fps),
          dt: Math.round(this.dt),
          elapsedTime: Math.round(this.elapsedTime / 1000),
          frameCount: this.frameCount,
        });
      }
    }

    if (this.callbacks.onUpdate) {
      this.callbacks.onUpdate(this.dt);
    }
    if (this.callbacks.onRender) {
      this.callbacks.onRender(currentTimestamp);
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  }
}
