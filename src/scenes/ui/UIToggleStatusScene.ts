import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleValue, contextToggleEnergy } from '../../utils/toggleUtils';

export class UIToggleStatusScene implements IScene {
  public readonly name = 'UI · Toggle Monitor';
  private phase = 0;

  public setup(_p: p5, _buffer: p5.Graphics): void {
    this.phase = 0;
  }

  public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    this.phase += context.deltaSeconds;
    const w = buffer.width;
    const h = buffer.height;
    const keys: Array<'Z' | 'X' | 'C' | 'V' | 'B' | 'N' | 'M'> = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];
    const toggles = keys.map((key) => contextToggleValue(context, key, 'smooth'));
    const energy = contextToggleEnergy(context, 'smooth');
    const audio = context.audioLevel;

    buffer.push();
    buffer.noStroke();
    buffer.fill(0, 220);
    buffer.rect(0, 0, w, h);

  buffer.translate(w * 0.1, h * 0.1);
  const innerW = w * 0.8;
  const innerH = h * 0.8;
  const minorScale = Math.min(innerW, innerH) * 0.045;

    buffer.fill(20, 200);
  buffer.rect(0, 0, innerW, innerH);

    const barWidth = innerW / keys.length;
    buffer.textFont('monospace');
    buffer.textAlign(p.CENTER, p.CENTER);

    for (let i = 0; i < keys.length; i++) {
      const value = toggles[i];
      const x = barWidth * i + barWidth * 0.5;
      const heightFactor = Math.max(0.12, value * 0.72);
      const barHeight = innerH * heightFactor;
      const energyBlend = energy * 120;
      buffer.fill(60 + energyBlend, 180 + value * 60, 255 - energyBlend, 220);
      buffer.rect(x - barWidth * 0.28, innerH - barHeight, barWidth * 0.56, barHeight);

      buffer.fill(220, 240);
      buffer.textSize(minorScale);
      buffer.text(keys[i], x, innerH + innerH * 0.06);

      buffer.textSize(minorScale * 0.75);
      buffer.fill(150, 230);
      buffer.text(value.toFixed(2), x, innerH - barHeight - innerH * 0.06);
    }

    const gaugeRadius = Math.min(innerW, innerH) * 0.26;
    buffer.push();
    buffer.translate(innerW * 0.5, innerH * 0.4);
    buffer.noFill();
    buffer.stroke(255, 200);
    buffer.strokeWeight(gaugeRadius * 0.08);
    const sweep = audio * p.TWO_PI;
    buffer.arc(0, 0, gaugeRadius * 2, gaugeRadius * 2, -p.HALF_PI, -p.HALF_PI + sweep);

    buffer.stroke(48, 200, 255, 200);
    buffer.strokeWeight(gaugeRadius * 0.02);
    const markerCount = 24;
    for (let i = 0; i < markerCount; i++) {
      const angle = (i / markerCount) * p.TWO_PI - p.HALF_PI;
      const inner = gaugeRadius * 0.72;
      const outer = gaugeRadius * 0.9;
      buffer.line(inner * Math.cos(angle), inner * Math.sin(angle), outer * Math.cos(angle), outer * Math.sin(angle));
    }

    buffer.noStroke();
    buffer.fill(230, 250);
    buffer.textSize(gaugeRadius * 0.45);
    buffer.textAlign(p.CENTER, p.CENTER);
    buffer.text((audio * 100).toFixed(0), 0, -gaugeRadius * 0.05);
    buffer.textSize(gaugeRadius * 0.22);
    buffer.fill(160, 230);
    buffer.text('LEVEL', 0, gaugeRadius * 0.3);
    buffer.pop();

    buffer.fill(150, 230);
    buffer.textSize(minorScale * 0.8);
    buffer.textAlign(p.LEFT, p.CENTER);
    buffer.text(`ENERGY ${(energy * 100).toFixed(1)}%`, innerW * 0.04, innerH * 0.1);
    buffer.text(`DEBUG ${context.audioDebug ? 'NOISE' : 'LIVE'}`, innerW * 0.04, innerH * 0.16);

    const scan = (Math.sin(this.phase * 1.4) + 1) * 0.5;
    buffer.fill(48, 200, 255, 90);
    buffer.rect(0, innerH * scan, innerW, innerH * 0.06);

    buffer.pop();
  }
}
