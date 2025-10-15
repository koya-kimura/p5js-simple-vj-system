import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../shared/toggleUtils';

type Wave = {
  x: number;
  y: number;
  radius: number;
};

type StarNode = {
  x: number;
  y: number;
  scale: number;
  offset: number;
};

type Hexagon = {
  x: number;
  y: number;
  size: number;
  rotation: number;
};

export class OrientalSeigaihaScene implements IScene {
  public readonly name = 'Oriental · Seigaiha';
  private waves: Wave[] = [];

  setup(_p: p5, buffer: p5.Graphics): void {
    const cols = 18;
    const rows = 9;
    const spacingX = buffer.width / cols;
    const spacingY = buffer.height / rows;
    this.waves = [];
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        this.waves.push({
          x: col * spacingX,
          y: row * spacingY,
          radius: spacingY * (0.8 + Math.random() * 0.4),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noFill();
    buffer.strokeWeight(1.5);

    const energy = contextToggleEnergy(context);
    const hueBase = (context.columnIndex * 50 + energy * 120) % 360;

    this.waves.forEach((wave, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const active = toggle > 0 ? 3 : 2;
      for (let i = 0; i < active; i++) {
        const radius = wave.radius * (1 + i * 0.4 + toggle * 0.3);
        const phase = context.elapsedSeconds * (0.4 + toggle * 0.5);
        const offset = Math.sin(phase + (wave.x + wave.y) * 0.01) * radius * 0.1;
        const hue = (hueBase + i * 20 + toggle * 60) % 360;
        buffer.stroke(`hsla(${hue}, 60%, ${50 + energy * 30}%, ${0.2 + toggle * 0.35})`);
        buffer.arc(wave.x + offset, wave.y, radius * 2, radius * 2, 0, Math.PI);
      }
    });

    buffer.pop();
  }
}

export class OrientalAsanohaScene implements IScene {
  public readonly name = 'Oriental · Asanoha';
  private nodes: StarNode[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 9;
    const rows = 6;
    const spacingX = buffer.width / cols;
    const spacingY = buffer.height / rows;
    this.nodes = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const offset = (r % 2) * spacingX * 0.5;
        this.nodes.push({
          x: c * spacingX + offset,
          y: r * spacingY,
          scale: p.random(0.7, 1.2),
          offset: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noFill();
    buffer.strokeWeight(1.2);

    const energy = contextToggleEnergy(context);

    this.nodes.forEach((node, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const radius = Math.min(buffer.width, buffer.height) * 0.05 * node.scale * (1 + energy * 0.4 + toggle * 0.4);
      const hue = (context.columnIndex * 45 + index * 2 + toggle * 70) % 360;
      buffer.stroke(`hsla(${hue}, 70%, 65%, ${0.25 + toggle * 0.4})`);
      const phase = context.elapsedSeconds * (0.6 + energy * 0.5) + node.offset;
      const inner = radius * 0.4 * (1 + Math.sin(phase) * 0.3);
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 3) * a + phase * 0.2 * toggle;
        buffer.line(node.x, node.y, node.x + Math.cos(angle) * radius, node.y + Math.sin(angle) * radius);
        buffer.line(node.x, node.y, node.x + Math.cos(angle + Math.PI / 6) * inner, node.y + Math.sin(angle + Math.PI / 6) * inner);
      }
    });

    buffer.pop();
  }
}

export class OrientalKikkoScene implements IScene {
  public readonly name = 'Oriental · Kikko';
  private hexagons: Hexagon[] = [];

  setup(p: p5, buffer: p5.Graphics): void {
    const cols = 10;
    const rows = 6;
    const spacingX = buffer.width / cols;
    const spacingY = buffer.height / rows;
    this.hexagons = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const offsetX = (r % 2) * spacingX * 0.5;
        this.hexagons.push({
          x: c * spacingX + offsetX,
          y: r * spacingY,
          size: Math.min(spacingX, spacingY) * p.random(0.6, 1.0),
          rotation: p.random(Math.PI * 2),
        });
      }
    }
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    void p;
    buffer.clear();
    buffer.push();
    buffer.noFill();
    buffer.strokeWeight(1.2);

    const energy = contextToggleEnergy(context);
    const focus = contextToggleAverage(context, 0, 3);

    this.hexagons.forEach((hex, index) => {
      const toggle = contextToggleValue(context, index % 7);
      const hue = (context.columnIndex * 30 + focus * 120 + toggle * 80) % 360;
      const alpha = 0.2 + energy * 0.35 + toggle * 0.35;
      const rotation = hex.rotation + context.elapsedSeconds * (0.2 + toggle * 0.5);
      const radius = hex.size * (0.5 + energy * 0.3 + toggle * 0.2);
      buffer.stroke(`hsla(${hue}, 65%, 60%, ${alpha})`);
      buffer.beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = rotation + (i / 6) * p.TWO_PI;
        buffer.vertex(hex.x + Math.cos(angle) * radius, hex.y + Math.sin(angle) * radius);
      }
      buffer.endShape(p.CLOSE);
      if (toggle > 0) {
        buffer.stroke(`hsla(${(hue + 120) % 360}, 70%, 70%, ${alpha * 0.6})`);
        buffer.circle(hex.x, hex.y, radius * 1.2);
      }
    });

    buffer.pop();
  }
}
