import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type Wave = {
  x: number;
  y: number;
  radius: number;
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
