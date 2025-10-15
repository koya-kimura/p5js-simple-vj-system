import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type DriftParticle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hue: number;
  drift: number;
};

export class ParticleDriftFieldScene implements IScene {
  public readonly name = 'Particle · Drift Field';
  private particles: DriftParticle[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const count = Math.max(24, Math.floor(buffer.width / 40));
    const minDim = Math.min(buffer.width, buffer.height);
    this.particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * buffer.width,
      y: Math.random() * buffer.height,
      radius: minDim * (0.01 + Math.random() * 0.03),
      speed: minDim * (0.05 + Math.random() * 0.08),
      hue: (columnIndex * 50 + index * 6) % 360,
      drift: (Math.random() - 0.5) * minDim * 0.04,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.noStroke();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    const energy = contextToggleEnergy(context);

    this.particles.forEach((particle, index) => {
      const toggle = contextToggleValue(context, index % 7);
      particle.y += particle.speed * context.deltaSeconds * (0.5 + energy * 0.8 + toggle * 0.6);
      particle.x += particle.drift * context.deltaSeconds * (0.2 + energy * 0.4);
      if (particle.y - particle.radius > buffer.height) {
        particle.y = -particle.radius - Math.random() * buffer.height * 0.2;
      }
      const glow = 0.4 + 0.5 * Math.sin(context.elapsedSeconds + particle.x * 0.01);
      buffer.fill((particle.hue + toggle * 120) % 360, 70 + energy * 20, 80, 0.3 + glow * 0.5 + toggle * 0.3);
      buffer.circle(particle.x % buffer.width, particle.y, particle.radius * (4 + toggle * 4));
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
