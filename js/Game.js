/**
 * Dr. Katakana - Core Game Engine & State Machine
 * Coordinates falling capsules, matching rules, stage progression, and scoring.
 */

import { Renderer } from './Renderer.js';
import { Grid } from './Grid.js';
import { Capsule } from './Capsule.js';
import { InputHandler } from './InputHandler.js';
import { MatchEngine } from './MatchEngine.js';
import { Dictionary, dictionary } from './Dictionary.js';
import { soundEngine } from './SoundEngine.js';
import { GameLoop } from './engine/GameLoop.js';
import {
  GAME_MODES,
  FALL_SPEEDS,
  CAPSULE_SPAWN,
  STAGE_CONFIGS,
  TIMINGS,
  getRandomPillColor,
} from './constants.js';
import {
  KATAKANA_SETS,
  KATAKANA_ROWS,
  getEntriesForRows,
} from './data/katakanaRepository.js';

export class Game {
  /**
   * @param {string | HTMLCanvasElement} canvasTarget
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onStatsUpdate]
   * @param {Function} [callbacks.onStateChange]
   * @param {HTMLCanvasElement} [previewCanvasTarget]
   */
  constructor(canvasTarget, callbacks = {}, previewCanvasTarget = null) {
    /** @type {HTMLCanvasElement} */
    this.canvas = typeof canvasTarget === 'string'
      ? document.getElementById(canvasTarget)
      : canvasTarget;

    if (!this.canvas) {
      throw new Error(`[Game] Canvas element '${canvasTarget}' not found in DOM.`);
    }

    /** @type {HTMLCanvasElement | null} */
    this.previewCanvas = typeof previewCanvasTarget === 'string'
      ? document.getElementById(previewCanvasTarget)
      : previewCanvasTarget;

    this.callbacks = callbacks;
    this.renderer = new Renderer(this.canvas);
    this.grid = new Grid();

    // Mode and settings
    this.mode = GAME_MODES.NORMAL;
    this.selectedRowIds = ['A'];
    this.customSelectionDesc = null;

    // Stage & High Score Persistence
    this.currentStage = 1;
    this.highScore = 0;
    this.topStage = 1;
    try {
      const savedHigh = localStorage.getItem('drKatakana_highScore');
      if (savedHigh) this.highScore = parseInt(savedHigh, 10) || 0;
      const savedStage = localStorage.getItem('drKatakana_topStage');
      if (savedStage) this.topStage = parseInt(savedStage, 10) || 1;
      const savedLevel = localStorage.getItem('drKatakana_selectedLevel');
      if (savedLevel) {
        const parsed = parseInt(savedLevel, 10);
        if (parsed >= 1 && parsed <= STAGE_CONFIGS.length) {
          this.currentStage = parsed;
        }
      }
    } catch {}

    // Capsule State
    /** @type {Capsule | null} */
    this.activeCapsule = null;
    this.nextCapsule = this.generateCapsulePair();

    this.fallTimer = 0;
    this.isStarted = false;
    this.isSoftDropping = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.capsulesDropped = 0;
    this.score = 0;
    this.virusesCleared = 0;

    // State machine: 'playing' | 'matching' | 'cascading' | 'game_over'
    this.processState = 'playing';
    this.processTimer = 0;
    this.currentMatches = null;
    this.comboCount = 0;
    this.comboBannerText = '';
    this.comboBannerAlpha = 0;

    // Initialize GameLoop
    this.loop = new GameLoop({
      onUpdate: (dt) => this.update(dt),
      onRender: (timestamp) => this.render(timestamp),
      onStatsUpdate: (stats) => {
        if (this.callbacks.onStatsUpdate) {
          this.callbacks.onStatsUpdate({
            ...stats,
            virusCount: this.grid.getVirusCount(),
            totalOccupied: this.grid.getTotalOccupiedCount(),
            capsulesDropped: this.capsulesDropped,
            mode: this.mode,
            isGameOver: this.isGameOver,
            score: this.score,
            isStarted: this.isStarted,
          });
        }
      },
    });

    // Initialize Keyboard Input
    this.input = new InputHandler({
      onMoveLeft: () => this.moveLeft(),
      onMoveRight: () => this.moveRight(),
      onSoftDropStart: () => this.startSoftDrop(),
      onSoftDropEnd: () => this.stopSoftDrop(),
      onRotateCW: () => this.rotateCW(),
      onRotateCCW: () => this.rotateCCW(),
      onHardDrop: () => {
        if (!this.isStarted) {
          this.startGame();
        } else if (this.isVictory) {
          this.nextStage();
        } else if (this.isGameOver) {
          this.restart();
        } else {
          this.hardDrop();
        }
      },
      onRestart: () => this.restart(),
      onTogglePause: () => this.togglePause(),
    });

    // Load initial layout for selected stage
    this.resetStageGrid();
  }

