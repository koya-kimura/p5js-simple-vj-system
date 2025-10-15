import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleValue } from '../../utils/toggleUtils';

type CascadeParticle = {
  x: number;
  y: number;
  speed: number;
  size: number;
  hue: number;
};

export class ParticleCascadeScene implements IScene {
  public readonly name = 'Particle · Cascade Flow';
  private particles: CascadeParticle[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const count = 50;
    const minDim = Math.min(buffer.width, buffer.height);
    this.particles = Array.from({ length: count }, (_, index) => ({
      x: (index / count) * buffer.width,
      y: Math.random() * buffer.height,
      speed: minDim * (0.18 + Math.random() * 0.22),
      size: minDim * (0.015 + Math.random() * 0.02),
      hue: (columnIndex * 40 + index * 12) % 360,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noStroke();

    const depth = contextToggleAverage(context, 0, 4);

    this.particles.forEach((particle, index) => {
      const toggle = contextToggleValue(context, (index + 3) % 7);
      particle.y += particle.speed * context.deltaSeconds * (0.7 + depth * 0.6 + toggle * 0.4);
      if (particle.y > buffer.height + particle.size * 2) {
        particle.y = -particle.size * 2 - Math.random() * buffer.height * 0.2;
      }
      const blur = 0.5 + depth * 0.3;
      buffer.fill(`hsla(${(particle.hue + toggle * 80) % 360}, 75%, ${60 + depth * 30}%, ${0.3 + toggle * 0.4})`);
      buffer.rect(particle.x, particle.y, particle.size * (2 + toggle * 2), particle.size * (10 + blur * 8));
    });

    buffer.pop();
  }
}
