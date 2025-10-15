import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleValue } from '../../utils/toggleUtils';

type Cell = {
  x: number;
  y: number;
  size: number;
  phase: number;
};

export class BioCellMeshScene implements IScene {
  public readonly name = 'Bio · Cell Mesh';
  private cells: Cell[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 6;
    const rows = 6;
    const cellW = buffer.width / cols;
    const cellH = buffer.height / rows;
    this.cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jitterX = p.random(-cellW * 0.15, cellW * 0.15);
        const jitterY = p.random(-cellH * 0.15, cellH * 0.15);
        this.cells.push({
          x: (c + 0.5) * cellW + jitterX,
          y: (r + 0.5) * cellH + jitterY,
          size: Math.min(cellW, cellH) * p.random(0.65, 0.9),
          phase: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.noStroke();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    const columnInfluence = contextToggleAverage(context, 0, 3);
    const membraneInfluence = contextToggleAverage(context, 3, 4);

    this.cells.forEach((cell, index) => {
      const anim = 0.5 + 0.5 * Math.sin(context.elapsedSeconds * 1.5 + cell.phase);
      const activation = contextToggleValue(context, index % 7);
      const hue = (90 + activation * 200 + columnInfluence * 120) % 360;
      buffer.fill(hue, 60 + membraneInfluence * 30, 70 + anim * 20, 0.85);
      const sizePulse = cell.size * (0.8 + 0.25 * anim + activation * 0.15);
      buffer.ellipse(cell.x, cell.y, sizePulse, sizePulse);
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