  get isRunning() {
    return this.loop ? this.loop.isRunning : false;
  }

  get isPaused() {
    return this.loop ? this.loop.isPaused : false;
  }

  get fps() {
    return this.loop ? this.loop.fps : 0;
  }

  /**
   * Start or begin gameplay from idle pre-start state
   */
  startGame() {
    this.isStarted = true;
    this.isGameOver = false;
    this.isVictory = false;
    if (this.loop && this.loop.isPaused) {
      this.loop.resume();
    }
    if (!this.isRunning) {
      this.loop.start();
    }
    if (!this.activeCapsule) {
      this.spawnCapsule();
    }
    soundEngine.ensureAudioContext();
    soundEngine.playMove();
    this.notifyStateChange();
  }

  /**
   * Generates a pair of Katakana entries for the next capsule
   */
  generateCapsulePair() {
    const entry1 = dictionary.getRandomEntry();
    const entry2 = dictionary.getRandomEntry();

    let displayType1;
    let displayType2;
    if (this.mode === GAME_MODES.MIXED) {
      displayType1 = Math.random() < 0.5 ? 'katakana' : 'hiragana';
      displayType2 = Math.random() < 0.5 ? 'katakana' : 'hiragana';
    } else if (this.mode === GAME_MODES.REVERSE) {
      displayType1 = 'hiragana';
      displayType2 = 'hiragana';
    } else {
      displayType1 = 'katakana';
      displayType2 = 'katakana';
    }

    const color1 = getRandomPillColor();
    const color2 = getRandomPillColor();

    return { entry1, entry2, displayType1, displayType2, color1, color2 };
  }

  /**
   * Spawns the queued next capsule at the entrance chute
   */
  spawnCapsule() {
    if (this.isGameOver) return;

    const spawnR = CAPSULE_SPAWN.ROW;
    const spawnC = CAPSULE_SPAWN.COL;

    // Check if spawn chute is obstructed (Top-Out)
    if (!this.grid.isEmpty(spawnR, spawnC) || !this.grid.isEmpty(spawnR, spawnC + 1)) {
      this.isGameOver = true;
      this.activeCapsule = null;
      soundEngine.playGameOver();
      this.updateHighScore();
      this.notifyStateChange();
      return;
    }

    const { entry1, entry2, displayType1, displayType2, color1, color2 } = this.nextCapsule;
    this.activeCapsule = new Capsule(
      entry1,
      entry2,
      spawnR,
      spawnC,
      displayType1,
      displayType2,
      color1,
      color2
    );
    this.nextCapsule = this.generateCapsulePair();
    this.fallTimer = 0;
    this.capsulesDropped++;

    this.renderNextPreview();
    this.notifyStateChange();
  }

  /**
   * Locks the active capsule into the grid matrix
   */
  lockActiveCapsule() {
    if (!this.activeCapsule) return;

    soundEngine.playLock();
    this.activeCapsule.lockIntoGrid(this.grid);
    this.activeCapsule = null;
    this.fallTimer = 0;
    this.comboCount = 0;

    this.evaluateMatches();
  }

