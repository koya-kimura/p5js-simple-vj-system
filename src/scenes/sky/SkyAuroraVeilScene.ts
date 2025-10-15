import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type AuroraBand = {
  offset: number;
  amplitude: number;
  speed: number;
};

export class SkyAuroraVeilScene implements IScene {
  public readonly name = 'Sky · Aurora Veil';
  private bands: AuroraBand[] = [];

  setup(_p: p5, _buffer: p5.Graphics, columnIndex: number): void {
    this.bands = Array.from({ length: 5 }, (_, index) => ({
      offset: columnIndex * 0.4 + index * 0.8,
      amplitude: 0.2 + Math.random() * 0.3,
      speed: 0.2 + Math.random() * 0.4,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noStroke();

    const energy = contextToggleEnergy(context);
    const baseHue = (context.columnIndex * 40 + energy * 120) % 360;

    this.bands.forEach((band, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const amplitude = band.amplitude * (1 + energy * 0.8 + toggle * 0.6);
      const hue = (baseHue + index * 25 + toggle * 60) % 360;
      const alpha = 0.15 + energy * 0.25 + toggle * 0.3;
      const gradientSteps = 40;
      for (let i = 0; i < gradientSteps; i++) {
        const t = i / gradientSteps;
        const y = t * buffer.height;
        const wave = Math.sin(context.elapsedSeconds * band.speed + band.offset + y * 0.01);
        const xShift = wave * buffer.width * amplitude * 0.1;
        buffer.fill(`hsla(${hue}, 80%, ${50 + t * 30}%, ${alpha * (1 - t)})`);
        buffer.rect(xShift - buffer.width * 0.1, y, buffer.width * 1.2, buffer.height / gradientSteps + 1);
      }
    });

    buffer.pop();
  }
}
