/**
 * Dr. Katakana - Main Application Bootstrap
 * Initializes canvas, wires up UI controllers, touch pad, and game engine.
 */

import { Game } from './Game.js';
import { soundEngine } from './SoundEngine.js';
import { CELL_SIZE } from './constants.js';
import { HudController } from './ui/HudController.js';
import { RowSelectorView } from './ui/RowSelectorView.js';
import { StudyGuideView } from './ui/StudyGuideView.js';
import { TouchControlsView } from './ui/TouchControlsView.js';
import { getEntriesForRows } from './data/katakanaRepository.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvasElement = document.getElementById('game-canvas');
  const nextCanvasElement = document.getElementById('next-canvas');

  // UI Controllers
  const hud = new HudController();
  const studyGuide = new StudyGuideView();

  // Control Buttons
  const startBtn = document.getElementById('btn-start-game');
  const pauseBtn = document.getElementById('btn-pause');
  const restartBtn = document.getElementById('btn-restart');
  const nextStageBtn = document.getElementById('btn-next-stage');
  const muteBtn = document.getElementById('btn-mute');
  const bgmBtn = document.getElementById('btn-bgm');
  const toggleModeBtn = document.getElementById('btn-toggle-mode');
  const levelPrevBtn = document.getElementById('btn-level-prev');
  const levelNextBtn = document.getElementById('btn-level-next');
  const hudStage = document.getElementById('hud-stage');

  // Initialize Audio Button States
  if (muteBtn) {
    muteBtn.textContent = soundEngine.isMuted ? '🔇 SFX: OFF' : '🔊 SFX: ON';
    if (soundEngine.isMuted) muteBtn.style.color = '#EF4444';
  }
  if (bgmBtn) {
    bgmBtn.textContent = soundEngine.isBgmEnabled ? '🎵 BGM: ON' : '🎵 BGM: OFF';
    if (soundEngine.isBgmEnabled) bgmBtn.style.color = '#38BDF8';
  }

  // Initialize Game Instance
  const game = new Game(canvasElement, {
    onStatsUpdate: (stats) => {
      hud.updateStats(stats);
    },
    onStateChange: (state) => {
      hud.updateState(state);
    },
  }, nextCanvasElement);

  // Initialize Katakana Row & Random Selector View
  const rowSelector = new RowSelectorView({
    onSelectionChange: (entries, desc) => {
      game.setCustomEntries(entries, desc, true);
      studyGuide.render(entries);
    },
    onInteraction: () => {
      soundEngine.ensureAudioContext();
    },
  });

  // Initial Study Guide reference chips
  studyGuide.render(getEntriesForRows(['A']));

  // Initialize On-Screen Touch Gamepad
  new TouchControlsView({
    onMoveLeft: () => game.moveLeft(),
    onMoveRight: () => game.moveRight(),
    onRotateCCW: () => game.rotateCCW(),
    onRotateCW: () => game.rotateCW(),
    onHardDrop: () => {
      if (!game.isStarted) {
        game.startGame();
      } else {
        game.hardDrop();
      }
    },
    onSoftDropStart: () => game.startSoftDrop(),
    onSoftDropEnd: () => game.stopSoftDrop(),
  });

  // Start the render loop
  game.start();
  hud.updateState(game.getStateSnapshot());
  game.renderNextPreview();

  // Start Game Button (also handles Restart when paused)
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      soundEngine.ensureAudioContext();
      if (!game.isStarted || game.isGameOver) {
        game.startGame();
      } else if (game.isPaused) {
        game.restart();
      }
    });
  }

  // Next Stage Button
  if (nextStageBtn) {
    nextStageBtn.addEventListener('click', () => {
      soundEngine.ensureAudioContext();
      game.nextStage();
    });
  }

  // Audio Buttons
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      soundEngine.ensureAudioContext();
      const isMuted = soundEngine.toggleMute();
      muteBtn.textContent = isMuted ? '🔇 SFX: OFF' : '🔊 SFX: ON';
      muteBtn.style.color = isMuted ? '#EF4444' : '';
    });
  }

  if (bgmBtn) {
    bgmBtn.addEventListener('click', () => {
      soundEngine.ensureAudioContext();
      const isBgm = soundEngine.toggleBGM();
      bgmBtn.textContent = isBgm ? '🎵 BGM: ON' : '🎵 BGM: OFF';
      bgmBtn.style.color = isBgm ? '#38BDF8' : '';
    });
  }

  // Mode Toggle
  if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', () => {
      game.toggleMode();
    });
  }

  // Pause / Resume / Restart
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      soundEngine.ensureAudioContext();
      if (game.isVictory) {
        game.nextStage();
      } else if (game.isGameOver) {
        game.restart();
      } else {
        game.togglePause();
      }
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      soundEngine.ensureAudioContext();
      game.restart();
    });
  }

  // Level Stepper & Cycle
  if (levelPrevBtn) {
    levelPrevBtn.addEventListener('click', () => {
      soundEngine.ensureAudioContext();
      game.toggleStage(-1);
    });
  }

  if (levelNextBtn) {
    levelNextBtn.addEventListener('click', () => {
      soundEngine.ensureAudioContext();
      game.toggleStage(1);
    });
  }

  if (hudStage) {
    hudStage.addEventListener('click', () => {
      soundEngine.ensureAudioContext();
      game.toggleStage(1);
    });
  }

  // Keyboard shortcuts: 'M' (mode), '1'-'9' and '0' (Level 1-10), '[' and ']' (level toggle)
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      game.toggleMode();
    }
    const num = parseInt(e.key, 10);
    if (!isNaN(num)) {
      if (num >= 1 && num <= 9) {
        soundEngine.ensureAudioContext();
        game.setStage(num);
      } else if (num === 0) {
        soundEngine.ensureAudioContext();
        game.setStage(10);
      }
    }
    if (e.key === '[' || e.key === '{') {
      soundEngine.ensureAudioContext();
      game.toggleStage(-1);
    }
    if (e.key === ']' || e.key === '}') {
      soundEngine.ensureAudioContext();
      game.toggleStage(1);
    }
  });

  // Canvas Click Inspection
  if (canvasElement) {
    canvasElement.addEventListener('click', (e) => {
      soundEngine.ensureAudioContext();

      if (game.isVictory) {
        game.nextStage();
        return;
      }
      if (game.isGameOver) {
        game.restart();
        return;
      }

      const rect = canvasElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const col = Math.floor(clickX / CELL_SIZE);
      const row = Math.floor(clickY / CELL_SIZE);

      if (game.grid.isValid(row, col)) {
        const cell = game.grid.get(row, col);
        console.log(`[Grid Inspection] Cell [Row ${row}, Col ${col}]:`, cell || 'Empty cell');
      }
    });
  }

  // Expose global for debugging
  window.drKatakanaGame = game;
  console.log('🧪 Dr. Katakana - Modular Architecture Initialized.');
});
