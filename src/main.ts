// src/main.ts

import p5 from 'p5';

import { SceneManager } from './core/SceneManager';
import { DEFAULT_SCENE_LIBRARY } from './core/SceneLibrary';
import { APCMiniMK2Manager } from './midi/APCMiniMK2Manager';
import { KeyboardController } from './input/KeyboardController';
import { BPMManager } from './rhythm/BPMManager';
import { MicrophoneMonitor } from './audio/MicrophoneMonitor';

const midiManager = new APCMiniMK2Manager();
const sceneManager = new SceneManager(midiManager, DEFAULT_SCENE_LIBRARY);
const bpmManager = new BPMManager();
const microphoneMonitor = new MicrophoneMonitor();
new KeyboardController(sceneManager, midiManager, bpmManager, microphoneMonitor);

const sketch = (p: p5) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noCursor();
    sceneManager.setup(p);
    microphoneMonitor.start().catch((error) => {
      console.warn('Microphone capture failed:', error);
    });
  };

  p.draw = () => {
    const deltaSeconds = p.deltaTime / 1000;
    bpmManager.update();
    microphoneMonitor.update();
    const audioLevel = microphoneMonitor.getLevel();
    const audioDebug = microphoneMonitor.isDebugMode();
    const audioSpectrum = microphoneMonitor.getSpectrum();
    sceneManager.update(p, deltaSeconds, audioLevel, audioDebug, audioSpectrum);
    sceneManager.composite(p);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    sceneManager.resize(p);
  };
};

new p5(sketch);