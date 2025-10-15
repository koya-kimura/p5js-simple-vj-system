import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleAverage, contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';

type NeuralLink = {
  angle: number;
  radius: number;
  speed: number;
};

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
