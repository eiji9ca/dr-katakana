/**
 * Dr. Katakana - Input Handler
 * Milestone 3: A/D/S/Q/E/SPACE keyboard controls with DAS (Delayed Auto Shift) and touch/button bindings
 * Strict Spec: A (Left), D (Right), S (Soft Drop), Q (Rotate CCW), E (Rotate CW), SPACE (Hard drop). No arrow keys.
 */

export class InputHandler {
  /**
   * @param {Object} callbacks
   * @param {Function} callbacks.onMoveLeft
   * @param {Function} callbacks.onMoveRight
   * @param {Function} callbacks.onSoftDropStart
   * @param {Function} callbacks.onSoftDropEnd
   * @param {Function} callbacks.onRotateCW
   * @param {Function} callbacks.onRotateCCW
   * @param {Function} callbacks.onHardDrop
   * @param {Function} callbacks.onTogglePause
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;

    // Active key states
    this.keys = {
      KeyA: false,
      KeyD: false,
      KeyS: false,
    };

    // Auto-repeat timers for horizontal movement (DAS: Delayed Auto Shift)
    this.dasDelay = 180;  // Initial delay before repeating
    this.dasInterval = 50; // Repeat interval
    this.moveTimer = null;
    this.activeHorizontalKey = null;

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    this.attachListeners();
  }

  attachListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  detachListeners() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.stopAutoRepeat();
  }

  /**
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    // Ignore input if user is typing in an input element or modal
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const code = e.code;
    const key = e.key.toLowerCase();

    // Prevent arrow keys explicitly per spec rule: "No arrow keys."
    if (code.startsWith('Arrow')) {
      e.preventDefault();
      return;
    }

    // A: Move Left
    if (code === 'KeyA' || key === 'a') {
      e.preventDefault();
      if (!this.keys.KeyA) {
        this.keys.KeyA = true;
        if (this.callbacks.onMoveLeft) this.callbacks.onMoveLeft();
        this.startAutoRepeat('KeyA', this.callbacks.onMoveLeft);
      }
      return;
    }

    // D: Move Right
    if (code === 'KeyD' || key === 'd') {
      e.preventDefault();
      if (!this.keys.KeyD) {
        this.keys.KeyD = true;
        if (this.callbacks.onMoveRight) this.callbacks.onMoveRight();
        this.startAutoRepeat('KeyD', this.callbacks.onMoveRight);
      }
      return;
    }

    // S: Soft Drop (Fast fall while held)
    if (code === 'KeyS' || key === 's') {
      e.preventDefault();
      if (!this.keys.KeyS) {
        this.keys.KeyS = true;
        if (this.callbacks.onSoftDropStart) this.callbacks.onSoftDropStart();
      }
      return;
    }

    // Q: Rotate Counter-Clockwise (CCW)
    if (code === 'KeyQ' || key === 'q') {
      e.preventDefault();
      if (this.callbacks.onRotateCCW) this.callbacks.onRotateCCW();
      return;
    }

    // E: Rotate Clockwise (CW)
    if (code === 'KeyE' || key === 'e') {
      e.preventDefault();
      if (this.callbacks.onRotateCW) this.callbacks.onRotateCW();
      return;
    }

    // SPACE: Hard Drop
    if (code === 'Space' || key === ' ') {
      e.preventDefault();
      if (this.callbacks.onHardDrop) this.callbacks.onHardDrop();
      return;
    }

    // R: Quick Restart
    if (code === 'KeyR' || key === 'r') {
      e.preventDefault();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
      return;
    }

    // P: Pause toggle
    if (code === 'KeyP' || key === 'p') {
      e.preventDefault();
      if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
      return;
    }
  }

  /**
   * @param {KeyboardEvent} e
   */
  handleKeyUp(e) {
    const code = e.code;
    const key = e.key.toLowerCase();

    if (code === 'KeyA' || key === 'a') {
      this.keys.KeyA = false;
      if (this.activeHorizontalKey === 'KeyA') {
        this.stopAutoRepeat();
        // If D is still held, switch repeat to D
        if (this.keys.KeyD) {
          this.startAutoRepeat('KeyD', this.callbacks.onMoveRight);
        }
      }
    }

    if (code === 'KeyD' || key === 'd') {
      this.keys.KeyD = false;
      if (this.activeHorizontalKey === 'KeyD') {
        this.stopAutoRepeat();
        // If A is still held, switch repeat to A
        if (this.keys.KeyA) {
          this.startAutoRepeat('KeyA', this.callbacks.onMoveLeft);
        }
      }
    }

    if (code === 'KeyS' || key === 's') {
      this.keys.KeyS = false;
      if (this.callbacks.onSoftDropEnd) this.callbacks.onSoftDropEnd();
    }
  }

  /**
   * Starts DAS auto-repeat for horizontal movement
   * @param {string} key
   * @param {Function} action
   */
  startAutoRepeat(key, action) {
    this.stopAutoRepeat();
    this.activeHorizontalKey = key;

    this.moveTimer = setTimeout(() => {
      this.moveTimer = setInterval(() => {
        if (action) action();
      }, this.dasInterval);
    }, this.dasDelay);
  }

  stopAutoRepeat() {
    if (this.moveTimer) {
      clearTimeout(this.moveTimer);
      clearInterval(this.moveTimer);
      this.moveTimer = null;
    }
    this.activeHorizontalKey = null;
  }
}
