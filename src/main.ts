// src/main.ts

import p5 from 'p5';

import { SceneManager } from './core/SceneManager';
import { DEFAULT_SCENE_LIBRARY } from './core/SceneLibrary';
import { APCMiniMK2Manager } from './midi/APCMiniMK2Manager';
import { KeyboardController } from './input/KeyboardController';
import { BPMManager } from './rhythm/BPMManager';

const midiManager = new APCMiniMK2Manager();
const sceneManager = new SceneManager(midiManager, DEFAULT_SCENE_LIBRARY);
const bpmManager = new BPMManager();
const keyboardController = new KeyboardController(sceneManager, midiManager, bpmManager);

const sketch = (p: p5) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noCursor();
    sceneManager.setup(p);
  };

  p.draw = () => {
    const deltaSeconds = p.deltaTime / 1000;
    sceneManager.update(p, deltaSeconds);
    sceneManager.composite(p);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    sceneManager.resize(p);
  };
};

new p5(sketch);