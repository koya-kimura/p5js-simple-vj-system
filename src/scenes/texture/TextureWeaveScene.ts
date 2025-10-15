import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type WeaveThread = {
  x: number;
  y: number;
  width: number;
  horizontal: boolean;
  offset: number;
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
