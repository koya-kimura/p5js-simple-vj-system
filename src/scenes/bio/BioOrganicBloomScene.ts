import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type BloomNode = {
  baseRadius: number;
  speed: number;
  offset: number;
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
    buffer.clear();
    buffer.push();
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
