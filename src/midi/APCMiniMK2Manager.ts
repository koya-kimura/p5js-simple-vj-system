// src/midi/APCMiniMK2Manager.ts

import { MIDIManager } from './midiManager';

const MIDI_STATUS_IN = {
  NOTE_ON: 0x90,
  CONTROL_CHANGE: 0xb0,
} as const;

const MIDI_OUTPUT_NOTE_ON = 0x96;
const MIDI_FADER_BUTTON_NOTE_ON = 0x90;
const FADER_BUTTON_ACTIVE_VELOCITY = 127; // bright white for mute latch state

const NOTE_RANGES = {
  GRID_START: 0,
  GRID_END: 63,
  FADERS_START: 48,
  FADERS_END: 56,
  FADER_BUTTONS_START: 100,
  FADER_BUTTONS_END: 107,
} as const;

const GRID_ROWS = 8;
const GRID_COLS = 8;
const MASTER_FADER_INDEX = GRID_COLS;

// Per-column active LED velocity/color (APC MK2 palette index). 8 values for 8 columns.
const COLUMN_ACTIVE_VELOCITIES: number[] = [5, 53, 60, 13, 17, 32, 33, 45];

/**
 * APC Mini MK2 のグリッドとフェーダーをシンプルに扱うためのクラス。
 * 列ごとに選択されたシーンインデックスとフェーダー値を管理する。
 */
export class APCMiniMK2Manager extends MIDIManager {
  public readonly faderValues: number[];

  private readonly columnSceneSelections: Array<number | null>;
  private readonly columnSceneCounts: number[];
  private readonly dirtyColumns: Set<number> = new Set();
  private readonly faderButtonLatch: boolean[];
  private readonly dirtyFaderButtons: Set<number> = new Set();
  private readonly rawFaderValues: number[];
  private initializationComplete = false;
  private midiAvailable = false;

  constructor() {
    super();
    this.columnSceneSelections = Array(GRID_COLS).fill(null);
    this.columnSceneCounts = Array(GRID_COLS).fill(0);
    const faderLength = GRID_COLS + 1;
    // start with all faders at 0 by default
    this.faderValues = Array(faderLength).fill(0);
    this.rawFaderValues = Array(faderLength).fill(0);
    this.faderButtonLatch = Array(GRID_COLS).fill(false);
    this.onMidiMessageCallback = this.handleMidiMessage.bind(this);
  }

  getColumnCount(): number {
    return GRID_COLS;
  }

  getColumnSceneSelection(columnIndex: number): number | null {
    return this.columnSceneSelections[columnIndex] ?? null;
  }

  getColumnSceneCount(columnIndex: number): number {
    return this.columnSceneCounts[columnIndex] ?? 0;
  }

  getFaderValue(columnIndex: number): number {
    if (columnIndex < GRID_COLS) {
      if (this.faderButtonLatch[columnIndex]) {
        return 0;
      }

      return this.faderValues[columnIndex] ?? 0;
    }

    return this.rawFaderValues[columnIndex] ?? 0;
  }

  getBackgroundFaderValue(): number {
    return this.rawFaderValues[MASTER_FADER_INDEX] ?? 0;
  }

  setColumnSceneSelection(columnIndex: number, sceneIndex: number): void {
    if (columnIndex < 0 || columnIndex >= GRID_COLS) {
      return;
    }

    const count = this.columnSceneCounts[columnIndex] ?? 0;
    if (count <= 0) {
      if (this.columnSceneSelections[columnIndex] !== null) {
        this.columnSceneSelections[columnIndex] = null;
        this.dirtyColumns.add(columnIndex);
      }
      return;
    }

    const clamped = Math.max(0, Math.min(count - 1, sceneIndex));
    const previous = this.columnSceneSelections[columnIndex];
    if (previous === clamped) {
      return;
    }

    this.columnSceneSelections[columnIndex] = clamped;
    this.dirtyColumns.add(columnIndex);
  }

  configureSceneSlots(counts: number[]): void {
    for (let column = 0; column < GRID_COLS; column++) {
  const nextCount = Math.max(0, Math.min(GRID_ROWS, counts[column] ?? 0));
      this.columnSceneCounts[column] = nextCount;

      const previousSelection = this.columnSceneSelections[column];
      let nextSelection: number | null = previousSelection;
      if (nextCount <= 0) {
        nextSelection = null;
      } else if (previousSelection == null) {
        nextSelection = 0;
      } else if (previousSelection >= nextCount) {
        nextSelection = nextCount - 1;
      }

      this.columnSceneSelections[column] = nextSelection;

      // force a refresh so the LED baseline stays in sync with the configured grid
      this.dirtyColumns.add(column);
    }
  }

  update(): void {
    this.flushPendingLedUpdates();
  }

  protected onMidiAvailabilityChanged(available: boolean): void {
    this.midiAvailable = available;
    this.initializationComplete = true;
    if (available) {
      this.clearAllLeds();
      this.refreshAllLeds();
    }
  }

  public isInitialized(): boolean {
    return this.initializationComplete;
  }

  private handleMidiMessage(event: WebMidi.MIDIMessageEvent): void {
    const [status, data1, data2] = event.data;
    const messageType = status & 0xf0;

    if (messageType === MIDI_STATUS_IN.NOTE_ON) {
      // Check if it's a fader button or grid button
      if (data1 >= NOTE_RANGES.FADER_BUTTONS_START && data1 <= NOTE_RANGES.FADER_BUTTONS_END) {
        this.handleFaderButton(data1, data2);
      } else {
        this.handleGridPress(data1, data2);
      }
    } else if (messageType === MIDI_STATUS_IN.CONTROL_CHANGE) {
      this.handleFader(data1, data2);
    }
  }

