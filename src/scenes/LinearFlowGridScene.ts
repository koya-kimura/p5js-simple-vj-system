// src/scenes/LinearFlowGridScene.ts

import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../core/IScene';

export class LinearFlowGridScene implements IScene {
  public readonly name = 'Linear Flow Grid';


  setup(_p: p5, _buffer: p5.Graphics, _columnIndex: number): void {
    // no persistent state required for simplified grid scene
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    // Simple pulsing grid of rectangles (fully independent visual)
    buffer.push();
    buffer.noStroke();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);
    const cols = 8;
    const rows = 6;
    const cellW = buffer.width / cols;
    const cellH = buffer.height / rows;
    const t = context.elapsedSeconds;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ix = r * cols + c;
        const phase = (ix * 0.3 + context.columnIndex * 0.5) % 10;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2 + phase);

        const hue = (context.columnIndex * 40 + ix * 6) % 360;
        buffer.colorMode(p.HSB, 360, 100, 100, 1);
        buffer.fill(hue, 70, 80, 0.9 * pulse);
        const x = c * cellW + cellW * 0.08;
        const y = r * cellH + cellH * 0.08;
        const w = cellW * 0.84 * (0.6 + 0.4 * pulse);
        const h = cellH * 0.84 * (0.6 + 0.4 * pulse);
        buffer.rect(x + (cellW - w) / 2, y + (cellH - h) / 2, w, h, 6);
      }
    }

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
