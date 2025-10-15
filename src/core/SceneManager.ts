// src/core/SceneManager.ts

import p5 from 'p5';
import type { SceneConstructor, SceneLibraryGrid } from './SceneLibrary';
import { GRID_ROWS } from './SceneLibrary';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import type { IScene, SceneDrawContext } from './IScene';

interface ColumnState {
    buffer: p5.Graphics;
    constructors: SceneConstructor[];
    sceneIndex: number | null;
    scene: IScene | null;
}

export class SceneManager {
    private readonly apcManager: APCMiniMK2Manager;
    private readonly sceneLibrary: SceneLibraryGrid;
    private columns: ColumnState[] = [];
    private elapsedSeconds = 0;
    private keyboardOverrideActive = true;
    private keyboardOverrideColumn: number | null = null;
    private debugOverlayActive = false;
    private lastVisibleColumnCount = 0;
    private readonly toggleStates: number[] = Array(7).fill(0);
    private readonly toggleSmoothStates: number[] = Array(7).fill(0);
    private readonly toggleSmoothingDuration = 0.2;
    private audioLevel = 0;
    private audioDebugMode = false;
    private audioSpectrum: readonly number[] = [];

    constructor(apcManager: APCMiniMK2Manager, sceneLibrary: SceneLibraryGrid) {
        this.apcManager = apcManager;
        this.sceneLibrary = sceneLibrary;
    }

    setup(p: p5): void {
        this.columns = [];
        this.elapsedSeconds = 0;
        const columnCount = this.apcManager.getColumnCount();

        const columnConstructors: SceneConstructor[][] = Array.from({ length: columnCount }, (_, columnIndex) =>
            (this.sceneLibrary[columnIndex] ?? []).slice(0, GRID_ROWS),
        );

        const columnSceneCounts = columnConstructors.map((constructors) => constructors.length);
        this.apcManager.configureSceneSlots(columnSceneCounts);

        this.columns = columnConstructors.map((constructors, columnIndex) => {
            const buffer = this.createBuffer(p);
            const sceneIndex = this.apcManager.getColumnSceneSelection(columnIndex);
            const scene = this.instantiateScene(constructors, sceneIndex);
            if (scene) {
                scene.setup(p, buffer, columnIndex);
            }
            return { buffer, constructors, sceneIndex, scene };
        });
    }

    update(
        p: p5,
        deltaSeconds: number,
        audioLevel: number,
        audioDebugMode: boolean,
        audioSpectrum: readonly number[],
    ): void {
    this.elapsedSeconds += deltaSeconds;
    this.audioLevel = Math.max(0, Math.min(1, audioLevel));
    this.audioDebugMode = audioDebugMode;
    this.audioSpectrum = audioSpectrum.slice();
        this.apcManager.update();

        const smoothingDuration = this.toggleSmoothingDuration;
        if (smoothingDuration <= 0) {
            for (let i = 0; i < this.toggleSmoothStates.length; i++) {
                this.toggleSmoothStates[i] = this.toggleStates[i];
            }
        } else if (deltaSeconds > 0) {
            const blend = Math.min(1, deltaSeconds / smoothingDuration);
            for (let i = 0; i < this.toggleSmoothStates.length; i++) {
                const current = this.toggleSmoothStates[i];
                const target = this.toggleStates[i];
                this.toggleSmoothStates[i] = current + (target - current) * blend;
            }
        }

        const isMidiConnected = this.apcManager.isMidiConnected();
        if (isMidiConnected) {
            if (this.keyboardOverrideActive) {
                this.keyboardOverrideActive = false;
                this.keyboardOverrideColumn = null;
            }
        } else if (!this.keyboardOverrideActive) {
            this.keyboardOverrideActive = true;
            this.keyboardOverrideColumn = null;
        }

        const hasKeyboardOverride = !isMidiConnected && this.keyboardOverrideActive;
        const activeColumn = hasKeyboardOverride ? this.keyboardOverrideColumn : null;

        for (let columnIndex = 0; columnIndex < this.columns.length; columnIndex++) {
            const slot = this.columns[columnIndex];
            const selectedIndex = this.apcManager.getColumnSceneSelection(columnIndex);

            if (selectedIndex !== slot.sceneIndex) {
                slot.sceneIndex = selectedIndex;
                slot.scene = this.instantiateScene(slot.constructors, selectedIndex);
                if (slot.scene) {
                    slot.scene.setup(p, slot.buffer, columnIndex);
                }
            }

            if (!slot.scene) {
                slot.buffer.clear();
                continue;
            }

            let effectiveAlpha: number;
            if (hasKeyboardOverride) {
                effectiveAlpha = activeColumn === columnIndex ? 1 : 0;
            } else {
                const rawAlpha = this.apcManager.getFaderValue(columnIndex);
                effectiveAlpha = rawAlpha <= 0 && !isMidiConnected ? 1 : rawAlpha;
            }
            if (effectiveAlpha <= 0) {
                continue;
            }

            slot.buffer.clear();
            const context: SceneDrawContext = {
                columnIndex,
                elapsedSeconds: this.elapsedSeconds,
                deltaSeconds,
                toggles: this.toggleStates,
                togglesSmooth: this.toggleSmoothStates,
                audioLevel: this.audioLevel,
                audioDebug: this.audioDebugMode,
                audioSpectrum: this.audioSpectrum,
            };
            slot.scene.draw(p, slot.buffer, context);
        }
    }

