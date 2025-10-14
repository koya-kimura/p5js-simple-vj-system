import p5 from 'p5';
import type { IScene, SceneDrawContext } from '../core/IScene';

interface CollageBlock {
    x: number;
    y: number;
    width: number;
    height: number;
    hue: number;
    alpha: number;
    angle: number;
}

export class PhotoPulseCollageScene implements IScene {
    public readonly name = 'Photo Pulse Collage';

    private blocks: CollageBlock[] = [];
    private colorShift = 0;

    public setup(p: p5, buffer: p5.Graphics, columnIndex: number): void {
        this.seedBlocks(p, buffer.width, buffer.height, columnIndex);
    }

    public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
        this.ensureBlockCount(p, buffer, context.columnIndex);

        buffer.push();
        buffer.colorMode(p.HSB, 360, 100, 100, 1);
        buffer.noStroke();

        const time = context.elapsedSeconds;
        const pulse = 0.4 + 0.6 * Math.sin(time * Math.PI * 0.5 + context.columnIndex);
        this.colorShift = (this.colorShift + context.deltaSeconds * 20) % 360;

        this.blocks.forEach((block, index) => {
            const wobble = 0.02 * Math.sin(time * 2 + index * 0.7);
            const scalePulse = 1 + 0.15 * Math.sin(time * 1.5 + index);
            const centerX = buffer.width * 0.5 + (block.x - buffer.width * 0.5) * (1 + wobble);
            const centerY = buffer.height * 0.5 + (block.y - buffer.height * 0.5) * (1 + wobble);
            const drawWidth = block.width * scalePulse;
            const drawHeight = block.height * scalePulse;

            const hue = (block.hue + this.colorShift + pulse * 90) % 360;
            const brightness = 80 + 20 * Math.sin(time * 0.8 + index * 0.3);

            buffer.push();
            buffer.translate(centerX, centerY);
            buffer.rotate(block.angle + wobble * 3);
            buffer.fill(hue, 80, brightness, block.alpha * (0.7 + 0.3 * pulse));
            buffer.rect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight, Math.min(drawWidth, drawHeight) * 0.08);
            buffer.pop();
        });

        buffer.pop();
        buffer.colorMode(buffer.RGB, 255, 255, 255, 255);
    }

    private ensureBlockCount(p: p5, buffer: p5.Graphics, columnIndex: number): void {
        if (this.blocks.length === 0) {
            this.seedBlocks(p, buffer.width, buffer.height, columnIndex);
            return;
        }

        const expected = 9;
        if (this.blocks.length !== expected) {
            this.seedBlocks(p, buffer.width, buffer.height, columnIndex);
        }
    }

    private seedBlocks(p: p5, width: number, height: number, columnIndex: number): void {
        const seed = columnIndex * 997 + width * 13 + height * 17 + Math.floor(p.millis());
        p.randomSeed(seed);

        const cols = 3;
        const rows = 3;
        const margin = Math.min(width, height) * 0.08;
        const cellW = (width - margin * 2) / cols;
        const cellH = (height - margin * 2) / rows;

        this.blocks = new Array(cols * rows).fill(null).map((_, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const baseX = margin + col * cellW + cellW / 2;
            const baseY = margin + row * cellH + cellH / 2;
            const jitterX = p.random(-cellW * 0.2, cellW * 0.2);
            const jitterY = p.random(-cellH * 0.2, cellH * 0.2);
            const blockW = cellW * p.random(0.7, 1.2);
            const blockH = cellH * p.random(0.7, 1.2);
            const hue = (columnIndex * 45 + index * 30 + p.random(-20, 20)) % 360;
            const alpha = p.random(0.45, 0.9);
            const angle = p.random(-p.PI / 8, p.PI / 8);

            return {
                x: baseX + jitterX,
                y: baseY + jitterY,
                width: blockW,
                height: blockH,
                hue,
                alpha,
                angle,
            };
        });
    }
}
