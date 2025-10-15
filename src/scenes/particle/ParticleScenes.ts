import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../shared/toggleUtils';

type Particle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hue: number;
  drift: number;
};

type SwirlParticle = {
  radius: number;
  angle: number;
  speed: number;
  size: number;
};

type CascadeParticle = {
  x: number;
  y: number;
  speed: number;
  size: number;
  hue: number;
};

export class ParticleDriftFieldScene implements IScene {
  public readonly name = 'Particle · Drift Field';
  private particles: Particle[] = [];

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
