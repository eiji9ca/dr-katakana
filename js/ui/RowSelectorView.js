/**
 * Dr. Katakana - Row & Random Kana Selection View Controller
 * Manages the interactive Katakana row buttons and random mix picker.
 */

import { KATAKANA_ROWS, getEntriesForRows, getRandomKanaSubset } from '../data/katakanaRepository.js';

export class RowSelectorView {
  /**
   * @param {Object} callbacks
   * @param {(entries: Array<Object>, desc: string) => void} callbacks.onSelectionChange
   * @param {() => void} [callbacks.onInteraction]
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;

    this.grid = document.getElementById('row-selector-grid');
    this.badge = document.getElementById('badge-row-count');
    this.summary = document.getElementById('row-selection-summary');
    this.randomCountBtns = document.querySelectorAll('.random-count-btn');
    this.rerollBtn = document.getElementById('btn-reroll-random');

    this.selectedRowIds = ['A'];
    this.isRandomMode = false;
    this.randomKanaCount = 5;
    this.currentRandomEntries = [];

    this.init();
  }

  init() {
    this.renderRowButtons();
    this.attachRandomListeners();
    this.updateUI();
  }

  renderRowButtons() {
    if (!this.grid) return;
    this.grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    KATAKANA_ROWS.forEach((row) => {
      const isSelected = !this.isRandomMode && this.selectedRowIds.includes(row.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `row-toggle-btn ${isSelected ? 'selected' : ''}`;
      btn.setAttribute('data-row-id', row.id);
      btn.title = `Click to practice ${row.name}: ${row.preview}`;

      btn.innerHTML = `
        <div class="row-btn-info">
          <span class="row-btn-title">${row.name}</span>
          <span class="row-btn-chars">${row.kanaRange}</span>
        </div>
        <span class="row-indicator">${isSelected ? '✓' : ''}</span>
      `;

      btn.addEventListener('click', () => {
        if (this.callbacks.onInteraction) this.callbacks.onInteraction();
        this.selectRow(row.id);
      });

      fragment.appendChild(btn);
    });

    this.grid.appendChild(fragment);
  }

  attachRandomListeners() {
    this.randomCountBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.callbacks.onInteraction) this.callbacks.onInteraction();
        const count = parseInt(btn.getAttribute('data-count'), 10) || 5;
        this.applyRandomSelection(count);
      });
    });

    if (this.rerollBtn) {
      this.rerollBtn.addEventListener('click', () => {
        if (this.callbacks.onInteraction) this.callbacks.onInteraction();
        this.applyRandomSelection(this.randomKanaCount);
      });
    }
  }

  selectRow(rowId) {
    if (!this.isRandomMode && this.selectedRowIds.length === 1 && this.selectedRowIds[0] === rowId) {
      return;
    }

    this.isRandomMode = false;
    this.selectedRowIds = [rowId];
    this.updateUI();

    const activeEntries = getEntriesForRows(this.selectedRowIds);
    const row = KATAKANA_ROWS.find(r => r.id === rowId);
    const rowName = row ? row.name : rowId;
    const desc = `${rowName} (${activeEntries.length} Kana)`;

    if (this.callbacks.onSelectionChange) {
      this.callbacks.onSelectionChange(activeEntries, desc);
    }
  }

  applyRandomSelection(count = 5) {
    this.isRandomMode = true;
    this.randomKanaCount = Math.max(3, Math.min(5, count));
    this.currentRandomEntries = getRandomKanaSubset(this.randomKanaCount);

    this.updateUI();

    const previewKana = this.currentRandomEntries.map(e => e.katakana).join(' ');
    const desc = `${this.randomKanaCount} Random Kana (${previewKana})`;

    if (this.callbacks.onSelectionChange) {
      this.callbacks.onSelectionChange(this.currentRandomEntries, desc);
    }
  }

  updateUI() {
    // 1. Update row toggle buttons in grid
    if (this.grid) {
      this.grid.querySelectorAll('.row-toggle-btn').forEach((btn) => {
        const rowId = btn.getAttribute('data-row-id');
        const isSelected = !this.isRandomMode && this.selectedRowIds.includes(rowId);
        btn.classList.toggle('selected', isSelected);
        const ind = btn.querySelector('.row-indicator');
        if (ind) ind.textContent = isSelected ? '✓' : '';
      });
    }

    // 2. Update random count buttons
    this.randomCountBtns.forEach((btn) => {
      const btnCount = parseInt(btn.getAttribute('data-count'), 10);
      btn.classList.toggle('active', this.isRandomMode && btnCount === this.randomKanaCount);
    });

    // 3. Update badge & summary
    if (this.isRandomMode) {
      if (this.badge) {
        this.badge.textContent = `🎲 ${this.randomKanaCount} Random Kana`;
        this.badge.style.background = '#8B5CF6';
      }
      const previewKana = this.currentRandomEntries.map(e => e.katakana).join(' ');
      if (this.summary) {
        this.summary.textContent = `Active: ${this.randomKanaCount} Random (${previewKana})`;
      }
    } else {
      const activeEntries = getEntriesForRows(this.selectedRowIds);
      const rowId = this.selectedRowIds[0] || 'A';
      const row = KATAKANA_ROWS.find(r => r.id === rowId);
      const rowName = row ? row.name : rowId;

      if (this.badge) {
        this.badge.textContent = `1 Row (${activeEntries.length} Kana)`;
        this.badge.style.background = '#059669';
      }
      if (this.summary) {
        this.summary.textContent = `Active: ${rowName} (${activeEntries.length} Kana)`;
      }
    }
  }
}
