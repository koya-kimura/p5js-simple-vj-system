import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../../core/IScene';
import { contextToggleEnergy } from '../../utils/toggleUtils';

export class UIClockPanelScene implements IScene {
  public readonly name = 'UI · Clock Panel';
  private pulse = 0;

  public setup(_p: p5, _buffer: p5.Graphics): void {
    this.pulse = 0;
  }

  public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.clear();
    this.pulse += context.deltaSeconds;
  const dim = Math.min(buffer.width, buffer.height);
  const minorScale = dim * 0.04;
    const energy = contextToggleEnergy(context, 'smooth');

    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);

    buffer.noStroke();
    buffer.fill(0, 220);
    buffer.rectMode(p.CENTER);
  buffer.rect(0, 0, dim * 0.92, dim * 0.92);

    const now = new Date();
    const timeText = now.toLocaleTimeString('ja-JP', { hour12: false });
    const dateText = now.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', weekday: 'short' });

    buffer.textAlign(p.CENTER, p.CENTER);
    buffer.textFont('monospace');
    buffer.fill(230, 250);
    buffer.textSize(dim * 0.16);
    buffer.text(timeText, 0, -dim * 0.05);

    buffer.fill(180, 240);
  buffer.textSize(minorScale * 1.1);
    buffer.text(dateText, 0, dim * 0.05);

    const pulse = 1 + Math.sin(this.pulse * 2.2) * 0.05 + energy * 0.08;
    buffer.noFill();
    buffer.strokeWeight(dim * 0.012);
    buffer.stroke(48, 200, 255, 220);
    buffer.ellipse(0, 0, dim * 0.68 * pulse, dim * 0.68 * pulse);

    const sweep = ((context.elapsedSeconds % 60) / 60) * p.TWO_PI;
    buffer.stroke(255, 180, 140, 220);
    buffer.strokeWeight(dim * 0.008);
    buffer.arc(0, 0, dim * 0.82, dim * 0.82, -p.HALF_PI, -p.HALF_PI + sweep);

    buffer.noStroke();
    buffer.fill(140, 220);
    buffer.textSize(minorScale);
    buffer.text(`ENERGY ${(energy * 100).toFixed(0)}%`, 0, dim * 0.26);

    buffer.fill(255, 220);
    buffer.textSize(minorScale * 0.85);
    const column = context.columnIndex + 1;
    const elapsed = context.elapsedSeconds.toFixed(1);
    buffer.text(`COLUMN ${column} / ${elapsed}s`, 0, dim * 0.34);

    buffer.pop();
  }
}
