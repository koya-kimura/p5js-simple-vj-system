import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleValue } from '../../utils/toggleUtils';

type GridCell = {
  x: number;
  y: number;
  size: number;
  phase: number;
};

export class ShapeRecursiveGridScene implements IScene {
  public readonly name = 'Shape · Recursive Grid';
  private cells: GridCell[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 8;
    const rows = 5;
    const cellW = buffer.width / cols;
    const cellH = buffer.height / rows;
    this.cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.cells.push({
          x: c * cellW + cellW / 2,
          y: r * cellH + cellH / 2,
          size: Math.min(cellW, cellH) * p.random(0.5, 0.9),
          phase: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.rectMode(p.CENTER);
    buffer.noFill();
    buffer.strokeWeight(1.2);

    const layers = 2 + Math.floor(contextToggleAverage(context, 0, 7) * 4);

    this.cells.forEach((cell, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const baseRotation = Math.sin(context.elapsedSeconds * 0.8 + cell.phase + toggle) * 0.6;
      for (let layer = 0; layer < layers; layer++) {
        const scale = 1 - layer * 0.22;
        if (scale <= 0) {
          break;
        }
        const hue = (context.columnIndex * 40 + layer * 25 + toggle * 90) % 360;
        buffer.stroke(`hsla(${hue}, 65%, ${55 + layer * 8}%, ${0.25 + toggle * 0.25})`);
        buffer.push();
        buffer.translate(cell.x, cell.y);
        buffer.rotate(baseRotation + layer * 0.35 * (toggle > 0 ? -1 : 1));
        buffer.rect(0, 0, cell.size * scale, cell.size * scale, cell.size * 0.1);
        buffer.pop();
      }
    });

    buffer.pop();
  }
}
