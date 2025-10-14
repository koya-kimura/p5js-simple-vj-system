// src/scenes/RadialPulseConduitsScene.ts

import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../core/IScene';

export class RadialPulseConduitsScene implements IScene {
  public readonly name = 'Radial Pulse Conduits';
  private sides = 5;

  setup(_p: p5, _buffer: p5.Graphics, columnIndex: number): void {
    // choose polygon sides per column for simple distinct visuals
    this.sides = 3 + (columnIndex % 6);
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.noFill();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    const minDim = Math.min(buffer.width, buffer.height);
    const radius = minDim * 0.35;
    const rot = context.elapsedSeconds * 0.6 + context.columnIndex * 0.4;
    const hue = (context.columnIndex * 50 + context.elapsedSeconds * 8) % 360;

    buffer.stroke(hue, 80, 70, 0.95);
    buffer.strokeWeight(minDim * 0.01);

    buffer.beginShape();
    for (let i = 0; i < this.sides; i++) {
      const a = rot + (i / this.sides) * p.TWO_PI;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      buffer.vertex(x, y);
    }
    buffer.endShape(p.CLOSE);

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
