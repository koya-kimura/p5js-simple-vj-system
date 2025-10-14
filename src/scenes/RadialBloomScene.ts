// src/scenes/RadialBloomScene.ts

import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../core/IScene';

export class RadialBloomScene implements IScene {
  public readonly name = 'Radial Bloom';
  private seed = 0;

  setup(_p: p5, _buffer: p5.Graphics, columnIndex: number): void {
    this.seed = columnIndex * 137;
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.noFill();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    const t = context.elapsedSeconds + this.seed * 0.001;
    const radius = Math.min(buffer.width, buffer.height) * (0.15 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.2)));
    const hue = (context.columnIndex * 45 + context.elapsedSeconds * 12) % 360;

    buffer.stroke(hue, 80, 70, 0.9);
    buffer.strokeWeight(Math.min(buffer.width, buffer.height) * 0.02);
    buffer.ellipse(0, 0, radius * 2, radius * 2);

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
