import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type Hexagon = {
  x: number;
  y: number;
  size: number;
  rotation: number;
};

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
