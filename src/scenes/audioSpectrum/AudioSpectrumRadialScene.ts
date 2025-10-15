import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';
import { spectrumAverage, spectrumSample } from './audioSpectrumUtils';

type Ring = {
  radius: number;
  thickness: number;
  speed: number;
};

export class AudioSpectrumRadialScene implements IScene {
  public readonly name = 'Audio · Radial Bloom';
  private rings: Ring[] = [];

  setup(_p: p5, buffer: p5.Graphics): void {
    const minDim = Math.min(buffer.width, buffer.height);
    this.rings = Array.from({ length: 18 }, (_, index) => ({
      radius: minDim * (0.1 + index * 0.03),
      thickness: minDim * 0.01 * (1 + index * 0.05),
      speed: 0.4 + Math.random() * 0.4,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.noFill();
    buffer.strokeCap(p.SQUARE);
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    const energy = contextToggleEnergy(context, 'smooth');
    const audioLevel = Math.min(1, context.audioLevel * 3);
    const spectrum = context.audioSpectrum;
    const lowSpectrum = spectrumAverage(spectrum, 0, 0.2);
    const midSpectrum = spectrumAverage(spectrum, 0.2, 0.6);
    const highSpectrum = spectrumAverage(spectrum, 0.6, 1);

    this.rings.forEach((ring, index) => {
      const toggle = contextToggleValue(context, index % 7, 0, 'smooth');
      const spectrumValue = spectrumSample(spectrum, index, this.rings.length);
      const motion = Math.sin(context.elapsedSeconds * ring.speed + index * 0.4);
      const radius = ring.radius * (1 + lowSpectrum * 0.4 + audioLevel * 0.4 + spectrumValue * 0.45 * motion);
      const hue = (300 + audioLevel * 150 + midSpectrum * 120 + energy * 60 + index * 9) % 360;
      const alpha = 0.08 + toggle * 0.3 + (energy + audioLevel + highSpectrum) * 0.28;
      buffer.stroke(hue, 60 + (energy + midSpectrum + audioLevel) * 25, 80, alpha);
      buffer.strokeWeight(ring.thickness * (1 + toggle * 0.35 + audioLevel * 0.35 + spectrumValue * 0.4));
      buffer.ellipse(0, 0, radius * 2, radius * 2);
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
