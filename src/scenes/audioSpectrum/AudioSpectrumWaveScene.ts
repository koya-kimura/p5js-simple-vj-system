import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';
import { spectrumAverage, spectrumSample } from './audioSpectrumUtils';

type WavePoint = {
  x: number;
  offset: number;
};

export class AudioSpectrumWaveScene implements IScene {
  public readonly name = 'Audio · Wave Surface';
  private points: WavePoint[] = [];

  setup(_p: p5, buffer: p5.Graphics): void {
    const count = 64;
    const spacing = buffer.width / (count - 1);
    this.points = Array.from({ length: count }, (_, index) => ({
      x: index * spacing,
      offset: Math.random() * Math.PI * 2,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.noStroke();

    const low = contextToggleAverage(context, 0, 3, 'smooth');
    const mid = contextToggleAverage(context, 3, 2, 'smooth');
    const high = contextToggleAverage(context, 5, 2, 'smooth');
    const energy = contextToggleEnergy(context, 'smooth');
    const audioLevel = Math.min(1, context.audioLevel * 3.2);
    const spectrum = context.audioSpectrum;

    const lowSpectrum = spectrumAverage(spectrum, 0, 0.2);
    const midSpectrum = spectrumAverage(spectrum, 0.2, 0.6);
    const highSpectrum = spectrumAverage(spectrum, 0.6, 1);

    const amplitude = buffer.height * (0.08 + lowSpectrum * 0.6 + audioLevel * 0.3 + low * 0.15);
    const thickness = 2 + (midSpectrum + audioLevel + mid) * 5;

    for (let layer = 0; layer < 3; layer++) {
      buffer.beginShape();
      const hue = (180 + layer * 40 + (highSpectrum + high) * 120 + audioLevel * 60) % 360;
      const alpha = 0.1 + (energy + audioLevel + highSpectrum * 0.6) * 0.25 + layer * 0.08;
      buffer.fill(`hsla(${hue}, 85%, 60%, ${alpha})`);
      const layerOffset = layer * 0.2 + context.elapsedSeconds * (0.4 + energy * 0.3 + audioLevel * 0.4);
      this.points.forEach((point, index) => {
        const toggle = contextToggleValue(context, (index + layer) % 7, 0, 'smooth');
        const spectrumValue = spectrumSample(spectrum, index, this.points.length);
        const wave = Math.sin(
          context.elapsedSeconds * (1.3 + layer * 0.28 + audioLevel * 0.6 + spectrumValue * 0.4)
            + point.offset
            + layerOffset
            + toggle * Math.PI,
        );
        const influence = 1 + toggle * 0.4 + audioLevel * 0.6 + spectrumValue * 0.8;
        const y = buffer.height * 0.5 + wave * amplitude * influence;
        buffer.vertex(point.x, y + layer * thickness);
      });
      buffer.vertex(buffer.width, buffer.height);
      buffer.vertex(0, buffer.height);
      buffer.endShape(p.CLOSE);
    }

    buffer.pop();
  }
}
