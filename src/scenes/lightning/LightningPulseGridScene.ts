import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type GridNode = {
  x: number;
  y: number;
  phase: number;
};

export class LightningPulseGridScene implements IScene {
  public readonly name = 'Lightning · Pulse Grid';
  private nodes: GridNode[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 8;
    const rows = 6;
    const cellW = buffer.width / cols;
    const cellH = buffer.height / rows;
    this.nodes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.nodes.push({
          x: c * cellW + cellW / 2,
          y: r * cellH + cellH / 2,
          phase: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.strokeWeight(1);
    buffer.noFill();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);
    const surge = contextToggleAverage(context, 2, 3);

    this.nodes.forEach((node, index) => {
      const activation = contextToggleValue(context, index % 7);
      const phase = context.elapsedSeconds * (1.8 + surge * 1.2) + node.phase;
      const pulse = 0.4 + 0.6 * Math.pow(Math.sin(phase * (1 + activation)), 2);
      const hue = (180 + surge * 120 + activation * 60) % 360;
      const alpha = 0.18 + energy * 0.4 + activation * 0.3;
      const size = Math.min(buffer.width, buffer.height) * 0.12 * (0.5 + pulse);
      buffer.stroke(`hsla(${hue}, 100%, 65%, ${alpha})`);
      buffer.rect(node.x - size / 2, node.y - size / 2, size, size, size * 0.1);
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}
