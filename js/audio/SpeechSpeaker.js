/**
 * Dr. Katakana - Japanese Voice Pronunciation Speaker
 * Uses browser Web Speech API (speechSynthesis) to pronounce Katakana sounds upon matches.
 */

export class SpeechSpeaker {
  constructor() {
    this.isEnabled = true;
    this.japaneseVoice = null;

    this.initVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => this.initVoices();
    }
  }

  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    this.japaneseVoice = voices.find(v => v.lang.startsWith('ja')) || null;
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  /**
   * Speak Katakana character or phrase in natural Japanese
   * @param {string} text
   */
  speak(text) {
    if (!this.isEnabled || typeof window === 'undefined' || !window.speechSynthesis || !text) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      if (this.japaneseVoice) {
        utterance.voice = this.japaneseVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }
}
