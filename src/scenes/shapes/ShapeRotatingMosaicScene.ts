import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type MosaicTile = {
  x: number;
  y: number;
  rotation: number;
};

export class ShapeRotatingMosaicScene implements IScene {
  public readonly name = 'Shape · Rotating Mosaic';
  private tiles: MosaicTile[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 6;
    const rows = 6;
    const cellW = buffer.width / cols;
    const cellH = buffer.height / rows;
    this.tiles = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jitterX = p.random(-cellW * 0.1, cellW * 0.1);
        const jitterY = p.random(-cellH * 0.1, cellH * 0.1);
        this.tiles.push({
          x: c * cellW + cellW / 2 + jitterX,
          y: r * cellH + cellH / 2 + jitterY,
          rotation: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.rectMode(p.CENTER);
    buffer.noStroke();

    const energy = contextToggleEnergy(context);
    const hueBase = 20 + context.columnIndex * 35;

    this.tiles.forEach((tile, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const pulse = Math.sin(context.elapsedSeconds * (1.2 + toggle * 0.8) + tile.rotation);
      const size = Math.min(buffer.width, buffer.height) * 0.08 * (0.6 + energy * 0.4 + toggle * 0.3);
      buffer.push();
      buffer.translate(tile.x, tile.y);
      buffer.rotate(tile.rotation + pulse * 0.4);
      const hue = (hueBase + pulse * 40 + toggle * 60) % 360;
      buffer.fill(`hsla(${hue}, 70%, ${60 + energy * 30}%, ${0.4 + toggle * 0.4})`);
      buffer.square(0, 0, size, size * 0.2);
      buffer.pop();
    });

    buffer.pop();
  }
}
