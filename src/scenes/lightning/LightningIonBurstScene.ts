import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type RadialBolt = {
  angle: number;
  speed: number;
  phase: number;
};

export class LightningIonBurstScene implements IScene {
  public readonly name = 'Lightning · Ion Burst';
  private bolts: RadialBolt[] = [];

  setup(p: p5, _buffer: p5.Graphics, columnIndex: number): void {
    const count = 24;
    this.bolts = Array.from({ length: count }, (_, index) => ({
      angle: (index / count) * p.TWO_PI + columnIndex * 0.1,
      speed: 0.6 + Math.random() * 0.4,
      phase: Math.random() * p.TWO_PI,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.strokeWeight(1.5);
    buffer.noFill();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);

    this.bolts.forEach((bolt, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const hue = (45 + index * 10 + energy * 180) % 360;
      const alpha = 0.2 + energy * 0.45 + toggle * 0.3;
      buffer.stroke(`hsla(${hue}, 100%, 70%, ${alpha})`);
      const segments = 12;
      const amplitude = 0.3 + energy * 0.5 + toggle * 0.4;
      const radius = Math.min(buffer.width, buffer.height) * (0.35 + energy * 0.3);
      buffer.beginShape();
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const jitter = Math.sin((context.elapsedSeconds * bolt.speed + bolt.phase + t * 6) * (1 + toggle)) * amplitude;
        const angle = bolt.angle + jitter * 0.4;
        const dist = radius * t * (1 + jitter * 0.15);
        buffer.vertex(Math.cos(angle) * dist, Math.sin(angle) * dist);
      }
      buffer.endShape();
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}
