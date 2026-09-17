/**
 * Dr. Katakana - 8-Bit Chiptune BGM Player
 * Loads melody and bass note sequences from JSON data and plays retro synthesized music.
 */

import bgmData from '../../data/audio/bgm-chiptune.json';

export class BGMPlayer {
  /**
   * @param {AudioContext} ctx
   * @param {() => boolean} isMutedGetter
   * @param {number} masterVolume
   */
  constructor(ctx, isMutedGetter, masterVolume = 0.35) {
    this.ctx = ctx;
    this.isMutedGetter = isMutedGetter;
    this.masterVolume = masterVolume;
    this.isEnabled = false;
    this.timer = null;
    this.step = 0;
    this.melody = bgmData.melody;
    this.bass = bgmData.bass;
    this.stepMs = bgmData.stepMs || 135;
  }

  setAudioContext(ctx) {
    this.ctx = ctx;
  }

  get isMuted() {
    return this.isMutedGetter ? this.isMutedGetter() : false;
  }

  start() {
    if (this.timer) return;
    this.isEnabled = true;
    if (!this.ctx) return;

    this.timer = setInterval(() => {
      if (this.isMuted || !this.isEnabled || !this.ctx) return;

      const idx = this.step % this.melody.length;
      this.step++;

      const mFreq = this.melody[idx];
      const bFreq = this.bass[idx];

      const now = this.ctx.currentTime;

      // Play lead tone
      if (mFreq > 0) {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(mFreq, now);

          gain.gain.setValueAtTime(0.04 * this.masterVolume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.12);
        } catch {}
      }

      // Play bass tone
      if (bFreq > 0) {
        try {
          const bOsc = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();

          bOsc.type = 'triangle';
          bOsc.frequency.setValueAtTime(bFreq, now);

          bGain.gain.setValueAtTime(0.06 * this.masterVolume, now);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          bOsc.connect(bGain);
          bGain.connect(this.ctx.destination);

          bOsc.start(now);
          bOsc.stop(now + 0.13);
        } catch {}
      }
    }, this.stepMs);
  }

  stop() {
    this.isEnabled = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  toggle() {
    if (this.isEnabled) {
      this.stop();
    } else {
      this.start();
    }
    return this.isEnabled;
  }
}