  /**
   * Evaluates the grid for contiguous matches of 3 or more sounds
   */
  evaluateMatches() {
    const matches = MatchEngine.findMatches(this.grid);

    if (matches.matchedCells.length > 0) {
      this.processState = 'matching';
      this.processTimer = TIMINGS.MATCH_FLASH;
      this.currentMatches = matches;
      this.comboCount++;

      let matchedPairLabel = '';
      if (matches.lines && matches.lines.length > 0) {
        const firstEntry = dictionary.getById(matches.lines[0].entryId);
        if (firstEntry) {
          const hira = firstEntry.hiragana || firstEntry.romaji;
          matchedPairLabel = `${firstEntry.katakana} = ${hira}`;
        }
      }

      if (this.comboCount > 1) {
        this.comboBannerText = `${this.comboCount}x COMBO! ${matchedPairLabel}`;
      } else if (matches.matchedViruses.length > 0) {
        this.comboBannerText = `VIRUS CLEAR! ${matchedPairLabel}`;
      } else {
        this.comboBannerText = `MATCH 3! ${matchedPairLabel}`;
      }
      this.comboBannerAlpha = 1.0;

      if (matches.matchedViruses.length > 0) {
        soundEngine.playVirusClear();
      } else {
        soundEngine.playMatch(this.comboCount);
      }

      // Speak pronunciation
      if (matches.lines && matches.lines.length > 0) {
        matches.lines.forEach((line) => {
          const entry = dictionary.getById(line.entryId);
          if (entry) soundEngine.speak(entry.katakana);
        });
      }

      const virusBonus = matches.matchedViruses.length * 200;
      const cellBonus = matches.matchedCells.length * 50;
      this.score += (virusBonus + cellBonus) * this.comboCount;
      this.virusesCleared += matches.matchedViruses.length;
      this.updateHighScore();

      this.notifyStateChange();
    } else {
      this.checkEndConditions();
    }
  }

  resolveMatches() {
    if (!this.currentMatches) return;

    if (this.currentMatches.matchedCells) {
      this.currentMatches.matchedCells.forEach((coord) => {
        const cell = this.grid.get(coord.row, coord.col);
        const color = cell?.entry?.color || '#FDE047';
        this.renderer.spawnExplosion(coord.row, coord.col, color, 12);
      });
    }

    MatchEngine.clearMatchedCells(this.grid, this.currentMatches.matchedCells);
    this.currentMatches = null;

    this.processState = 'cascading';
    this.processTimer = TIMINGS.CASCADE_DELAY;

    this.notifyStateChange();
  }

