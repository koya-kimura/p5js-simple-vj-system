import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../shared/toggleUtils';

type MosaicTile = {
  x: number;
  y: number;
  rotation: number;
};

type OrbitSegment = {
  radius: number;
  speed: number;
  offset: number;
};

type GridCell = {
  x: number;
  y: number;
  size: number;
  phase: number;
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

export class ShapePolyOrbitScene implements IScene {
  public readonly name = 'Shape · Poly Orbit';
  private segments: OrbitSegment[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const minDim = Math.min(buffer.width, buffer.height);
    this.segments = Array.from({ length: 14 }, (_, index) => ({
      radius: minDim * (0.12 + index * 0.035),
      speed: 0.25 + Math.random() * 0.45,
      offset: columnIndex * 0.2 + index * 0.3,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.noFill();
    buffer.strokeWeight(1.8);
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    const energy = contextToggleEnergy(context);

    this.segments.forEach((segment, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const sides = 5 + Math.floor(contextToggleAverage(context, 0, 4) * 4) + (toggle > 0 ? 2 : 0);
      const rotation = context.elapsedSeconds * segment.speed + segment.offset;
      const hue = (context.columnIndex * 45 + index * 8 + toggle * 50) % 360;
      const alpha = 0.2 + energy * 0.4 + toggle * 0.4;
      const radius = segment.radius * (0.9 + energy * 0.4 + toggle * 0.2);
      buffer.stroke(hue, 70 + energy * 20, 90, alpha);
      buffer.beginShape();
      for (let i = 0; i <= sides; i++) {
        const angle = rotation + (i / sides) * p.TWO_PI;
        buffer.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      buffer.endShape();
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}

export class ShapeRecursiveGridScene implements IScene {
  public readonly name = 'Shape · Recursive Grid';
  private cells: GridCell[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 8;
    const rows = 5;
    const cellW = buffer.width / cols;
    const cellH = buffer.height / rows;
    this.cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.cells.push({
          x: c * cellW + cellW / 2,
          y: r * cellH + cellH / 2,
          size: Math.min(cellW, cellH) * p.random(0.5, 0.9),
          phase: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.rectMode(p.CENTER);
    buffer.noFill();
    buffer.strokeWeight(1.2);

    const layers = 2 + Math.floor(contextToggleAverage(context, 0, 7) * 4);

    this.cells.forEach((cell, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const baseRotation = Math.sin(context.elapsedSeconds * 0.8 + cell.phase + toggle) * 0.6;
      for (let layer = 0; layer < layers; layer++) {
        const scale = 1 - layer * 0.22;
        if (scale <= 0) break;
        const hue = (context.columnIndex * 40 + layer * 25 + toggle * 90) % 360;
        buffer.stroke(`hsla(${hue}, 65%, ${55 + layer * 8}%, ${0.25 + toggle * 0.25})`);
        buffer.push();
        buffer.translate(cell.x, cell.y);
        buffer.rotate(baseRotation + layer * 0.35 * (toggle > 0 ? -1 : 1));
        buffer.rect(0, 0, cell.size * scale, cell.size * scale, cell.size * 0.1);
        buffer.pop();
      }
    });

    buffer.pop();
  }
}
