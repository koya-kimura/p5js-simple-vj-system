import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type Shard = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
};

export class TextureGlassShardScene implements IScene {
  public readonly name = 'Texture · Glass Shards';
  private shards: Shard[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const count = 80;
    this.shards = Array.from({ length: count }, () => ({
      x: Math.random() * buffer.width,
      y: Math.random() * buffer.height,
      width: buffer.width * (0.02 + Math.random() * 0.05),
      height: buffer.height * (0.1 + Math.random() * 0.2),
      angle: Math.random() * Math.PI * 2 + columnIndex * 0.15,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noStroke();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);
    const focus = contextToggleAverage(context, 3, 3);

    this.shards.forEach((shard, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const hue = (context.columnIndex * 35 + shard.angle * 30 + toggle * 80) % 360;
      const alpha = 0.08 + energy * 0.3 + toggle * 0.35;
      const scale = 1 + focus * 0.5 + toggle * 0.4;
      buffer.fill(`hsla(${hue}, 80%, 70%, ${alpha})`);
      buffer.push();
      buffer.translate(shard.x, shard.y);
      buffer.rotate(shard.angle + context.elapsedSeconds * 0.4 * (toggle > 0 ? 1 : -0.5));
      buffer.rect(0, 0, shard.width * scale, shard.height * (0.4 + energy * 0.4), shard.width * 0.2);
      buffer.pop();
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}
