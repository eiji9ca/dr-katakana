/**
 * Dr. Katakana - HUD Controller
 * Updates HUD metrics with dirty-checking to eliminate DOM thrashing.
 */

import { GAME_MODES } from '../constants.js';

export class HudController {
  constructor() {
    this.elements = {
      status: document.getElementById('hud-status'),
      modeName: document.getElementById('hud-mode-name'),
      stage: document.getElementById('hud-stage'),
      score: document.getElementById('hud-score'),
      highScore: document.getElementById('hud-high-score'),
      virusCount: document.getElementById('hud-virus-count'),
      combo: document.getElementById('hud-combo'),
      activeRows: document.getElementById('hud-active-rows'),
      themeName: document.getElementById('hud-theme-name'),
      btnNextStage: document.getElementById('btn-next-stage'),
      btnModeText: document.getElementById('btn-mode-text'),
      pauseBtn: document.getElementById('btn-pause'),
    };

    // Cache of previously applied values to avoid redundant DOM mutations
    this.cache = {};
  }

  /**
   * Updates element textContent only if value has changed
   * @param {HTMLElement} el
   * @param {string} key
   * @param {string} value
   */
  setTextIfChanged(el, key, value) {
    if (el && this.cache[key] !== value) {
      el.textContent = value;
      this.cache[key] = value;
    }
  }

  /**
   * Sync high-frequency stats
   * @param {Object} stats
   */
  updateStats(stats) {
    if (stats.virusCount !== undefined) {
      this.setTextIfChanged(
        this.elements.virusCount,
        'virusCount',
        `${stats.virusCount} Virus${stats.virusCount === 1 ? '' : 'es'}`
      );
    }
  }

  /**
   * Sync game state changes (stage, score, mode, combo)
   * @param {Object} state
   */
  updateState(state) {
    const stageNum = state.stage || 1;
    this.setTextIfChanged(this.elements.stage, 'stage', `Level ${stageNum}`);
    if (this.elements.stage) {
      this.elements.stage.title = `Level ${stageNum} (${state.stageViruses || 4} Viruses) - Click to cycle`;
    }
    this.setTextIfChanged(this.elements.score, 'score', `${state.score || 0}`);
    this.setTextIfChanged(this.elements.highScore, 'highScore', `${state.highScore || 0}`);
    this.setTextIfChanged(this.elements.combo, 'combo', state.comboCount > 1 ? `${state.comboCount}x` : '1x');

    if (state.virusCount !== undefined) {
      this.setTextIfChanged(
        this.elements.virusCount,
        'virusCount',
        `${state.virusCount} Virus${state.virusCount === 1 ? '' : 'es'}`
      );
    }

    // Next Stage button visibility
    if (this.elements.btnNextStage) {
      const display = state.isVictory ? 'block' : 'none';
      if (this.cache.btnNextStageDisplay !== display) {
        this.elements.btnNextStage.style.display = display;
        this.cache.btnNextStageDisplay = display;
      }
    }

    // Mode labels
    if (this.elements.modeName) {
      let modeName = 'Mixed (Kana + Romaji)';
      let modeColor = '#38BDF8';
      if (state.mode === GAME_MODES.REVERSE) {
        modeName = 'Reverse (Viruses = Katakana)';
        modeColor = 'var(--accent-pink)';
      } else if (state.mode === GAME_MODES.NORMAL) {
        modeName = 'Normal (Viruses = Romaji)';
        modeColor = 'var(--accent-cyan)';
      }
      this.setTextIfChanged(this.elements.modeName, 'modeName', modeName);
      if (this.cache.modeColor !== modeColor) {
        this.elements.modeName.style.color = modeColor;
        this.cache.modeColor = modeColor;
      }
    }

    if (this.elements.btnModeText) {
      let btnText = 'Mode: Mixed (English & Katakana)';
      if (state.mode === GAME_MODES.NORMAL) {
        btnText = 'Mode: Normal (Viruses = Romaji)';
      } else if (state.mode === GAME_MODES.REVERSE) {
        btnText = 'Mode: Reverse (Viruses = Katakana)';
      }
      this.setTextIfChanged(this.elements.btnModeText, 'btnModeText', btnText);
    }

    // Visual Theme
    if (this.elements.themeName) {
      this.setTextIfChanged(this.elements.themeName, 'themeName', state.themeName || 'Ink & Porcelain');
    }

    if (this.elements.activeRows && state.selectedRowsDesc) {
      this.setTextIfChanged(this.elements.activeRows, 'activeRowsDesc', state.selectedRowsDesc);
    }

    // Status badge
    if (this.elements.status) {
      let statusText = 'PLAYING';
      let statusClass = 'status-badge status-running';
      let statusBg = '';
      let pauseLabel = 'Pause';

      if (state.isVictory) {
        statusText = 'STAGE CLEAR!';
        statusClass = 'status-badge status-running';
        statusBg = '#10B981';
        pauseLabel = 'Next Stage';
      } else if (state.isGameOver) {
        statusText = 'GAME OVER';
        statusClass = 'status-badge status-stopped';
        pauseLabel = 'Restart';
      } else if (!state.isRunning) {
        statusText = 'STOPPED';
        statusClass = 'status-badge status-stopped';
      } else if (state.isPaused) {
        statusText = 'PAUSED';
        statusClass = 'status-badge status-paused';
        pauseLabel = 'Resume Loop';
      } else if (state.processState === 'matching') {
        statusText = 'MATCHING...';
        statusClass = 'status-badge status-running';
        statusBg = '#F59E0B';
      } else if (state.processState === 'cascading') {
        statusText = 'CASCADE FALL...';
        statusClass = 'status-badge status-running';
        statusBg = '#8B5CF6';
      }

      this.setTextIfChanged(this.elements.status, 'statusText', statusText);
      if (this.cache.statusClass !== statusClass) {
        this.elements.status.className = statusClass;
        this.cache.statusClass = statusClass;
      }
      if (this.cache.statusBg !== statusBg) {
        this.elements.status.style.background = statusBg;
        this.cache.statusBg = statusBg;
      }
      if (this.elements.pauseBtn) {
        this.setTextIfChanged(this.elements.pauseBtn, 'pauseLabel', pauseLabel);
      }
    }
  }
}
