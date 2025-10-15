import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../shared/toggleUtils';

type AuroraBand = {
  offset: number;
  amplitude: number;
  speed: number;
};

type Meteor = {
  x: number;
  y: number;
  speed: number;
  length: number;
};

type NebulaPoint = {
  x: number;
  y: number;
  hue: number;
  scale: number;
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

  draw(_p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
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

export class SkyMeteorShowerScene implements IScene {
  public readonly name = 'Sky · Meteor Shower';
  private meteors: Meteor[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const count = 28;
  this.meteors = Array.from({ length: count }, () => ({
      x: Math.random() * buffer.width,
      y: Math.random() * buffer.height,
      speed: 0.35 + Math.random() * 0.6,
      length: buffer.width * (0.04 + Math.random() * 0.08 + columnIndex * 0.005),
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.strokeWeight(2.2);
    buffer.strokeCap(p.SQUARE);

    const energy = contextToggleEnergy(context);
    const wind = contextToggleAverage(context, 0, 3);

    this.meteors.forEach((meteor, index) => {
      const toggle = contextToggleValue(context, index % 7);
      meteor.x += meteor.speed * buffer.width * context.deltaSeconds * (1 + wind * 1.2 + toggle * 0.8);
      meteor.y += meteor.speed * buffer.height * context.deltaSeconds * (0.3 + energy * 0.5 + toggle * 0.6);
      if (meteor.x > buffer.width + meteor.length || meteor.y > buffer.height + meteor.length) {
        meteor.x = -meteor.length - Math.random() * buffer.width * 0.3;
        meteor.y = Math.random() * buffer.height * 0.5;
      }
      const hue = (context.columnIndex * 35 + index * 4 + toggle * 60) % 360;
      const alpha = 0.2 + energy * 0.3 + toggle * 0.4;
      buffer.stroke(`hsla(${hue}, 90%, 70%, ${alpha})`);
      buffer.line(meteor.x, meteor.y, meteor.x - meteor.length, meteor.y - meteor.length * 0.4);
    });

    buffer.pop();
  }
}

export class SkyNebulaBloomScene implements IScene {
  public readonly name = 'Sky · Nebula Bloom';
  private points: NebulaPoint[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const count = 120;
    this.points = Array.from({ length: count }, () => ({
      x: Math.random() * buffer.width,
      y: Math.random() * buffer.height,
      hue: (columnIndex * 40 + Math.random() * 120) % 360,
      scale: 0.6 + Math.random() * 0.8,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.noStroke();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);

    this.points.forEach((point, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const wave = Math.sin(context.elapsedSeconds * (0.8 + toggle * 0.6) + index * 0.1);
      const size = Math.min(buffer.width, buffer.height) * 0.12 * point.scale * (1 + energy * 0.5 + toggle * 0.5);
      const hue = (point.hue + wave * 20 + toggle * 60) % 360;
      const alpha = 0.08 + energy * 0.25 + toggle * 0.3;
      buffer.fill(`hsla(${hue}, 80%, 65%, ${alpha})`);
      buffer.circle(point.x, point.y, size);
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}
