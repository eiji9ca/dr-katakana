/**
 * Dr. Katakana - On-Screen Touch & Pad Controls View
 * Binds touch and mouse events for on-screen directional and rotation buttons.
 */

export class TouchControlsView {
  /**
   * @param {Object} callbacks
   * @param {() => void} callbacks.onMoveLeft
   * @param {() => void} callbacks.onMoveRight
   * @param {() => void} callbacks.onRotateCCW
   * @param {() => void} callbacks.onRotateCW
   * @param {() => void} callbacks.onHardDrop
   * @param {() => void} callbacks.onSoftDropStart
   * @param {() => void} callbacks.onSoftDropEnd
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.attach();
  }

  attach() {
    const leftBtn = document.getElementById('ctrl-left');
    const rightBtn = document.getElementById('ctrl-right');
    const rotCcwBtn = document.getElementById('ctrl-rot-ccw');
    const rotCwBtn = document.getElementById('ctrl-rot-cw');
    const hardDropBtn = document.getElementById('ctrl-hard-drop');
    const softDropBtn = document.getElementById('ctrl-soft-drop');

    if (leftBtn) {
      leftBtn.addEventListener('click', () => this.callbacks.onMoveLeft?.());
    }
    if (rightBtn) {
      rightBtn.addEventListener('click', () => this.callbacks.onMoveRight?.());
    }
    if (rotCcwBtn) {
      rotCcwBtn.addEventListener('click', () => this.callbacks.onRotateCCW?.());
    }
    if (rotCwBtn) {
      rotCwBtn.addEventListener('click', () => this.callbacks.onRotateCW?.());
    }
    if (hardDropBtn) {
      hardDropBtn.addEventListener('click', () => this.callbacks.onHardDrop?.());
    }

    if (softDropBtn) {
      const start = (e) => {
        e.preventDefault();
        this.callbacks.onSoftDropStart?.();
      };
      const end = (e) => {
        e.preventDefault();
        this.callbacks.onSoftDropEnd?.();
      };

      softDropBtn.addEventListener('mousedown', start);
      softDropBtn.addEventListener('mouseup', end);
      softDropBtn.addEventListener('mouseleave', end);
      softDropBtn.addEventListener('touchstart', start, { passive: false });
      softDropBtn.addEventListener('touchend', end, { passive: false });
    }
  }
}
