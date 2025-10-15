import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../shared/toggleUtils';

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

    const energy = contextToggleEnergy(context);
    const lowBand = contextToggleAverage(context, 0, 2);
    const midBand = contextToggleAverage(context, 2, 3);
    const highBand = contextToggleAverage(context, 5, 2);

    this.bars.forEach((bar, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const targetHeight = buffer.height * (0.2 + energy * 0.6 + toggle * 0.4);
      const damping = 0.6 + energy * 0.3;
      bar.height = p.lerp(bar.height, targetHeight, damping * 0.15);
      const baseHue = 200 + lowBand * 80 + index * 0.5;
      const sat = 60 + midBand * 40;
      const light = 40 + highBand * 40 + toggle * 10;
      buffer.fill((baseHue + toggle * 70) % 360, sat, light, 0.85);
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
    const low = contextToggleAverage(context, 0, 3);
    const mid = contextToggleAverage(context, 3, 2);
    const high = contextToggleAverage(context, 5, 2);
    const energy = contextToggleEnergy(context);

    const amplitude = buffer.height * (0.12 + low * 0.3 + energy * 0.2);
    const thickness = 2 + mid * 6;

    for (let layer = 0; layer < 3; layer++) {
      buffer.beginShape();
      const hue = (180 + layer * 40 + high * 120) % 360;
      const alpha = 0.15 + energy * 0.25 + layer * 0.1;
      buffer.fill(`hsla(${hue}, 85%, 60%, ${alpha})`);
      const layerOffset = layer * 0.2 + context.elapsedSeconds * (0.4 + energy * 0.3);
      this.points.forEach((point, index) => {
        const toggle = contextToggleValue(context, (index + layer) % 7);
        const wave = Math.sin(context.elapsedSeconds * (1.4 + layer * 0.3) + point.offset + layerOffset + toggle * Math.PI);
        const y = buffer.height * 0.5 + wave * amplitude * (1 + toggle * 0.6);
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

    const energy = contextToggleEnergy(context);

    this.rings.forEach((ring, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const motion = Math.sin(context.elapsedSeconds * ring.speed + index * 0.4);
      const radius = ring.radius * (1 + energy * 0.4 + toggle * 0.35 * motion);
      const hue = (300 + energy * 120 + index * 10) % 360;
      const alpha = 0.12 + toggle * 0.4 + energy * 0.25;
      buffer.stroke(hue, 70 + energy * 20, 80, alpha);
      buffer.strokeWeight(ring.thickness * (1 + toggle * 0.5));
      buffer.ellipse(0, 0, radius * 2, radius * 2);
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
