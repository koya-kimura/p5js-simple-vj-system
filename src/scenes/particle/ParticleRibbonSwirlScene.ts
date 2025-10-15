import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type SwirlParticle = {
  radius: number;
  angle: number;
  speed: number;
  size: number;
};

export class ParticleRibbonSwirlScene implements IScene {
  public readonly name = 'Particle · Ribbon Swirl';
  private particles: SwirlParticle[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const minDim = Math.min(buffer.width, buffer.height);
    const count = 80;
    this.particles = Array.from({ length: count }, (_, index) => ({
      radius: minDim * (0.05 + Math.random() * 0.45),
      angle: (index / count) * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.35,
      size: minDim * (0.01 + Math.random() * 0.02 + columnIndex * 0.001),
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.noStroke();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);

    this.particles.forEach((particle, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const angle = particle.angle + context.elapsedSeconds * particle.speed * (1 + energy * 0.6);
      const wobble = Math.sin(angle * (2 + toggle * 2)) * (0.2 + energy * 0.3);
      const radius = particle.radius * (0.8 + energy * 0.4 + toggle * 0.3 * wobble);
      const hue = (context.columnIndex * 50 + index * 4 + toggle * 40) % 360;
      const alpha = 0.15 + energy * 0.35 + toggle * 0.25;
      buffer.fill(`hsla(${hue}, 90%, 60%, ${alpha})`);
      buffer.circle(Math.cos(angle) * radius, Math.sin(angle) * radius, particle.size * (20 + toggle * 10));
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}
