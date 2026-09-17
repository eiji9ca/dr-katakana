/**
 * Dr. Katakana - Procedural Web Audio Sound Synthesizer
 * Generates retro 8-bit chip sound effects using oscillators and gain envelopes.
 */

export class SoundSynth {
  /**
   * @param {AudioContext} ctx
   * @param {() => boolean} isMutedGetter
   * @param {number} masterVolume
   */
  constructor(ctx, isMutedGetter, masterVolume = 0.35) {
    this.ctx = ctx;
    this.isMutedGetter = isMutedGetter;
    this.masterVolume = masterVolume;
  }

  setAudioContext(ctx) {
    this.ctx = ctx;
  }

  get isMuted() {
    return this.isMutedGetter ? this.isMutedGetter() : false;
  }

  /**
   * Helper to play an exponential frequency ramp tone
   * @param {OscillatorType} type
   * @param {number} startFreq
   * @param {number} endFreq
   * @param {number} duration In seconds
   * @param {number} volumeScale Relative volume
   */
  playRampTone(type, startFreq, endFreq, duration, volumeScale) {
    if (this.isMuted || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);

      gain.gain.setValueAtTime(volumeScale * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Ignore audio synthesis errors on suspended contexts
    }
  }

  /**
   * Pill shift tick
   */
  playMove() {
    this.playRampTone('triangle', 360, 180, 0.04, 0.08);
  }

  /**
   * Pill rotate chirp
   */
  playRotate() {
    this.playRampTone('sine', 420, 740, 0.06, 0.12);
  }

  /**
   * Pill ground lock click
   */
  playLock() {
    this.playRampTone('triangle', 260, 120, 0.05, 0.1);
  }

  /**
   * Instant hard drop impact thud
   */
  playHardDrop() {
    this.playRampTone('sine', 180, 40, 0.12, 0.25);
  }

  /**
   * Contiguous 3-match chord & arpeggio
   * @param {number} combo Combo chain depth (1, 2, 3...)
   */
  playMatch(combo = 1) {
    if (this.isMuted || !this.ctx) return;

    try {
      const baseFreqs = [523.25, 659.25, 783.99, 987.77, 1046.5]; // C5, E5, G5, B5, C6
      const pitchShift = Math.min(3, combo - 1);

      baseFreqs.slice(0, 3).forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const actualFreq = freq * Math.pow(1.12, pitchShift);
        const noteDelay = idx * 0.05;

        osc.type = 'square';
        osc.frequency.setValueAtTime(actualFreq, this.ctx.currentTime + noteDelay);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + noteDelay);
        gain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, this.ctx.currentTime + noteDelay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + noteDelay + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + noteDelay);
        osc.stop(this.ctx.currentTime + noteDelay + 0.25);
      });
    } catch {}
  }

  /**
   * Virus destruction noise crunch
   */
  playVirusClear() {
    if (this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Multi-oscillator punch
      [220, 440, 880].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

        gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
      });
    } catch {}
  }

  /**
   * Stage Clear Victory Jingle
   */
  playStageClear() {
    if (this.isMuted || !this.ctx) return;

    try {
      const melody = [
        { f: 523.25, d: 0.10 }, // C5
        { f: 659.25, d: 0.10 }, // E5
        { f: 783.99, d: 0.10 }, // G5
        { f: 1046.5, d: 0.35 }, // C6
      ];

      let startTime = this.ctx.currentTime;
      melody.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, startTime);

        gain.gain.setValueAtTime(0.2 * this.masterVolume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.d + 0.01);

        startTime += note.d + 0.04;
      });
    } catch {}
  }

  /**
   * Game Over descending sad jingle
   */
  playGameOver() {
    if (this.isMuted || !this.ctx) return;

    try {
      const notes = [440, 392, 349.23, 261.63]; // A4, G4, F4, C4
      let time = this.ctx.currentTime;

      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, time + i * 0.18);

        gain.gain.setValueAtTime(0.12 * this.masterVolume, time + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.18 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time + i * 0.18);
        osc.stop(time + i * 0.18 + 0.25);
      });
    } catch {}
  }
}
