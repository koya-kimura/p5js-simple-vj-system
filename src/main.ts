import p5 from 'p5';

import { SceneManager } from './core/SceneManager';
import { DEFAULT_SCENE_LIBRARY } from './core/SceneLibrary';
import { APCMiniMK2Manager } from './midi/APCMiniMK2Manager';
import { KeyboardController } from './input/KeyboardController';
import { BPMManager } from './rhythm/BPMManager';
import { MicrophoneMonitor } from './audio/MicrophoneMonitor';

// アプリケーション全体の初期化をまとめるエントリーポイント。
const midiManager = new APCMiniMK2Manager();
// シーンの割り当てと合成を制御するコアマネージャ。
const sceneManager = new SceneManager(midiManager, DEFAULT_SCENE_LIBRARY);
// 拍情報を更新しつづけるBPMマネージャ。
const bpmManager = new BPMManager();
// 音声入力の正規化・スペクトラム解析を担当する監視クラス。
const microphoneMonitor = new MicrophoneMonitor();
// MIDI非接続時の操作フォールバックやデバッグ操作を提供。
new KeyboardController(sceneManager, midiManager, bpmManager, microphoneMonitor);

// p5のスケッチ定義。p5本体に渡してライフサイクルを構成する。
const sketch = (p: p5) => {
  p.setup = () => {
    // 初期描画設定とシーン初期化、マイク入力の開始をまとめて行う。
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noCursor();
    sceneManager.setup(p);
    microphoneMonitor.start().catch((error) => {
      console.warn('Microphone capture failed:', error);
    });
  };

  p.draw = () => {
    // 各種マネージャを更新し、その状態を基にシーンを描画する。
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
    // ウィンドウサイズ変更時にバッファーも再生成する。
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    sceneManager.resize(p);
  };
};

new p5(sketch);