import { SceneManager } from '../core/SceneManager';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';

const NUMERIC_KEY_TO_COLUMN: Record<string, number> = {
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 6,
  '8': 7,
};

const CYCLE_KEY_TO_COLUMN: Record<string, number> = {
  q: 0,
  w: 1,
  e: 2,
  r: 3,
  t: 4,
  y: 5,
  u: 6,
  i: 7,
};

const TOGGLE_KEY_TO_INDEX: Record<string, number> = {
  z: 0,
  x: 1,
  c: 2,
  v: 3,
  b: 4,
  n: 5,
  m: 6,
};

export class KeyboardController {
  private readonly handleKeyDownRef: (event: KeyboardEvent) => void;
  private readonly sceneManager: SceneManager;
  private readonly midiManager: APCMiniMK2Manager;
  private readonly bpmManager: BPMManager;

  constructor(sceneManager: SceneManager, midiManager: APCMiniMK2Manager, bpmManager: BPMManager) {
    this.sceneManager = sceneManager;
    this.midiManager = midiManager;
    this.bpmManager = bpmManager;
    this.handleKeyDownRef = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.handleKeyDownRef);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();

    if (key === 'p') {
      this.sceneManager.toggleDebugOverlay();
      event.preventDefault();
      return;
    }

    if (key in TOGGLE_KEY_TO_INDEX) {
      const toggleIndex = TOGGLE_KEY_TO_INDEX[key];
      this.sceneManager.toggleParameter(toggleIndex);
      event.preventDefault();
      return;
    }

    if (key === ' ') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen().catch(() => undefined);
      }
      event.preventDefault();
      return;
    }

    if (key === 'enter') {
      this.bpmManager.tapTempo();
      event.preventDefault();
      return;
    }

    if (key === 'shift') {
      this.bpmManager.start();
      this.sceneManager.resetBeat();
      event.preventDefault();
      return;
    }

    if (this.midiManager.isMidiConnected()) {
      return;
    }

    if (key === '0') {
      this.sceneManager.handleKeyboardSelection(null);
      event.preventDefault();
      return;
    }

    if (key in CYCLE_KEY_TO_COLUMN) {
      const columnIndex = CYCLE_KEY_TO_COLUMN[key];
      this.sceneManager.cycleKeyboardSelection(columnIndex);
      event.preventDefault();
      return;
    }

    if (key in NUMERIC_KEY_TO_COLUMN) {
      const columnIndex = NUMERIC_KEY_TO_COLUMN[key];
      this.sceneManager.handleKeyboardSelection(columnIndex);
      event.preventDefault();
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDownRef);
  }
}
