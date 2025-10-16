import p5 from 'p5';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import type { IScene, SceneDrawContext } from '../../core/IScene';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

/**
 * SampleCircleScene
 * ----------------------
 * シンプルなサンプル実装です。任意のロジックに置き換えて使ってください。
 */
export class SampleCircleScene implements IScene {
  public readonly name = 'Sample · Circle';
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
    buffer.translate(buffer.width / 2, buffer.height / 2);

    const radius = p.min(buffer.width, buffer.height) * p.map(context.audioLevel, 0, 1, 0.1, 0.4);

    buffer.noFill();
    buffer.strokeWeight(p.min(buffer.width, buffer.height) * 0.02);
    buffer.stroke(0, 200, 0);
    buffer.circle(0, 0, radius*2);

    buffer.pop();
  }
}
