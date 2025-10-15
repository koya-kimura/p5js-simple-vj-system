import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';
import { spectrumAverage, spectrumSample } from './audioSpectrumUtils';

type Bar = {
  x: number;
  width: number;
  height: number;
};

export class AudioSpectrumColumnScene implements IScene {
  public readonly name = 'Audio · Spectrum Columns';
  private bars: Bar[] = [];

  setup(_p: p5, buffer: p5.Graphics): void {
    const count = 48;
    const spacing = buffer.width / count;
    this.bars = Array.from({ length: count }, (_, index) => ({
      x: index * spacing + spacing / 2,
      width: spacing * 0.7,
      height: 0,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.noStroke();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    const energy = contextToggleEnergy(context, 'smooth');
    const audioLevel = Math.min(1, context.audioLevel * 3);
    const spectrum = context.audioSpectrum;
    const lowBand = spectrumAverage(spectrum, 0, 0.25);
    const midBand = spectrumAverage(spectrum, 0.25, 0.6);
    const highBand = spectrumAverage(spectrum, 0.6, 1);

    this.bars.forEach((bar, index) => {
      const toggle = contextToggleValue(context, index % 7, 0, 'smooth');
      const spectrumValue = spectrumSample(spectrum, index, this.bars.length);
      const base = 0.12 + spectrumValue * 0.75 + audioLevel * 0.25;
      const targetHeight = buffer.height * Math.min(1, base + toggle * 0.25);
      const damping = 0.4 + (audioLevel + spectrumValue + energy) * 0.4;
  bar.height = p.lerp(bar.height, targetHeight, damping * 0.15);
      const baseHue = 200 + lowBand * 80 + index * 0.5;
      const sat = 45 + (midBand + audioLevel) * 50;
      const light = 35 + highBand * 35 + spectrumValue * 25 + toggle * 8;
      buffer.fill((baseHue + spectrumValue * 140 + toggle * 60) % 360, sat, light, 0.85);
      buffer.rect(bar.x - bar.width / 2, buffer.height - bar.height, bar.width, bar.height, bar.width * 0.25);
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
