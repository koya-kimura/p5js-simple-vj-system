import p5 from 'p5';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import type { IScene, SceneDrawContext } from '__CORE_IMPORT__';
// @ts-ignore: 生成時に適切な相対パスへと置換される
import { contextToggleEnergy, contextToggleValue } from '__UTILS_IMPORT__';

/**
 * __CLASS_NAME__
 * ----------------------
 * シンプルなサンプル実装です。任意のロジックに置き換えて使ってください。
 */
export class __CLASS_NAME__ implements IScene {
  public readonly name = '__DISPLAY_NAME__';
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

    const energy = contextToggleEnergy(context);
    const leadToggle = contextToggleValue(context, 'Z', 0, 'smooth');
    this.phase += context.deltaSeconds * (0.5 + energy * 0.8 + leadToggle * 0.5);

    const ringCount = 6;
    const baseRadius = buffer.height * 0.12;

    buffer.noFill();
    buffer.strokeWeight(4);

    for (let index = 0; index < ringCount; index++) {
      const toggle = contextToggleValue(context, index);
      const radius = baseRadius * (1 + index * 0.6 + toggle * 0.8 + energy * 0.4 + leadToggle * 0.3);
      const hue = (context.columnIndex * 35 + index * 25 + toggle * 70) % 360;
      const alpha = Math.max(0.2, 0.65 - index * 0.08 + energy * 0.1);
      buffer.stroke(`hsla(${hue}, 70%, 60%, ${alpha})`);
      const wobble = p.sin(this.phase + index * 0.7) * radius * 0.1;
      buffer.ellipse(0, wobble, radius * 2, radius * 2);
    }

    buffer.pop();
  }
}
