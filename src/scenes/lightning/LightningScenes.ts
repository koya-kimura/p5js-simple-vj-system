import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../shared/toggleUtils';

type ArcSeed = {
  x: number;
  baseHeight: number;
  noiseOffset: number;
};

type RadialBolt = {
  angle: number;
  speed: number;
  phase: number;
};

type GridNode = {
  x: number;
  y: number;
  phase: number;
};

export class LightningArcStormScene implements IScene {
  public readonly name = 'Lightning · Arc Storm';
  private seeds: ArcSeed[] = [];

  setup(p: p5, _buffer: p5.Graphics): void {
    const columns = 18;
    this.seeds = Array.from({ length: columns }, (_, index) => ({
      x: (index + 0.5) / columns,
      baseHeight: 0.5 + p.random() * 0.5,
      noiseOffset: p.random(1000),
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.strokeWeight(2.4);
    buffer.noFill();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);
    const branching = 2 + Math.floor(contextToggleAverage(context, 0, 4) * 4);

    this.seeds.forEach((seed, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const height = seed.baseHeight + toggle * 0.4;
      const hue = (200 + energy * 120 + toggle * 80) % 360;
      buffer.stroke(`hsla(${hue}, 90%, 70%, ${0.25 + energy * 0.6})`);
      const xPos = seed.x * buffer.width;
      const bolts = branching + Math.floor(toggle * 3);
      for (let i = 0; i < bolts; i++) {
        const segments = 10;
        buffer.beginShape();
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const sway = p.noise(seed.noiseOffset + context.elapsedSeconds * 1.2 + i * 10 + t * 4);
          const lateral = (sway - 0.5) * buffer.width * 0.08 * (1 + toggle * 0.8);
          const y = buffer.height * (1 - t * height);
          buffer.vertex(xPos + lateral, y);
        }
        buffer.endShape();
      }
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}

export class LightningIonBurstScene implements IScene {
  public readonly name = 'Lightning · Ion Burst';
  private bolts: RadialBolt[] = [];

  setup(p: p5, _buffer: p5.Graphics, columnIndex: number): void {
    const count = 24;
    this.bolts = Array.from({ length: count }, (_, index) => ({
      angle: (index / count) * p.TWO_PI + columnIndex * 0.1,
      speed: 0.6 + Math.random() * 0.4,
      phase: Math.random() * p.TWO_PI,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.strokeWeight(1.5);
    buffer.noFill();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);

    this.bolts.forEach((bolt, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const hue = (45 + index * 10 + energy * 180) % 360;
      const alpha = 0.2 + energy * 0.45 + toggle * 0.3;
      buffer.stroke(`hsla(${hue}, 100%, 70%, ${alpha})`);
      const segments = 12;
      const amplitude = 0.3 + energy * 0.5 + toggle * 0.4;
      const radius = Math.min(buffer.width, buffer.height) * (0.35 + energy * 0.3);
      buffer.beginShape();
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const jitter = Math.sin((context.elapsedSeconds * bolt.speed + bolt.phase + t * 6) * (1 + toggle)) * amplitude;
        const angle = bolt.angle + jitter * 0.4;
        const dist = radius * t * (1 + jitter * 0.15);
        buffer.vertex(Math.cos(angle) * dist, Math.sin(angle) * dist);
      }
      buffer.endShape();
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}

export class LightningPulseGridScene implements IScene {
  public readonly name = 'Lightning · Pulse Grid';
  private nodes: GridNode[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 8;
    const rows = 6;
    const cellW = buffer.width / cols;
    const cellH = buffer.height / rows;
    this.nodes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.nodes.push({
          x: c * cellW + cellW / 2,
          y: r * cellH + cellH / 2,
          phase: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.strokeWeight(1);
    buffer.noFill();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);
    const surge = contextToggleAverage(context, 2, 3);

    this.nodes.forEach((node, index) => {
      const activation = contextToggleValue(context, index % 7);
      const phase = context.elapsedSeconds * (1.8 + surge * 1.2) + node.phase;
      const pulse = 0.4 + 0.6 * Math.pow(Math.sin(phase * (1 + activation)), 2);
      const hue = (180 + surge * 120 + activation * 60) % 360;
      const alpha = 0.18 + energy * 0.4 + activation * 0.3;
      const size = Math.min(buffer.width, buffer.height) * 0.12 * (0.5 + pulse);
      buffer.stroke(`hsla(${hue}, 100%, 65%, ${alpha})`);
      buffer.rect(node.x - size / 2, node.y - size / 2, size, size, size * 0.1);
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}
