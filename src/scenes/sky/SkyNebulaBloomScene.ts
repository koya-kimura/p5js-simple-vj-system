import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type NebulaPoint = {
  x: number;
  y: number;
  hue: number;
  scale: number;
};

export class SkyNebulaBloomScene implements IScene {
  public readonly name = 'Sky · Nebula Bloom';
  private points: NebulaPoint[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const count = 120;
    this.points = Array.from({ length: count }, () => ({
      x: Math.random() * buffer.width,
      y: Math.random() * buffer.height,
      hue: (columnIndex * 40 + Math.random() * 120) % 360,
      scale: 0.6 + Math.random() * 0.8,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.noStroke();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);

    this.points.forEach((point, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const wave = Math.sin(context.elapsedSeconds * (0.8 + toggle * 0.6) + index * 0.1);
      const size = Math.min(buffer.width, buffer.height) * 0.12 * point.scale * (1 + energy * 0.5 + toggle * 0.5);
      const hue = (point.hue + wave * 20 + toggle * 60) % 360;
      const alpha = 0.08 + energy * 0.25 + toggle * 0.3;
      buffer.fill(`hsla(${hue}, 80%, 65%, ${alpha})`);
      buffer.circle(point.x, point.y, size);
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}
