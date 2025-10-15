import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../src/core/IScene';

/**
 * __CLASS_NAME__
 * ----------------------
 * シンプルなサンプルシーン。必要に応じてパラメーターや描画ロジックを拡張してください。
 */
export class __CLASS_NAME__ implements IScene {
  public name: string = '__DISPLAY_NAME__';

  public setup(p: p5, buffer: p5.Graphics, columnIndex: number): void {
    // 初期化処理をここに記述します。
  }

  public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.rectMode(p.CENTER);

    const circleCount = 5; // 固定値の例（必要に応じて変更）
    const baseSize = buffer.height * 0.1;
    const toggleInfluence = context.toggles.length > 0
      ? context.toggles.reduce((sum, value) => sum + value, 0) / context.toggles.length
      : 0;

    buffer.noStroke();
    buffer.fill(200, 100, 100 + toggleInfluence * 50);

    for (let i = 0; i < circleCount; i++) {
      const angle = (p.TWO_PI / circleCount) * i + context.elapsedSeconds * (1 + toggleInfluence * 0.5);
      const x = Math.cos(angle) * buffer.width * 0.3;
      const y = Math.sin(angle) * buffer.height * 0.3;
      const sizeMod = 1 + toggleInfluence * 0.6;
      buffer.ellipse(x, y, baseSize * sizeMod, baseSize * sizeMod);
    }

    buffer.pop();
  }

  public resize(_p: p5): void {
    // 必要に応じてリサイズ処理を実装してください。
  }

  public destroy(): void {
    // 後処理が必要な場合はここに記述します。
  }
}
