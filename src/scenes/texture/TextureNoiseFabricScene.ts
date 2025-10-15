import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type NoisePatch = {
  x: number;
  y: number;
  size: number;
  seed: number;
};

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