  private handleGridPress(rawNote: number, velocity: number): void {
    // Only process button press (velocity > 0), ignore release (velocity = 0)
    if (velocity === 0) {
      return;
    }

    if (rawNote < NOTE_RANGES.GRID_START || rawNote > NOTE_RANGES.GRID_END) {
      return;
    }

    const gridIndex = rawNote - NOTE_RANGES.GRID_START;
    const columnIndex = gridIndex % GRID_COLS;
    const rowFromTop = Math.floor(gridIndex / GRID_COLS);
    const rowIndex = GRID_ROWS - 1 - rowFromTop;
    const available = this.columnSceneCounts[columnIndex] ?? 0;
    if (rowIndex < available) {
      this.setColumnSceneSelection(columnIndex, rowIndex);
    }
  }

  private handleFader(controller: number, value: number): void {
    if (controller < NOTE_RANGES.FADERS_START || controller > NOTE_RANGES.FADERS_END) {
      return;
    }

    const columnIndex = controller - NOTE_RANGES.FADERS_START;
    if (columnIndex < 0 || columnIndex > MASTER_FADER_INDEX) {
      return;
    }

    const normalized = value / 127;
    this.rawFaderValues[columnIndex] = normalized;

    if (columnIndex < GRID_COLS && !this.faderButtonLatch[columnIndex]) {
      this.faderValues[columnIndex] = normalized;
    }

  }

  private handleFaderButton(rawNote: number, velocity: number): void {
    // Only process button press (velocity > 0), ignore release
    if (velocity === 0) {
      return;
    }

    const columnIndex = this.mapFaderButtonToColumn(rawNote);
    if (columnIndex == null) {
      return;
    }

    const nextState = !this.faderButtonLatch[columnIndex];
    this.faderButtonLatch[columnIndex] = nextState;
    if (nextState) {
      this.faderValues[columnIndex] = 0;
    } else {
      this.faderValues[columnIndex] = this.rawFaderValues[columnIndex];
    }

    const velocityValue = nextState ? FADER_BUTTON_ACTIVE_VELOCITY : 0;
    this.sendMessage([MIDI_FADER_BUTTON_NOTE_ON, rawNote, velocityValue]);
    this.dirtyFaderButtons.add(columnIndex);
  }

  private flushPendingLedUpdates(): void {
    if (!this.midiAvailable) {
      return;
    }

    if (this.dirtyColumns.size > 0) {
      this.dirtyColumns.forEach((column) => this.renderColumnLeds(column));
      this.dirtyColumns.clear();
    }

    if (this.dirtyFaderButtons.size > 0) {
      this.dirtyFaderButtons.forEach((column) => this.renderFaderButtonLed(column));
      this.dirtyFaderButtons.clear();
    }
  }

  private refreshAllLeds(): void {
    if (!this.midiAvailable) {
      return;
    }

    for (let column = 0; column < GRID_COLS; column++) {
      this.renderColumnLeds(column);
      this.renderFaderButtonLed(column);
    }
  }

  private renderColumnLeds(column: number): void {
    const selectedRow = this.columnSceneSelections[column];
    const sceneCount = this.columnSceneCounts[column] ?? 0;

    for (let row = 0; row < GRID_ROWS; row++) {
      const gridIndex = (GRID_ROWS - 1 - row) * GRID_COLS + column;
      const note = NOTE_RANGES.GRID_START + gridIndex;

      if (row < sceneCount) {
        const isActive = selectedRow === row;
        const velocity = isActive ? COLUMN_ACTIVE_VELOCITIES[column] ?? 50 : 3;
        this.sendMessage([MIDI_OUTPUT_NOTE_ON, note, velocity]);
      } else {
        this.sendMessage([MIDI_OUTPUT_NOTE_ON, note, 0]);
      }
    }
  }

  private renderFaderButtonLed(column: number): void {
    const note = this.getFaderButtonNote(column);
    if (note == null) {
      return;
    }

    const velocity = this.faderButtonLatch[column] ? FADER_BUTTON_ACTIVE_VELOCITY : 0;
    this.sendMessage([MIDI_FADER_BUTTON_NOTE_ON, note, velocity]);
  }

  // Optional helper to change the per-column active LED velocity at runtime
  public setColumnActiveVelocity(column: number, velocity: number): void {
    if (column < 0 || column >= GRID_COLS) return;
    COLUMN_ACTIVE_VELOCITIES[column] = velocity;
    this.dirtyColumns.add(column);
  }

  public isMidiConnected(): boolean {
    return this.midiAvailable;
  }

  private clearAllLeds(): void {
    for (let column = 0; column < GRID_COLS; column++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const gridIndex = row * GRID_COLS + column;
        const note = NOTE_RANGES.GRID_START + gridIndex;
        this.sendMessage([MIDI_OUTPUT_NOTE_ON, note, 0]);
      }
    }

    for (let column = 0; column < GRID_COLS; column++) {
      const note = this.getFaderButtonNote(column);
      if (note != null) {
        this.sendMessage([MIDI_FADER_BUTTON_NOTE_ON, note, 0]);
      }
    }
  }

  private mapFaderButtonToColumn(rawNote: number): number | null {
    if (rawNote < NOTE_RANGES.FADER_BUTTONS_START || rawNote > NOTE_RANGES.FADER_BUTTONS_END) {
      return null;
    }

    const columnIndex = rawNote - NOTE_RANGES.FADER_BUTTONS_START;
    return columnIndex >= 0 && columnIndex < GRID_COLS ? columnIndex : null;
  }

  private getFaderButtonNote(columnIndex: number): number | null {
    if (columnIndex < 0 || columnIndex >= GRID_COLS) {
      return null;
    }

    return NOTE_RANGES.FADER_BUTTONS_START + columnIndex;
  }
}