// src/scenes/FallingSphereArrayScene.ts

import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../core/IScene';

interface Sphere {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hue: number;
  drift: number;
}

export class FallingSphereArrayScene implements IScene {
  public readonly name = 'Falling Sphere Array';
  private spheres: Sphere[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const count = Math.max(6, Math.floor(buffer.width / 120));
    const minDim = Math.min(buffer.width, buffer.height);
    this.spheres = Array.from({ length: count }, (_, i) => ({
      x: (i + 0.5) * (buffer.width / count),
      y: Math.random() * buffer.height,
      radius: minDim * (0.04 + Math.random() * 0.06),
      speed: minDim * (0.08 + Math.random() * 0.12),
      hue: (columnIndex * 45 + i * 30) % 360,
      drift: (Math.random() - 0.5) * minDim * 0.01,
    }));
  }

  draw(_p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.push();
    buffer.noStroke();

    this.spheres.forEach((sphere) => {
      sphere.y += sphere.speed * context.deltaSeconds;
      sphere.x += sphere.drift * context.deltaSeconds;
      if (sphere.y - sphere.radius > buffer.height) {
        sphere.y = -sphere.radius * 2 - Math.random() * 60;
      }

      const glow = 0.6 + 0.4 * Math.sin(context.elapsedSeconds + sphere.x * 0.01);
      buffer.fill(`hsla(${sphere.hue}, 80%, 60%, ${glow.toFixed(3)})`);
      buffer.circle(sphere.x, sphere.y, sphere.radius * 2);
    });

    buffer.pop();
  }
}
