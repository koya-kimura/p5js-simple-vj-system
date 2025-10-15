import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../shared/toggleUtils';

function spectrumSample(spectrum: readonly number[], index: number, total: number): number {
  if (spectrum.length === 0 || total <= 1) {
    return 0;
  }
  const clampedIndex = Math.max(0, Math.min(total - 1, index));
  const ratio = clampedIndex / (total - 1);
  const spectrumIndex = Math.min(
    spectrum.length - 1,
    Math.floor(ratio * (spectrum.length - 1)),
  );
  return spectrum[spectrumIndex] ?? 0;
}

function spectrumAverage(
  spectrum: readonly number[],
  startRatio: number,
  endRatio: number,
): number {
  if (spectrum.length === 0) {
    return 0;
  }
  const start = Math.max(0, Math.min(1, startRatio));
  const end = Math.max(start, Math.min(1, endRatio));
  const startIndex = Math.floor(start * (spectrum.length - 1));
  const endIndex = Math.floor(end * (spectrum.length - 1));
  let sum = 0;
  let count = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    const value = spectrum[i];
    sum += value;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

type Bar = {
  x: number;
  width: number;
  height: number;
};

type WavePoint = {
  x: number;
  offset: number;
};

type Ring = {
  radius: number;
  thickness: number;
  speed: number;
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
