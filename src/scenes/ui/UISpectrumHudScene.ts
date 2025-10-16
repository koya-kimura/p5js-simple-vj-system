import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy } from '../../utils/toggleUtils';

export class UISpectrumHudScene implements IScene {
  public readonly name = 'UI · Spectrum HUD';
  private sweep = 0;

  public setup(_p: p5, _buffer: p5.Graphics): void {
    this.sweep = 0;
  }

  public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    this.sweep += context.deltaSeconds;
    const w = buffer.width;
    const h = buffer.height;
    const spectrum = context.audioSpectrum;
    const bins = spectrum.length || 1;
    const energy = contextToggleEnergy(context, 'smooth');

    buffer.push();
    buffer.noStroke();
    buffer.fill(0, 220);
    buffer.rect(0, 0, w, h);

  buffer.strokeWeight(Math.max(1.5, h * 0.003));
    buffer.stroke(60, 160, 220, 160);
    const gridRows = 5;
    for (let i = 0; i <= gridRows; i++) {
      const y = h * 0.15 + (i / gridRows) * h * 0.5;
      buffer.line(w * 0.08, y, w * 0.92, y);
    }

    const bandWidth = (w * 0.84) / bins;
    const baseX = w * 0.08;
    buffer.translate(baseX, h * 0.15);
    buffer.noFill();

    buffer.stroke(48, 200, 255, 220);
    buffer.beginShape();
    for (let i = 0; i < bins; i++) {
      const value = spectrum[i] ?? 0;
      const x = bandWidth * i + bandWidth * 0.5;
      const y = (1 - value) * h * 0.5;
      buffer.vertex(x, y);
    }
    buffer.endShape();

    buffer.stroke(255, 180, 140, 200);
    buffer.beginShape();
    for (let i = 0; i < bins; i++) {
      const value = spectrum[i] ?? 0;
      const x = bandWidth * i + bandWidth * 0.5;
      const y = h * 0.5 + value * h * 0.25;
      buffer.vertex(x, y);
    }
    buffer.endShape();

    buffer.noStroke();
    for (let i = 0; i < bins; i++) {
      const value = spectrum[i] ?? 0;
      const pulse = 0.6 + Math.sin(this.sweep * 3 + i * 0.3) * 0.25;
      const bar = value * h * 0.48;
      const x = bandWidth * i + bandWidth * 0.5;
      buffer.fill(80 + value * 120, 220 - value * 40, 255, 140 + value * 80);
  buffer.rect(x - bandWidth * 0.3, h * 0.5 - bar, bandWidth * 0.6, bar);
      buffer.fill(255, 220);
      buffer.ellipse(x, h * 0.5 + bar * 0.2, bandWidth * 0.2 * pulse, bandWidth * 0.2 * pulse);
    }

    buffer.pop();

    const low = this.sampleBand(spectrum, 0, Math.max(4, Math.floor(bins * 0.15)));
    const mid = this.sampleBand(spectrum, Math.floor(bins * 0.3), Math.max(4, Math.floor(bins * 0.2)));
    const high = this.sampleBand(spectrum, Math.floor(bins * 0.65), Math.max(4, Math.floor(bins * 0.2)));

  buffer.textFont('monospace');
  buffer.textSize(h * 0.042);
    buffer.fill(220, 240);
    buffer.textAlign(p.LEFT, p.BOTTOM);
    buffer.text(`LOW ${(low * 100).toFixed(0)}%`, w * 0.08, h * 0.96);
    buffer.text(`MID ${(mid * 100).toFixed(0)}%`, w * 0.38, h * 0.96);
    buffer.text(`HIGH ${(high * 100).toFixed(0)}%`, w * 0.68, h * 0.96);

  buffer.textAlign(p.CENTER, p.TOP);
  buffer.textSize(h * 0.036);
    buffer.fill(150, 220);
    buffer.text(`ENERGY ${(energy * 100).toFixed(0)}%`, w * 0.5, h * 0.02);

  buffer.textAlign(p.RIGHT, p.TOP);
  buffer.textSize(h * 0.032);
    buffer.fill(180, 230);
    buffer.text(context.audioDebug ? 'SOURCE DEBUG' : 'SOURCE LIVE', w * 0.94, h * 0.02);

    buffer.pop();
  }

  private sampleBand(values: readonly number[], start: number, count: number): number {
    if (values.length === 0 || count <= 0) {
      return 0;
    }
    let sum = 0;
    let taken = 0;
    for (let i = 0; i < count; i++) {
      const idx = start + i;
      if (idx >= 0 && idx < values.length) {
        sum += values[idx];
        taken++;
      }
    }
    return taken > 0 ? sum / taken : 0;
  }
}