  stepCascade() {
    const moved = MatchEngine.applyGravityStep(this.grid);
    if (moved) {
      this.processTimer = TIMINGS.CASCADE_STEP;
    } else {
      this.evaluateMatches();
    }
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('drKatakana_highScore', String(this.highScore));
      } catch {}
    }
    if (this.currentStage > this.topStage) {
      this.topStage = this.currentStage;
      try {
        localStorage.setItem('drKatakana_topStage', String(this.topStage));
      } catch {}
    }
  }

  checkEndConditions() {
    if (this.grid.getVirusCount() === 0) {
      this.isVictory = true;
      this.processState = 'game_over';
      soundEngine.playStageClear();
      this.updateHighScore();
      this.notifyStateChange();
      return;
    }

    this.processState = 'playing';
    this.spawnCapsule();
  }

  nextStage() {
    this.currentStage++;
    try {
      localStorage.setItem('drKatakana_selectedLevel', this.currentStage.toString());
    } catch {}
    this.score += this.currentStage * 1000;
    this.updateHighScore();

    this.isVictory = false;
    this.isGameOver = false;
    this.processState = 'playing';
    this.activeCapsule = null;
    this.comboCount = 0;
    this.comboBannerText = `LEVEL ${this.currentStage}!`;
    this.comboBannerAlpha = 1.0;

    this.grid.clear();
    const stageIdx = Math.min(this.currentStage - 1, STAGE_CONFIGS.length - 1);
    const config = STAGE_CONFIGS[stageIdx];
    this.grid.populateViruses(config.viruses, this.mode);

    this.spawnCapsule();
    this.renderNextPreview();
    this.notifyStateChange();
  }

  // Player input actions
  moveLeft() {
    if (!this.isStarted || !this.isRunning || this.isPaused || this.isGameOver || this.isVictory || this.processState !== 'playing' || !this.activeCapsule) return;
    if (this.activeCapsule.moveLeft(this.grid)) soundEngine.playMove();
  }

  moveRight() {
    if (!this.isStarted || !this.isRunning || this.isPaused || this.isGameOver || this.isVictory || this.processState !== 'playing' || !this.activeCapsule) return;
    if (this.activeCapsule.moveRight(this.grid)) soundEngine.playMove();
  }

  rotateCW() {
    if (!this.isStarted || !this.isRunning || this.isPaused || this.isGameOver || this.isVictory || this.processState !== 'playing' || !this.activeCapsule) return;
    if (this.activeCapsule.rotateCW(this.grid)) soundEngine.playRotate();
  }

  rotateCCW() {
    if (!this.isStarted || !this.isRunning || this.isPaused || this.isGameOver || this.isVictory || this.processState !== 'playing' || !this.activeCapsule) return;
    if (this.activeCapsule.rotateCCW(this.grid)) soundEngine.playRotate();
  }

  startSoftDrop() {
    if (this.isStarted && this.processState === 'playing') this.isSoftDropping = true;
  }

  stopSoftDrop() {
    this.isSoftDropping = false;
  }

  hardDrop() {
    if (!this.isStarted) {
      this.startGame();
      return;
    }
    if (!this.isRunning || this.isPaused || this.isGameOver || this.isVictory || this.processState !== 'playing' || !this.activeCapsule) return;
    this.activeCapsule.hardDrop(this.grid);
    soundEngine.playHardDrop();
    this.lockActiveCapsule();
  }

  toggleMode() {
    if (this.mode === GAME_MODES.MIXED) {
      this.mode = GAME_MODES.NORMAL;
    } else if (this.mode === GAME_MODES.NORMAL) {
      this.mode = GAME_MODES.REVERSE;
    } else {
      this.mode = GAME_MODES.MIXED;
    }
    this.nextCapsule = this.generateCapsulePair();
    this.renderNextPreview();
    this.notifyStateChange();
    return this.mode;
  }

  spawnRandomViruses(count = 6) {
    this.grid.populateViruses(count, this.mode);
    this.activeCapsule = null;
    this.isGameOver = false;
    if (this.isStarted) {
      this.spawnCapsule();
    }
    this.notifyStateChange();
  }

  setKatakanaSet(setKey) {
    const config = KATAKANA_SETS[setKey];
    if (config) {
      dictionary.setEntries(config.entries);
      this.nextCapsule = this.generateCapsulePair();
      this.renderNextPreview();
      this.notifyStateChange();
    }
  }

  setStage(stageNum) {
    const maxStages = STAGE_CONFIGS.length;
    const newStage = Math.max(1, Math.min(stageNum, maxStages));
    this.currentStage = newStage;
    try {
      localStorage.setItem('drKatakana_selectedLevel', this.currentStage.toString());
    } catch {}

    this.score = 0;
    this.virusesCleared = 0;
    this.capsulesDropped = 0;
    this.comboCount = 0;
    this.comboBannerText = `LEVEL ${this.currentStage}`;
    this.comboBannerAlpha = 1.0;
    this.isGameOver = false;
    this.isVictory = false;
    this.processState = 'playing';
    this.activeCapsule = null;
    this.resetStageGrid();
    this.nextCapsule = this.generateCapsulePair();
    this.renderNextPreview();
    if (this.isStarted && this.isRunning && !this.isPaused) {
      this.spawnCapsule();
    }
    this.notifyStateChange();
    return this.currentStage;
  }

  toggleStage(direction = 1) {
    const maxStages = STAGE_CONFIGS.length;
    let next = this.currentStage + direction;
    if (next > maxStages) next = 1;
    if (next < 1) next = maxStages;
    return this.setStage(next);
  }

  resetStageGrid() {
    this.grid.clear();
    const stageIdx = Math.min(this.currentStage - 1, STAGE_CONFIGS.length - 1);
    this.grid.populateViruses(STAGE_CONFIGS[stageIdx].viruses, this.mode);
    this.isGameOver = false;
    this.isVictory = false;
    this.processState = 'playing';
    this.currentMatches = null;
    this.comboCount = 0;
    this.activeCapsule = null;
    if (this.isStarted && this.isRunning && !this.isPaused) {
      this.spawnCapsule();
    }
  }

  setSelectedRows(rowIds, respawnViruses = false) {
    if (!rowIds || rowIds.length === 0) return;
    this.customSelectionDesc = null;
    this.selectedRowIds = [...rowIds];
    const entries = getEntriesForRows(this.selectedRowIds);
    if (entries.length > 0) {
      dictionary.setEntries(entries);
      this.nextCapsule = this.generateCapsulePair();
      this.renderNextPreview();
      if (respawnViruses) this.resetStageGrid();
      this.notifyStateChange();
    }
  }

  setCustomEntries(entries, customDesc = 'Random Mix', respawnViruses = false) {
    if (!entries || entries.length === 0) return;
    this.selectedRowIds = [];
    this.customSelectionDesc = customDesc;
    dictionary.setEntries(entries);
    this.nextCapsule = this.generateCapsulePair();
    this.renderNextPreview();
    if (respawnViruses) this.resetStageGrid();
    this.notifyStateChange();
  }

  getSelectedRowsDescription() {
    if (this.customSelectionDesc) return this.customSelectionDesc;
    if (!this.selectedRowIds || this.selectedRowIds.length === 0) return 'Custom Mix';
    if (this.selectedRowIds.includes('ALL')) return 'All 46 Katakana';

    const names = this.selectedRowIds.map(id => {
      const row = KATAKANA_ROWS.find(r => r.id === id);
      return row ? row.name : id;
    });
    return names.join(' + ');
  }

  loadDiagnosticScenario() {
    this.grid.loadDiagnosticScenario(this.mode);
    this.activeCapsule = null;
    this.isGameOver = false;
    if (this.isStarted) {
      this.spawnCapsule();
    }
    this.notifyStateChange();
  }

  clearGrid() {
    this.grid.clear();
    this.activeCapsule = null;
    this.isGameOver = false;
    if (this.isStarted) {
      this.spawnCapsule();
    }
    this.notifyStateChange();
  }

  restart() {
    this.stop();
    // Maintain this.currentStage across game over so the player stays at their chosen ability level
    this.score = 0;
    this.virusesCleared = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.capsulesDropped = 0;
    this.processState = 'playing';
    this.currentMatches = null;
    this.comboCount = 0;
    this.comboBannerText = '';
    this.comboBannerAlpha = 0;
    this.activeCapsule = null;
    this.resetStageGrid();
    this.nextCapsule = this.generateCapsulePair();
    this.renderNextPreview();
    this.isStarted = true;
    if (this.loop && this.loop.isPaused) {
      this.loop.resume();
    }
    this.start();
    this.spawnCapsule();
  }

  getStateSnapshot() {
    const stageIdx = Math.min(this.currentStage - 1, STAGE_CONFIGS.length - 1);
    const stageConfig = STAGE_CONFIGS[stageIdx] || { viruses: 4, title: `Level ${this.currentStage}` };
    return {
      isStarted: this.isStarted,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      isVictory: this.isVictory,
      mode: this.mode,
      themeName: 'Ink & Porcelain',
      stage: this.currentStage,
      maxStages: STAGE_CONFIGS.length,
      stageTitle: stageConfig.title || `Level ${this.currentStage}`,
      stageViruses: stageConfig.viruses,
      score: this.score,
      highScore: this.highScore,
      topStage: this.topStage,
      virusesCleared: this.virusesCleared,
      virusCount: this.grid.getVirusCount(),
      totalOccupied: this.grid.getTotalOccupiedCount(),
      capsulesDropped: this.capsulesDropped,
      processState: this.processState,
      comboCount: this.comboCount,
      selectedRowIds: this.selectedRowIds,
      selectedRowsDesc: this.getSelectedRowsDescription(),
      activeCapsule: this.activeCapsule ? {
        part1: { ...this.activeCapsule.part1 },
        part2: { ...this.activeCapsule.part2 },
        orientation: this.activeCapsule.orientation,
      } : null,
      nextCapsule: this.nextCapsule,
    };
  }

  notifyStateChange() {
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.getStateSnapshot());
    }
  }

  start() {
    this.loop.start();
    if (this.isStarted && !this.activeCapsule) this.spawnCapsule();
    this.notifyStateChange();
  }

  stop() {
    this.loop.stop();
    this.notifyStateChange();
  }

  togglePause() {
    if (!this.isStarted) return;
    this.loop.togglePause();
    this.notifyStateChange();
  }

  update(dt) {
    if (!this.isStarted || this.isGameOver || this.isVictory || this.isPaused || !this.isRunning) return;

    if (this.comboBannerAlpha > 0) {
      this.comboBannerAlpha -= dt / 1500;
      if (this.comboBannerAlpha < 0) this.comboBannerAlpha = 0;
    }

    this.renderer.updateParticles(dt);

    if (this.processState === 'matching') {
      this.processTimer -= dt;
      if (this.processTimer <= 0) this.resolveMatches();
      return;
    }

    if (this.processState === 'cascading') {
      this.processTimer -= dt;
      if (this.processTimer <= 0) this.stepCascade();
      return;
    }

    if (this.processState === 'playing') {
      if (!this.activeCapsule) {
        this.spawnCapsule();
        return;
      }

      const stageIdx = Math.min(this.currentStage - 1, STAGE_CONFIGS.length - 1);
      const stageFallSpeed = STAGE_CONFIGS[stageIdx]?.fallInterval || FALL_SPEEDS.NORMAL;
      const currentInterval = this.isSoftDropping ? FALL_SPEEDS.SOFT_DROP : stageFallSpeed;

      this.fallTimer += dt;
      if (this.fallTimer >= currentInterval) {
        this.fallTimer = 0;
        this.activeCapsule.moveDown(this.grid);
      }

      if (this.activeCapsule && this.activeCapsule.isGrounded) {
        this.activeCapsule.lockTimer += dt;
        if (this.activeCapsule.lockTimer >= FALL_SPEEDS.LOCK_DELAY) {
          this.lockActiveCapsule();
        }
      }
    }
  }

  renderNextPreview() {
    if (this.previewCanvas && this.nextCapsule) {
      this.renderer.drawNextPreview(this.previewCanvas, this.nextCapsule, this.mode);
    }
  }

  render(currentTimestamp) {
    this.renderer.clear();
    this.renderer.drawGrid();

    const matchingCoords = (this.processState === 'matching' && this.currentMatches)
      ? this.currentMatches.matchedCells
      : null;
    this.renderer.renderGrid(this.grid, this.mode, currentTimestamp, matchingCoords);

    if (this.activeCapsule && !this.isGameOver && !this.isVictory && this.processState === 'playing') {
      this.renderer.drawGhostCapsule(this.activeCapsule, this.grid, this.mode);
      this.renderer.drawActiveCapsule(this.activeCapsule, this.mode);
    }

    if (this.comboBannerAlpha > 0 && this.comboBannerText) {
      this.renderer.drawComboBanner(this.comboBannerText, this.comboBannerAlpha);
    }

    this.renderer.drawParticles();

    if (this.isVictory) {
      this.renderer.drawEndGameOverlay(true, this.currentStage, this.score, this.highScore);
    } else if (this.isGameOver) {
      this.renderer.drawEndGameOverlay(false, this.currentStage, this.score, this.highScore);
    } else if (this.isPaused) {
      this.renderer.drawPauseOverlay();
    } else if (!this.isStarted) {
      this.renderer.drawStartPrompt();
    }
  }

  destroy() {
    this.stop();
    if (this.input) this.input.detachListeners();
  }
}
