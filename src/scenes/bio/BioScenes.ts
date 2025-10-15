import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../shared/toggleUtils';

type BloomNode = {
  baseRadius: number;
  speed: number;
  offset: number;
};

type Cell = {
  x: number;
  y: number;
  size: number;
  phase: number;
};

type NeuralLink = {
  angle: number;
  radius: number;
  speed: number;
};

export class BioOrganicBloomScene implements IScene {
  public readonly name = 'Bio · Organic Bloom';
  private nodes: BloomNode[] = [];

  setup(_p: p5, buffer: p5.Graphics): void {
    const minDim = Math.min(buffer.width, buffer.height);
    this.nodes = Array.from({ length: 9 }, (_, index) => ({
      baseRadius: minDim * (0.1 + index * 0.05),
      speed: 0.2 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
  const energy = contextToggleEnergy(context, 'smooth');
    buffer.push();
    buffer.clear();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.noFill();
    buffer.strokeWeight(energy > 0 ? 2.4 : 1.4);
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    this.nodes.forEach((node, index) => {
      const phase = context.elapsedSeconds * node.speed + node.offset;
      const modulation = 1 + energy * 0.6;
      const radius = node.baseRadius * (0.8 + 0.2 * Math.sin(phase * (1 + energy)));
      const hue = (120 + energy * 160 + index * 18) % 360;
      buffer.stroke(hue, 60 + energy * 30, 90, 0.85);
  const petals = 6 + Math.floor(contextToggleValue(context, index % 7, 0, 'smooth') * 6);
      buffer.beginShape();
      for (let i = 0; i <= petals; i++) {
        const angle = (p.TWO_PI / petals) * i;
        const r = radius * (0.9 + modulation * 0.12 * Math.sin(angle * (2 + energy * 3) + phase));
        buffer.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      buffer.endShape();
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}

export class BioCellMeshScene implements IScene {
  public readonly name = 'Bio · Cell Mesh';
  private cells: Cell[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 6;
    const rows = 6;
    const cellW = buffer.width / cols;
    const cellH = buffer.height / rows;
    this.cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jitterX = p.random(-cellW * 0.15, cellW * 0.15);
        const jitterY = p.random(-cellH * 0.15, cellH * 0.15);
        this.cells.push({
          x: (c + 0.5) * cellW + jitterX,
          y: (r + 0.5) * cellH + jitterY,
          size: Math.min(cellW, cellH) * p.random(0.65, 0.9),
          phase: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.noStroke();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

  const columnInfluence = contextToggleAverage(context, 0, 3);
  const membraneInfluence = contextToggleAverage(context, 3, 4);

    this.cells.forEach((cell, index) => {
      const anim = 0.5 + 0.5 * Math.sin(context.elapsedSeconds * 1.5 + cell.phase);
      const activation = contextToggleValue(context, index % 7);
      const hue = (90 + activation * 200 + columnInfluence * 120) % 360;
      buffer.fill(hue, 60 + membraneInfluence * 30, 70 + anim * 20, 0.85);
      const sizePulse = cell.size * (0.8 + 0.25 * anim + activation * 0.15);
      buffer.ellipse(cell.x, cell.y, sizePulse, sizePulse);
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}

export class BioNeuralPulseScene implements IScene {
  public readonly name = 'Bio · Neural Pulse';
  private links: NeuralLink[] = [];

  setup(_p: p5, buffer: p5.Graphics): void {
    const count = 36;
    const minDim = Math.min(buffer.width, buffer.height);
    this.links = Array.from({ length: count }, (_, index) => ({
      angle: (index / count) * Math.PI * 2,
      radius: minDim * (0.2 + Math.random() * 0.35),
      speed: 0.5 + Math.random() * 0.6,
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.strokeWeight(1.5);
    buffer.noFill();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    const energy = contextToggleEnergy(context);
  const branchFactor = 2 + Math.floor(contextToggleAverage(context, 0, 3) * 3);

    this.links.forEach((link, index) => {
      const phase = context.elapsedSeconds * link.speed;
      const hue = (200 + energy * 140 + index * 8) % 360;
      const alpha = 0.25 + 0.5 * contextToggleValue(context, index % 7);
      buffer.stroke(hue, 70, 100, alpha);
      buffer.beginShape();
      const segments = 12 + branchFactor * 4;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const wave = Math.sin(t * Math.PI * branchFactor + phase);
        const radius = link.radius * (0.6 + t * 0.5 + energy * 0.3 * wave);
        const angle = link.angle + wave * 0.5;
        buffer.vertex(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      buffer.endShape();
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
