// src/scenes/BinaryParticleLoomScene.ts

import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../core/IScene';

interface Particle {
  baseX: number;
  baseY: number;
  offsetX: number;
  offsetY: number;
  speed: number;
  phase: number;
  size: number;
}

export class BinaryParticleLoomScene implements IScene {
  public readonly name = 'Binary Particle Loom';

  private particles: Particle[] = [];
  // gridResolution not required for simplified binary rain
  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
  const cols = Math.max(10, Math.floor(buffer.width / 24));
    this.particles = [];
    for (let i = 0; i < cols; i++) {
      this.particles.push({
        baseX: i * (buffer.width / cols) + (buffer.width / cols) * 0.5,
        baseY: Math.random() * buffer.height,
        offsetX: 0,
        offsetY: 0,
        speed: 0.6 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2 + columnIndex * 0.2,
        size: Math.min(buffer.width / cols, buffer.height) * 0.6,
      });
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.push();
    buffer.textAlign(p.CENTER, p.CENTER);
    buffer.textFont('monospace');
    buffer.noStroke();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    this.particles.forEach((particle, i) => {
      particle.baseY += particle.speed * context.deltaSeconds * 60;
      if (particle.baseY > buffer.height + particle.size) {
        particle.baseY = -particle.size - Math.random() * 80;
      }

      const bit = Math.random() > 0.5 ? '1' : '0';
      const hue = (context.columnIndex * 40 + i * 20) % 360;
      const alpha = 0.6 + 0.4 * Math.sin(context.elapsedSeconds * 2 + i);

      buffer.fill(hue, 80, 80, alpha);
      buffer.textSize(particle.size * 0.8);
      buffer.text(bit, particle.baseX, particle.baseY);
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
