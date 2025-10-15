import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../shared/toggleUtils';

type WeaveThread = {
  x: number;
  y: number;
  width: number;
  horizontal: boolean;
  offset: number;
};

type NoisePatch = {
  x: number;
  y: number;
  size: number;
  seed: number;
};

type Shard = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
};

export class TextureWeaveScene implements IScene {
  public readonly name = 'Texture · Weave Pattern';
  private threads: WeaveThread[] = [];

  setup(_p: p5, buffer: p5.Graphics): void {
    const cols = 14;
    const rows = 14;
    const spacingX = buffer.width / cols;
    const spacingY = buffer.height / rows;
    this.threads = [];
    for (let c = 0; c < cols; c++) {
      this.threads.push({
        x: c * spacingX,
        y: 0,
        width: spacingX * 0.55,
        horizontal: false,
        offset: Math.random() * Math.PI * 2,
      });
    }
    for (let r = 0; r < rows; r++) {
      this.threads.push({
        x: 0,
        y: r * spacingY,
        width: spacingY * 0.55,
        horizontal: true,
        offset: Math.random() * Math.PI * 2,
      });
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noStroke();

    const energy = contextToggleEnergy(context);

    this.threads.forEach((thread, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const weight = thread.width * (0.8 + energy * 0.4 + toggle * 0.3);
      const hue = (context.columnIndex * 40 + (thread.horizontal ? 20 : 0) + toggle * 70) % 360;
      const alpha = 0.2 + energy * 0.2 + toggle * 0.4;
      buffer.fill(`hsla(${hue}, 60%, ${50 + (thread.horizontal ? 10 : 0)}%, ${alpha})`);
      const oscillation = Math.sin(context.elapsedSeconds * (0.8 + toggle) + thread.offset) * weight * 0.3;
      if (thread.horizontal) {
        buffer.rect(0, thread.y + oscillation, buffer.width, weight);
      } else {
        buffer.rect(thread.x + oscillation, 0, weight, buffer.height);
      }
    });

    buffer.pop();
  }
}

export class TextureNoiseFabricScene implements IScene {
  public readonly name = 'Texture · Noise Fabric';
  private patches: NoisePatch[] = [];

  setup(_p: p5, buffer: p5.Graphics): void {
    const cols = 12;
    const rows = 8;
    const cellW = buffer.width / cols;
    const cellH = buffer.height / rows;
    this.patches = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.patches.push({
          x: c * cellW,
          y: r * cellH,
          size: Math.min(cellW, cellH),
          seed: Math.random() * 1000,
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noStroke();

    const energy = contextToggleEnergy(context);
    const grain = contextToggleAverage(context, 0, 4);

    this.patches.forEach((patch, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const hue = (context.columnIndex * 40 + patch.seed % 60 + toggle * 70) % 360;
      const alpha = 0.24 + energy * 0.25 + toggle * 0.35;
      const steps = 6;
      for (let y = 0; y < steps; y++) {
        for (let x = 0; x < steps; x++) {
          const nx = patch.x + (x / steps) * patch.size;
          const ny = patch.y + (y / steps) * patch.size;
          const noise = p.noise((nx + context.elapsedSeconds * 40) * 0.01, (ny + patch.seed) * 0.01);
          const brightness = 40 + noise * 40 + grain * 20 + toggle * 10;
          buffer.fill(`hsla(${hue}, 50%, ${brightness}%, ${alpha})`);
          buffer.rect(nx, ny, patch.size / steps + 1, patch.size / steps + 1);
        }
      }
    });

    buffer.pop();
  }
}

export class TextureGlassShardScene implements IScene {
  public readonly name = 'Texture · Glass Shards';
  private shards: Shard[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const count = 80;
    this.shards = Array.from({ length: count }, () => ({
      x: Math.random() * buffer.width,
      y: Math.random() * buffer.height,
      width: buffer.width * (0.02 + Math.random() * 0.05),
      height: buffer.height * (0.1 + Math.random() * 0.2),
      angle: Math.random() * Math.PI * 2 + columnIndex * 0.15,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noStroke();
    buffer.blendMode(p.ADD);

    const energy = contextToggleEnergy(context);
    const focus = contextToggleAverage(context, 3, 3);

    this.shards.forEach((shard, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const hue = (context.columnIndex * 35 + shard.angle * 30 + toggle * 80) % 360;
      const alpha = 0.08 + energy * 0.3 + toggle * 0.35;
      const scale = 1 + focus * 0.5 + toggle * 0.4;
      buffer.fill(`hsla(${hue}, 80%, 70%, ${alpha})`);
      buffer.push();
      buffer.translate(shard.x, shard.y);
      buffer.rotate(shard.angle + context.elapsedSeconds * 0.4 * (toggle > 0 ? 1 : -0.5));
      buffer.rect(0, 0, shard.width * scale, shard.height * (0.4 + energy * 0.4), shard.width * 0.2);
      buffer.pop();
    });

    buffer.pop();
    buffer.blendMode(p.BLEND);
  }
}
