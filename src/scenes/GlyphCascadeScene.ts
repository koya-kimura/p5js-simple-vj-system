// src/scenes/GlyphCascadeScene.ts

import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../core/IScene';

interface FallingGlyph {
  x: number;
  y: number;
  speed: number;
  size: number;
  char: string;
}

const GLYPH_SET = ['I', 'D', 'V', 'J', '★', '＋', '□', '◎'];

export class GlyphCascadeScene implements IScene {
  public readonly name = 'Glyph Cascade';
  private glyphs: FallingGlyph[] = [];

  setup(_p: p5, buffer: p5.Graphics, columnIndex: number): void {
    // initialize a small number of glyphs per column (simple independent streams)
    const count = Math.max(8, Math.floor(buffer.width / 80));
    this.glyphs = Array.from({ length: count }, (_, i) => ({
      x: (i + 0.5) * (buffer.width / count),
      y: Math.random() * buffer.height,
      speed: buffer.height * (0.12 + Math.random() * 0.18),
      size: Math.max(14, buffer.width * 0.02),
      char: GLYPH_SET[(i + columnIndex) % GLYPH_SET.length],
    }));
  }

  draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
    buffer.push();
    buffer.textAlign(p.CENTER, p.CENTER);
    buffer.textFont('monospace');
    buffer.noStroke();
    buffer.colorMode(p.HSB, 360, 100, 100, 1);

    this.glyphs.forEach((glyph, i) => {
      glyph.y += glyph.speed * context.deltaSeconds;
      if (glyph.y - glyph.size > buffer.height) {
        glyph.y = -glyph.size * 2 - Math.random() * 80;
        glyph.x = Math.random() * buffer.width;
      }

      const hue = (context.columnIndex * 40 + i * 12) % 360;
      const alpha = 0.5 + 0.5 * Math.sin(context.elapsedSeconds * 2 + i);

      buffer.fill(hue, 80, 70, alpha);
      buffer.textSize(glyph.size);
      buffer.text(glyph.char, glyph.x, glyph.y);
    });

    buffer.pop();
    buffer.colorMode(p.RGB, 255, 255, 255, 255);
  }
}
