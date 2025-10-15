import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type StarNode = {
  x: number;
  y: number;
  scale: number;
  offset: number;
};

export class OrientalAsanohaScene implements IScene {
  public readonly name = 'Oriental · Asanoha';
  private nodes: StarNode[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 9;
    const rows = 6;
    const spacingX = buffer.width / cols;
    const spacingY = buffer.height / rows;
    this.nodes = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const offset = (r % 2) * spacingX * 0.5;
        this.nodes.push({
          x: c * spacingX + offset,
          y: r * spacingY,
          scale: p.random(0.7, 1.2),
          offset: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noFill();
    buffer.strokeWeight(1.2);

    const energy = contextToggleEnergy(context);

    this.nodes.forEach((node, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const radius = Math.min(buffer.width, buffer.height) * 0.05 * node.scale * (1 + energy * 0.4 + toggle * 0.4);
      const hue = (context.columnIndex * 45 + index * 2 + toggle * 70) % 360;
      buffer.stroke(`hsla(${hue}, 70%, 65%, ${0.25 + toggle * 0.4})`);
      const phase = context.elapsedSeconds * (0.6 + energy * 0.5) + node.offset;
      const inner = radius * 0.4 * (1 + Math.sin(phase) * 0.3);
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 3) * a + phase * 0.2 * toggle;
        buffer.line(node.x, node.y, node.x + Math.cos(angle) * radius, node.y + Math.sin(angle) * radius);
        buffer.line(node.x, node.y, node.x + Math.cos(angle + Math.PI / 6) * inner, node.y + Math.sin(angle + Math.PI / 6) * inner);
      }
    });

    buffer.pop();
  }
}
