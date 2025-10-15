import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type Meteor = {
  x: number;
  y: number;
  speed: number;
  length: number;
};

export class SkyMeteorShowerScene implements IScene {
  public readonly name = 'Sky · Meteor Shower';
  private meteors: Meteor[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    const count = 28;
    this.meteors = Array.from({ length: count }, () => ({
      x: Math.random() * buffer.width,
      y: Math.random() * buffer.height,
      speed: 0.35 + Math.random() * 0.6,
      length: buffer.width * (0.04 + Math.random() * 0.08 + columnIndex * 0.005),
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    buffer.push();
    buffer.strokeWeight(2.2);
    buffer.strokeCap(p.SQUARE);

    const energy = contextToggleEnergy(context);
    const wind = contextToggleAverage(context, 0, 3);

    this.meteors.forEach((meteor, index) => {
      const toggle = contextToggleValue(context, index % 7);
      meteor.x += meteor.speed * buffer.width * context.deltaSeconds * (1 + wind * 1.2 + toggle * 0.8);
      meteor.y += meteor.speed * buffer.height * context.deltaSeconds * (0.3 + energy * 0.5 + toggle * 0.6);
      if (meteor.x > buffer.width + meteor.length || meteor.y > buffer.height + meteor.length) {
        meteor.x = -meteor.length - Math.random() * buffer.width * 0.3;
        meteor.y = Math.random() * buffer.height * 0.5;
      }
      const hue = (context.columnIndex * 35 + index * 4 + toggle * 60) % 360;
      const alpha = 0.2 + energy * 0.3 + toggle * 0.4;
      buffer.stroke(`hsla(${hue}, 90%, 70%, ${alpha})`);
      buffer.line(meteor.x, meteor.y, meteor.x - meteor.length, meteor.y - meteor.length * 0.4);
    });

    buffer.pop();
  }
}
