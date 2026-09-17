/**
 * Dr. Katakana - Sound & Speech Engine (Facade)
 * Coordinates Web Audio synth, chiptune BGM, and Japanese voice pronunciation.
 */

import { SoundSynth } from './audio/SoundSynth.js';
import { BGMPlayer } from './audio/BGMPlayer.js';
import { SpeechSpeaker } from './audio/SpeechSpeaker.js';

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.35;

    // Load persisted preferences
    try {
      const savedMute = localStorage.getItem('drKatakana_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
    } catch {}

    // Initialize sub-components
    this.synth = new SoundSynth(null, () => this.isMuted, this.masterVolume);
    this.bgm = new BGMPlayer(null, () => this.isMuted, this.masterVolume);
    this.speaker = new SpeechSpeaker();

    try {
      const savedVoice = localStorage.getItem('drKatakana_voice');
      if (savedVoice !== null) this.speaker.isEnabled = savedVoice === 'true';

      const savedBgm = localStorage.getItem('drKatakana_bgm');
      if (savedBgm !== null && savedBgm === 'true') {
        // Will start on first user interaction via ensureAudioContext
        this.bgm.isEnabled = true;
      }
    } catch {}
  }

  get isVoiceEnabled() {
    return this.speaker.isEnabled;
  }

  get isBgmEnabled() {
    return this.bgm.isEnabled;
  }

  /**
   * Initializes or resumes AudioContext on user interaction
   */
  ensureAudioContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.synth.setAudioContext(this.ctx);
        this.bgm.setAudioContext(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.bgm.isEnabled && !this.bgm.timer) {
      this.bgm.start();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('drKatakana_muted', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  toggleVoice() {
    const isVoice = this.speaker.toggle();
    try {
      localStorage.setItem('drKatakana_voice', String(isVoice));
    } catch {}
    return isVoice;
  }

  toggleBGM() {
    this.ensureAudioContext();
    const isBgm = this.bgm.toggle();
    try {
      localStorage.setItem('drKatakana_bgm', String(isBgm));
    } catch {}
    return isBgm;
  }

  startBGM() {
    this.ensureAudioContext();
    this.bgm.start();
  }

  stopBGM() {
    this.bgm.stop();
  }

  speak(text) {
    this.speaker.speak(text);
  }

  // Sound effects delegation
  playMove() {
    this.synth.playMove();
  }

  playRotate() {
    this.synth.playRotate();
  }

  playLock() {
    this.synth.playLock();
  }

  playHardDrop() {
    this.synth.playHardDrop();
  }

  playMatch(combo = 1) {
    this.synth.playMatch(combo);
  }

  playVirusClear() {
    this.synth.playVirusClear();
  }

  playStageClear() {
    this.synth.playStageClear();
  }

  playGameOver() {
    this.synth.playGameOver();
  }
}

// Singleton instance
export const soundEngine = new SoundEngine();
