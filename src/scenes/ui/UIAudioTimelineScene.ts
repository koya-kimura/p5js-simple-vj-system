import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy } from '../../utils/toggleUtils';

export class UIAudioTimelineScene implements IScene {
  public readonly name = 'UI · Audio Timeline';
  private readonly history: Array<{ time: number; level: number; energy: number }> = [];
  private readonly windowSeconds = 18;

  public setup(_p: p5, _buffer: p5.Graphics): void {
    this.history.length = 0;
  }

  public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    const now = context.elapsedSeconds;
    const energy = contextToggleEnergy(context, 'smooth');
    this.history.push({ time: now, level: context.audioLevel, energy });
    while (this.history.length > 0 && now - this.history[0].time > this.windowSeconds) {
      this.history.shift();
    }

    const w = buffer.width;
    const h = buffer.height;
    const baseline = h * 0.68;
    const span = Math.max(4, this.windowSeconds);
    const startTime = Math.max(0, now - span);

    buffer.push();
    buffer.noStroke();
    buffer.fill(0, 220);
    buffer.rect(0, 0, w, h);

  buffer.strokeWeight(Math.max(1, h * 0.002));
    buffer.stroke(80, 160, 220, 120);
    for (let i = 0; i <= 6; i++) {
      const x = (i / 6) * w;
      buffer.line(x, h * 0.12, x, h * 0.88);
    }
    buffer.stroke(80, 160, 220, 90);
    for (let i = 0; i <= 4; i++) {
      const y = h * 0.16 + (i / 4) * (h * 0.64);
      buffer.line(0, y, w, y);
    }

    buffer.noFill();
    buffer.stroke(48, 200, 255, 220);
  buffer.strokeWeight(Math.max(2, h * 0.006));
    buffer.beginShape();
    for (const entry of this.history) {
      if (entry.time < startTime) {
        continue;
      }
      const phase = (entry.time - startTime) / span;
      const x = phase * w;
      const y = baseline - entry.level * h * 0.5;
      buffer.vertex(x, y);
    }
    buffer.endShape();

    buffer.stroke(255, 160, 120, 200);
  buffer.strokeWeight(Math.max(1.5, h * 0.004));
    buffer.beginShape();
    for (const entry of this.history) {
      if (entry.time < startTime) {
        continue;
      }
      const phase = (entry.time - startTime) / span;
      const x = phase * w;
      const y = baseline - entry.energy * h * 0.35;
      buffer.vertex(x, y);
    }
    buffer.endShape();

  buffer.stroke(120, 200, 255, 160);
    buffer.line(0, baseline, w, baseline);

    buffer.textFont('monospace');
    buffer.textAlign(p.LEFT, p.TOP);
    buffer.fill(200, 240);
  buffer.textSize(h * 0.035);
      buffer.noStroke();
  buffer.text(`L:${(context.audioLevel * 100).toFixed(1)}%`, h * 0.035, h * 0.06);
  buffer.text(`E:${(energy * 100).toFixed(1)}%`, h * 0.035, h * 0.11);

    buffer.textAlign(p.RIGHT, p.TOP);
  buffer.text(`T-${span.toFixed(0)}s`, w - h * 0.035, h * 0.06);
  buffer.text(`NOW ${now.toFixed(1)}s`, w - h * 0.035, h * 0.11);

    buffer.textAlign(p.CENTER, p.BOTTOM);
  buffer.textSize(h * 0.032);
    buffer.fill(150, 220);
    buffer.text('AUDIO LEVEL', w * 0.5, h * 0.94);

    const ticks = 12;
  buffer.strokeWeight(Math.max(1.5, h * 0.003));
    buffer.stroke(255, 255, 255, 160);
    for (let i = 0; i <= ticks; i++) {
      const x = (i / ticks) * w;
      buffer.line(x, h * 0.88, x, h * 0.92);
    }

    buffer.pop();
  }
}
