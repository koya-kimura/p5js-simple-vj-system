import p5 from 'p5';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import type { IScene, SceneDrawContext } from '../../core/IScene';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';
import { Easing } from '../../utils/easing';

/**
 * SpectrumShuffleBarScene
 * ----------------------
 * シンプルなサンプル実装です。任意のロジックに置き換えて使ってください。
 */
export class SpectrumShuffleBarScene implements IScene {
  public readonly name = 'Spectrum · Shuffle Bar';
  // トグルに応じて時間変化を与えるための内部フェーズ値。
  private phase = 0;
  private indexArray = [];

  // 列に割り当てられたタイミングで呼び出される初期化。状態をリセットするだけでOK。
  public setup(_p: p5, _buffer: p5.Graphics, _columnIndex: number): void {
    this.phase = 0;
  }

  // トグル値とオーディオ情報を参照しながらバッファーへ描画するメイン処理。
  public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();

    // インデックスをシャッフルに
    p.push();
    p.randomSeed(3190);
    let indexArray = [];
    for (let i = 0; i < context.audioSpectrum.length; i++) {
      indexArray.push(i);
    }
    indexArray = p.shuffle(indexArray);
    p.pop();

    // 四角形を並べる
    p.push();
    p.randomSeed(p.floor((context.elapsedSeconds + 1) * 0.5));
    for(let i = 0; i < context.audioSpectrum.length; i ++){
      const x = buffer.width * p.map(i, 0, context.audioSpectrum.length-1, 0.1, 0.9);
      const y = buffer.height * 0.5;
      const w = buffer.width * 0.8 / context.audioSpectrum.length * 0.8 * p.map(p.pow(context.audioSpectrum[indexArray[i]], 10), 0, 1, 1, 3);
      const h = buffer.height * p.map(p.pow(context.audioSpectrum[indexArray[i]], 2), 0, 1, 0.2, 1.5) * p.map(Easing.easeOutQuad(p.abs(context.elapsedSeconds % 2 - 1)), 0, 1, 1, 1.5);
      const angle = p.map(Easing.easeOutQuad(p.abs(context.elapsedSeconds % 2 - 1)), 0, 1, 0, p.random(-p.PI/2, p.PI/2));
      const c = p.pow(context.audioSpectrum[indexArray[i]], 2) > 0.9 ? "cyan" : "white";

      buffer.push();
      buffer.noStroke();
      buffer.fill(c);
      buffer.rectMode(p.CENTER);
      buffer.translate(x, y);
      buffer.rotate(angle);
      buffer.rect(0, 0, w, h);
      buffer.pop();
    }
    p.pop();

    buffer.pop();
  }
}