    composite(p: p5): void {
        this.applyBackground(p);

        if (!this.apcManager.isInitialized()) {
            return;
        }

        const isMidiConnected = this.apcManager.isMidiConnected();
        const hasKeyboardOverride = !isMidiConnected && this.keyboardOverrideActive;
        const activeColumn = hasKeyboardOverride ? this.keyboardOverrideColumn : null;

        const ctx = p.drawingContext as CanvasRenderingContext2D;
        const previousAlpha = ctx.globalAlpha;

        let visibleColumns = 0;
        for (let columnIndex = 0; columnIndex < this.columns.length; columnIndex++) {
            const slot = this.columns[columnIndex];
            if (!slot.scene) {
                continue;
            }

            let alpha: number;
            if (hasKeyboardOverride) {
                alpha = activeColumn === columnIndex ? 1 : 0;
            } else {
                alpha = this.apcManager.getFaderValue(columnIndex);
                if (alpha <= 0 && !isMidiConnected) {
                    alpha = 1;
                }
            }
            if (alpha <= 0) {
                continue;
            }

            visibleColumns++;
            ctx.globalAlpha = alpha;
            p.image(slot.buffer, 0, 0, p.width, p.height);
        }

        this.lastVisibleColumnCount = visibleColumns;

        ctx.globalAlpha = previousAlpha;

        this.drawDebugOverlay(p);
    }

    private applyBackground(p: p5): void {
        const rawValue = this.apcManager.getBackgroundFaderValue();
        const clamped = Math.max(0, Math.min(1, rawValue));
        const alpha = Math.round((1 - clamped) * 255);
        p.background(0, 0, 0, alpha);
    }

    resize(p: p5): void {
        for (let columnIndex = 0; columnIndex < this.columns.length; columnIndex++) {
            const slot = this.columns[columnIndex];
            slot.buffer = this.createBuffer(p);
            if (slot.scene) {
                slot.scene.setup(p, slot.buffer, columnIndex);
            }
        }
    }

    public toggleDebugOverlay(): void {
        this.debugOverlayActive = !this.debugOverlayActive;
    }

    private getSceneDebugName(slot: ColumnState, selection: number | null): string {
        if (slot.scene) {
            const maybeNamed = (slot.scene as { name?: unknown }).name;
            if (typeof maybeNamed === 'string' && maybeNamed.trim().length > 0) {
                return maybeNamed;
            }

            const proto = Object.getPrototypeOf(slot.scene);
            const ctorName = proto?.constructor?.name;
            if (typeof ctorName === 'string' && ctorName.length > 0) {
                return ctorName;
            }
        }

        if (selection != null) {
            const SceneCtor = slot.constructors[selection];
            if (SceneCtor) {
                return SceneCtor.name;
            }
        }

        return '—';
    }

    private drawDebugOverlay(p: p5): void {
        if (!this.debugOverlayActive) {
            return;
        }

        p.push();

        const margin = Math.max(12, Math.min(32, p.width * 0.03));
        const textSize = Math.max(12, Math.min(24, p.width * 0.015));
        const lineHeight = textSize * 1.35;
        const isMidiConnected = this.apcManager.isMidiConnected();
        const backgroundValue = this.apcManager.getBackgroundFaderValue();
        const keyboardStatus = this.keyboardOverrideActive
            ? this.keyboardOverrideColumn != null
                ? `col ${this.keyboardOverrideColumn + 1}`
                : 'none'
            : 'inactive';

        const totalSceneSlots = this.columns.reduce((sum, slot) => sum + slot.constructors.length, 0);

        const lines: string[] = [
            `Canvas: ${p.width}×${p.height}`,
            `FrameRate: ${p.frameRate().toFixed(1)} fps`,
            `Elapsed: ${this.elapsedSeconds.toFixed(1)} s`,
            `MIDI Connected: ${isMidiConnected ? 'yes' : 'no'}`,
            `Keyboard Override: ${keyboardStatus}`,
            `Background Fader: ${backgroundValue.toFixed(2)}`,
            `Visible Columns: ${this.lastVisibleColumnCount}`,
            `Scene Slots: ${totalSceneSlots}`,
        ];

        const toggleKeys = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];
        const toggleSegments = toggleKeys.map((label, index) => {
            const value = this.toggleStates[index] ?? 0;
            return `${label}:${value.toFixed(0)}`;
        });
        lines.push(`Toggles: ${toggleSegments.join(' ')}`);

