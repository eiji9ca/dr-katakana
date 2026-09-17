# Dr. Katakana (ドクター・カタカナ)

> **A distraction-free falling-capsule Japanese Katakana literacy puzzle game built with HTML5 Canvas.**

🎮 **Play Live:** [https://dr-katakana-game.web.app](https://dr-katakana-game.web.app)  
🔥 **Secondary Domain:** [https://dr-katakana-game.firebaseapp.com](https://dr-katakana-game.firebaseapp.com)

---

## 🌟 Features

- **"Ink & Porcelain" Monochrome Aesthetics**: High-contrast dark mode eliminating color-matching shortcuts (Stroop effect) so players directly learn Katakana character radicals and glyphs.
- **Interactive Level Selection & Persistence**: Choose from Levels 1 through 5 (4 to 12 viruses) with difficulty speed scaling. Selected level persists even after game over and browser reloads.
- **Three Play Modes**:
  - **Mixed Mode**: Falling capsules and viruses feature both Romaji syllables and Katakana characters.
  - **Normal Mode**: Viruses are Romaji; capsules are Katakana.
  - **Reverse Mode**: Viruses are Katakana; capsules are Romaji.
- **Customizable Kana Curriculum**: Choose individual Gojūon rows (A, K, S, T, N, H, M, Y, R, W) or roll random 3–5 character practice subsets.
- **Audio Synthesis**:
  - Procedural Web Audio 8-bit sound effects (rotations, drops, matches, game over).
  - 8-bar retro chiptune background music sequencer.
  - Web Speech API Japanese native speech pronunciation upon clearing viruses.
- **Touch & Mobile Controls**: Built-in on-screen tactile D-pad for mobile and tablet play.

---

## ⌨️ Controls

| Action | Keyboard | On-Screen Gamepad |
| :--- | :--- | :--- |
| **Move Left** | `A` | `← A` |
| **Move Right** | `D` | `D →` |
| **Soft Drop** | `S` | `↓ S` |
| **Rotate CCW** | `Q` | `↶ Q` |
| **Rotate CW** | `E` | `↷ E` |
| **Hard Drop** | `SPACE` | `⤓ SPACE` |
| **Select Level** | `1` - `5` / `[` `]` | `←` / `→` HUD buttons |
| **Toggle Mode** | `M` | `Mode` HUD button |
| **Pause / Resume** | `P` | `Pause` button |
| **Restart Game** | `R` | `Restart` button |

*(Strict arcade rule: Arrow keys are disabled to reinforce deliberate finger positioning).*

---

## 🏗️ Architecture & Technology Stack

- **Core**: Vanilla HTML5 Canvas (`288x576`), Vanilla CSS, pure ES Modules.
- **Decoupled Architecture**:
  - `js/engine/GameLoop.js`: rAF timing loop with delta clamping and real-time FPS monitoring.
  - `js/MatchEngine.js`: Match-3 line detection and cascade gravity resolution.
  - `js/Grid.js`: Headless 2D bottle cell matrix.
  - `js/Capsule.js`: Headless capsule physics, rotation offsets, and wall kicks.
  - `js/rendering/`: Dedicated sub-renderers for capsules, living viruses, and ghost previews.
  - `js/ui/`: Dirty-checked HUD controllers eliminating DOM thrashing.
  - `js/audio/`: Synthesizer, chiptune sequencer, and Japanese speech engine.
  - `data/`: Dedicated JSON datasets for 46 Katakana characters, decks, stages, and audio note frequencies.
- **Hosting**: Deployed on **Google Firebase Hosting** global edge CDN.

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build

# Preview production bundle
npm run preview
```
