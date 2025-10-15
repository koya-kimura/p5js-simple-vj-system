import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type OrbitSegment = {
  radius: number;
  speed: number;
  offset: number;
};

export class ShapePolyOrbitScene implements IScene {
  public readonly name = 'Shape · Poly Orbit';
  private segments: OrbitSegment[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const minDim = Math.min(buffer.width, buffer.height);
    this.segments = Array.from({ length: 14 }, (_, index) => ({
      radius: minDim * (0.12 + index * 0.035),
      speed: 0.25 + Math.random() * 0.45,
      offset: columnIndex * 0.2 + index * 0.3,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.noFill();
    buffer.strokeWeight(1.8);
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    const energy = contextToggleEnergy(context);

    this.segments.forEach((segment, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const sides = 5 + Math.floor(contextToggleAverage(context, 0, 4) * 4) + (toggle > 0 ? 2 : 0);
      const rotation = context.elapsedSeconds * segment.speed + segment.offset;
      const hue = (context.columnIndex * 45 + index * 8 + toggle * 50) % 360;
      const alpha = 0.2 + energy * 0.4 + toggle * 0.4;
      const radius = segment.radius * (0.9 + energy * 0.4 + toggle * 0.2);
      buffer.stroke(hue, 70 + energy * 20, 90, alpha);
      buffer.beginShape();
      for (let i = 0; i <= sides; i++) {
        const angle = rotation + (i / sides) * p.TWO_PI;
        buffer.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      buffer.endShape();
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
