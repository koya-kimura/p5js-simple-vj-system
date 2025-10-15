import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type ArcSeed = {
  x: number;
  baseHeight: number;
  noiseOffset: number;
};

export class LightningArcStormScene implements IScene {
  public readonly name = 'Lightning · Arc Storm';
  private seeds: ArcSeed[] = [];

  setup(p: p5, _buffer: p5.Graphics): void {
    const columns = 18;
    this.seeds = Array.from({ length: columns }, (_, index) => ({
      x: (index + 0.5) / columns,
      baseHeight: 0.5 + p.random() * 0.5,
      noiseOffset: p.random(1000),
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.strokeWeight(2.4);
    buffer.noFill();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);
    const branching = 2 + Math.floor(contextToggleAverage(context, 0, 4) * 4);

    this.seeds.forEach((seed, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const height = seed.baseHeight + toggle * 0.4;
      const hue = (200 + energy * 120 + toggle * 80) % 360;
      buffer.stroke(`hsla(${hue}, 90%, 70%, ${0.25 + energy * 0.6})`);
      const xPos = seed.x * buffer.width;
      const bolts = branching + Math.floor(toggle * 3);
      for (let i = 0; i < bolts; i++) {
        const segments = 10;
        buffer.beginShape();
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const sway = p.noise(seed.noiseOffset + context.elapsedSeconds * 1.2 + i * 10 + t * 4);
          const lateral = (sway - 0.5) * buffer.width * 0.08 * (1 + toggle * 0.8);
          const y = buffer.height * (1 - t * height);
          buffer.vertex(xPos + lateral, y);
        }
        buffer.endShape();
      }
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}