        const smoothSegments = toggleKeys.map((label, index) => {
            const value = this.toggleSmoothStates[index] ?? 0;
            return `${label}:${value.toFixed(2)}`;
        });
    lines.push(`Toggles Smooth (0.2s): ${smoothSegments.join(' ')}`);
    lines.push(`Audio Level (norm): ${this.audioLevel.toFixed(3)} (${this.audioDebugMode ? 'debug' : 'live'})`);
        lines.push(`Audio Source: ${this.audioDebugMode ? 'debug noise' : 'microphone'}`);
        if (this.audioSpectrum.length > 0) {
            const low = this.audioSpectrum[0] ?? 0;
            const mid = this.audioSpectrum[Math.floor(this.audioSpectrum.length / 2)] ?? 0;
            const high = this.audioSpectrum[this.audioSpectrum.length - 1] ?? 0;
            lines.push(`Spectrum Low/Mid/High (norm): ${low.toFixed(2)} / ${mid.toFixed(2)} / ${high.toFixed(2)}`);
        }

        for (let columnIndex = 0; columnIndex < this.columns.length; columnIndex++) {
            const slot = this.columns[columnIndex];
            const selection = this.apcManager.getColumnSceneSelection(columnIndex);
            const count = this.apcManager.getColumnSceneCount(columnIndex);
            const alpha = !isMidiConnected && this.keyboardOverrideActive
                ? (this.keyboardOverrideColumn === columnIndex ? 1 : 0)
                : this.apcManager.getFaderValue(columnIndex);
            const sceneName = this.getSceneDebugName(slot, selection);
            const selectionLabel = selection != null ? `${selection + 1}` : '—';
            lines.push(`Col ${columnIndex + 1}: sel ${selectionLabel}/${count}, α ${alpha.toFixed(2)}, ${sceneName}`);
        }

        p.textFont('monospace');
        p.textSize(textSize);
        p.textAlign(p.RIGHT, p.BASELINE);

        let maxWidth = 0;
        for (const line of lines) {
            maxWidth = Math.max(maxWidth, p.textWidth(line));
        }

        const totalHeight = lineHeight * lines.length;
        const x = p.width - margin;
        const y = p.height - margin;

        p.rectMode(p.CORNERS);
        p.noStroke();
        p.fill(0, 180);
        p.rect(
            x - maxWidth - margin * 0.6,
            y - totalHeight - margin * 0.6,
            x + margin * 0.4,
            y + margin * 0.4,
            8,
        );

        p.fill(255);
        let cursorY = y - totalHeight + lineHeight * 0.5;
        for (const line of lines) {
            p.text(line, x, cursorY);
            cursorY += lineHeight;
        }

        p.pop();
    }

    private createBuffer(p: p5): p5.Graphics {
        const buffer = p.createGraphics(p.width, p.height);
        buffer.pixelDensity(p.pixelDensity());
        buffer.clear();
        return buffer;
    }

    private instantiateScene(constructors: SceneConstructor[], index: number | null): IScene | null {
        if (index == null) {
            return null;
        }

        const SceneCtor = constructors[index];
        if (!SceneCtor) {
            return null;
        }
        return new SceneCtor();
    }

    public handleKeyboardSelection(columnIndex: number | null): void {
        if (this.apcManager.isMidiConnected()) {
            return;
        }

        this.keyboardOverrideActive = true;
        this.keyboardOverrideColumn = columnIndex;
        if (columnIndex != null) {
            this.apcManager.setColumnSceneSelection(columnIndex, 0);
        }
    }

    public cycleKeyboardSelection(columnIndex: number): void {
        if (this.apcManager.isMidiConnected()) {
            return;
        }

        const sceneCount = this.apcManager.getColumnSceneCount(columnIndex);
        if (sceneCount <= 0) {
            this.keyboardOverrideActive = true;
            this.keyboardOverrideColumn = null;
            return;
        }

        const current = this.apcManager.getColumnSceneSelection(columnIndex) ?? -1;
        const nextIndex = (current + 1) % sceneCount;
        this.apcManager.setColumnSceneSelection(columnIndex, nextIndex);
        this.keyboardOverrideActive = true;
        this.keyboardOverrideColumn = columnIndex;
    }

    public resetBeat(): void {
        this.elapsedSeconds = 0;
        this.columns.forEach((column) => {
            column.sceneIndex = null;
            column.scene = null;
        });
    }

    public toggleParameter(index: number): void {
        if (index < 0 || index >= this.toggleStates.length) {
            return;
        }
        this.toggleStates[index] = this.toggleStates[index] > 0 ? 0 : 1;
    }

    public setParameter(index: number, active: boolean): void {
        if (index < 0 || index >= this.toggleStates.length) {
            return;
        }
        this.toggleStates[index] = active ? 1 : 0;
    }

    public getToggleStates(): readonly number[] {
        return this.toggleStates;
    }

    public getSmoothedToggleStates(): readonly number[] {
        return this.toggleSmoothStates;
    }
}