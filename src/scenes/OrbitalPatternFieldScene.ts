// src/scenes/OrbitalPatternFieldScene.ts

import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../core/IScene';

interface Orbiter {
  radius: number;
  speed: number;
  size: number;
  phase: number;
}

export class OrbitalPatternFieldScene implements IScene {
  public readonly name = 'Orbital Pattern Field';

  private orbiters: Orbiter[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const minDim = Math.min(buffer.width, buffer.height);
    const baseRadius = minDim * 0.12;

    this.orbiters = Array.from({ length: 12 }, (_, index) => ({
      radius: baseRadius + index * minDim * 0.04,
      speed: 0.15 + Math.random() * 0.25,
      size: minDim * (0.015 + Math.random() * 0.03),
      phase: Math.random() * Math.PI * 2 + columnIndex * 0.35,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.noFill();
    buffer.strokeWeight(1.5);
    buffer.colorMode(buffer.HSB, 360, 100, 100, 100);

    const hueBase = (context.elapsedSeconds * 15 + context.columnIndex * 40) % 360;

    this.orbiters.forEach((orbiter, index) => {
      const phase = orbiter.phase + context.elapsedSeconds * orbiter.speed * p.TWO_PI;
      const x = Math.cos(phase) * orbiter.radius;
      const y = Math.sin(phase) * orbiter.radius;

      buffer.stroke((hueBase + index * 8) % 360, 80, 100, 70);
      buffer.ellipse(x, y, orbiter.size * 2, orbiter.size * 2);

      buffer.stroke((hueBase + index * 8 + 120) % 360, 40, 100, 35);
      buffer.arc(0, 0, orbiter.radius * 2, orbiter.radius * 2, phase - 0.4, phase + 0.4);
    });

    buffer.pop();
    buffer.colorMode(buffer.RGB, 255, 255, 255, 255);
  }
}
