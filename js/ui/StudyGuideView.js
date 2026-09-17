/**
 * Dr. Katakana - Study Guide Reference View
 * Renders Katakana reference chips in the sidebar study guide.
 */

export class StudyGuideView {
  constructor() {
    this.container = document.getElementById('dict-list');
    this.title = document.getElementById('dict-card-title');
    this.lastRenderedKey = '';
  }

  /**
   * Render Katakana reference chips for specified entries
   * @param {Array<Object>} entries
   */
  render(entries = []) {
    if (!this.container) return;

    // Fast check if same set is already rendered
    const key = entries.map(e => e.id).join(',');
    if (key === this.lastRenderedKey) return;
    this.lastRenderedKey = key;

    if (this.title) {
      this.title.textContent = `Katakana Reference Chart (${entries.length})`;
    }

    this.container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    entries.forEach((item) => {
      const chip = document.createElement('div');
      chip.className = 'dict-chip';
      chip.innerHTML = `<span class="dict-kana">${item.katakana}</span><span class="dict-romaji">${item.romaji}</span>`;
      fragment.appendChild(chip);
    });

    this.container.appendChild(fragment);
  }
}
