import p5 from 'p5';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import type { IScene, SceneDrawContext } from '../../core/IScene';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

/**
 * WaveCircleScene
 * ----------------------
 * シンプルなサンプル実装です。任意のロジックに置き換えて使ってください。
 */
export class WaveCircleScene implements IScene {
  public readonly name = 'Wave · Circle';
  // トグルに応じて時間変化を与えるための内部フェーズ値。
  private phase = 0;

  // 列に割り当てられたタイミングで呼び出される初期化。状態をリセットするだけでOK。
  public setup(_p: p5, _buffer: p5.Graphics, _columnIndex: number): void {
    this.phase = 0;
  }

  // トグル値とオーディオ情報を参照しながらバッファーへ描画するメイン処理。
  public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.colorMode(p.HSB, 360, 100, 100, 255);

    buffer.blendMode(p.ADD);
    const cols = 40;
    const rows = 23;

    for (let i = 0; i < cols; i ++){
      for (let j = 0; j < rows; j++) {
        const x = buffer.width * i / cols + buffer.width / cols / 2;
        const y = buffer.height * j / rows + buffer.height / rows / 2 + p.sin(p.frameCount * 0.001 + i * 0.3 + p.noise(j*63719) * p.TAU * 10) * p.min(buffer.width / cols, buffer.height / rows) * 3;
        const d = p.map(p.sin(p.frameCount * 0.02 * p.noise(j * 78412) + i * 0.1 + p.noise(j*41890)*p.TAU), -1, 1, 0.2, 10) * p.min(buffer.width / cols, buffer.height / rows);
        const h = p.noise(p.frameCount * 0.01, i*0.1, j*0.01) * 360;
        const a = p.map(p.pow(p.noise(p.frameCount * 0.002, i*0.05, j), 3), 0, 1, -200, 450);

        buffer.push();
        buffer.fill(h, 100, 100, a*0.001);
        buffer.stroke(h, 100, 100, a);
        buffer.circle(x, y, d);
        buffer.pop();
      }
    }

    buffer.pop();
  }
}
