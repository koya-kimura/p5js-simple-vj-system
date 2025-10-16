import p5 from 'p5';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import type { IScene, SceneDrawContext } from '../../core/IScene';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

/**
 * WaterUpBubbleScene
 * ----------------------
 * シンプルなサンプル実装です。任意のロジックに置き換えて使ってください。
 */
export class WaterUpBubbleScene implements IScene {
  public readonly name = 'Water · Up Bubble';
  // トグルに応じて時間変化を与えるための内部フェーズ値。
  private phase = 0;

  // 列に割り当てられたタイミングで呼び出される初期化。状態をリセットするだけでOK。
  public setup(_p: p5, _buffer: p5.Graphics, _columnIndex: number): void {
    this.phase = 0;
  }

  // トグル値とオーディオ情報を参照しながらバッファーへ描画するメイン処理。
  public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    p.push();
    buffer.clear();
    buffer.push();
    p.randomSeed(12345);
    
    for(let i = 0; i < 100; i ++){
      const sx = p.random(p.width);
      const sy = p.random(p.height);

      const x = sx + p.sin(p.random(p.TAU) + p.frameCount * p.random(0.01, 0.02)) * p.min(p.width, p.height) * p.random(0.01, 0.03);
      const y = p.map((sy + p.frameCount * p.random(2, 4)) % (p.height * 1.5), 0, p.height * 1.5, p.height * 1.25, -p.height * 0.25);
      const s = p.min(p.width, p.height) * p.map(p.sin(p.random(p.TAU) + p.frameCount * p.random(0.01, 0.02)), -1, 1, 0.05, 0.2) * p.random(0.5, 1);

      buffer.noStroke();
      buffer.fill(255, 200);
      buffer.circle(x, y, s);
    }

    buffer.pop();
    p.pop();
  }
}
