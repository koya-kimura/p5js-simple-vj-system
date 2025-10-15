// src/midi/APCMiniMK2Manager.ts

import { GRID_COLUMNS, GRID_ROWS } from '../core/SceneLibrary';
import { MIDIManager } from './midiManager';

// APC Mini MK2が送出するステータスバイト種別。
const MIDI_STATUS_IN = {
  NOTE_ON: 0x90,
  CONTROL_CHANGE: 0xb0,
} as const;

const MIDI_OUTPUT_NOTE_ON = 0x96;
const MIDI_FADER_BUTTON_NOTE_ON = 0x90;
const FADER_BUTTON_ACTIVE_VELOCITY = 127; // bright white for mute latch state

const GRID_NOTE_COUNT = GRID_COLUMNS * GRID_ROWS;

// グリッド、フェーダー、ラッチボタンが占有するノート/CC範囲。
const NOTE_RANGES = {
  GRID_START: 0,
  GRID_END: GRID_NOTE_COUNT - 1,
  FADERS_START: 48,
  FADERS_END: 48 + GRID_COLUMNS,
  FADER_BUTTONS_START: 100,
  FADER_BUTTONS_END: 100 + GRID_COLUMNS - 1,
} as const;

const MASTER_FADER_INDEX = GRID_COLUMNS;

// Per-column active LED velocity/color (APC MK2 palette index). 8 values for 8 columns.
const DEFAULT_COLUMN_ACTIVE_VELOCITIES: readonly number[] = [5, 53, 60, 13, 17, 32, 33, 45];

/**
 * APC Mini MK2のグリッドとフェーダーをシンプルに扱うためのクラス。
 * 列ごとに選択されたシーンインデックスとフェーダー値を管理する。
 */
export class APCMiniMK2Manager extends MIDIManager {
  private readonly faderValues: number[];

  private readonly columnSceneSelections: Array<number | null>;
  private readonly columnSceneCounts: number[];
  private readonly dirtyColumns: Set<number> = new Set();
  private readonly faderButtonLatch: boolean[];
  private readonly dirtyFaderButtons: Set<number> = new Set();
  private readonly rawFaderValues: number[];
  private readonly columnActiveVelocities: number[];
  private initializationComplete = false;
  private midiAvailable = false;

  // 内部状態のバッファーをデバイス仕様に合わせて確保する。
  constructor() {
    super();
    this.columnSceneSelections = Array.from({ length: GRID_COLUMNS }, () => null);
    this.columnSceneCounts = Array(GRID_COLUMNS).fill(0);
    const faderLength = GRID_COLUMNS + 1;
    // start with all faders at 0 by default
    this.faderValues = Array(faderLength).fill(0);
    this.rawFaderValues = Array(faderLength).fill(0);
    this.faderButtonLatch = Array(GRID_COLUMNS).fill(false);
    this.columnActiveVelocities = Array.from({ length: GRID_COLUMNS }, (_, index) =>
      DEFAULT_COLUMN_ACTIVE_VELOCITIES[index] ?? 50,
    );
    this.onMidiMessageCallback = this.handleMidiMessage.bind(this);
  }

  // 現在サポートしているグリッド列数を返す。
  getColumnCount(): number {
    return GRID_COLUMNS;
  }

  // 指定列のシーン選択インデックスを問い合わせる。
  getColumnSceneSelection(columnIndex: number): number | null {
    return this.columnSceneSelections[columnIndex] ?? null;
  }

  // 指定列に構成されたシーン数。
  getColumnSceneCount(columnIndex: number): number {
    return this.columnSceneCounts[columnIndex] ?? 0;
  }

  // ラッチ状態を考慮したフェーダー値を正規化値として返す。
  getFaderValue(columnIndex: number): number {
    if (columnIndex < GRID_COLUMNS) {
      if (this.faderButtonLatch[columnIndex]) {
        return 0;
      }

      return this.faderValues[columnIndex] ?? 0;
    }

    return this.rawFaderValues[columnIndex] ?? 0;
  }

  // 背景フェーダー(最右)の値を取得する。
  getBackgroundFaderValue(): number {
    return this.rawFaderValues[MASTER_FADER_INDEX] ?? 0;
  }

  // 列のシーン選択を更新し、LEDの再描画フラグを立てる。
  setColumnSceneSelection(columnIndex: number, sceneIndex: number): void {
    if (columnIndex < 0 || columnIndex >= GRID_COLUMNS) {
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

  // シーンライブラリー側から列ごとの有効スロット数を同期させる。
  configureSceneSlots(counts: number[]): void {
    for (let column = 0; column < GRID_COLUMNS; column++) {
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

  // 毎フレーム呼び出され、LED更新のバッチを送信する。
  update(): void {
    this.flushPendingLedUpdates();
  }

  // MIDI接続の成否変化に応じて初期化やリセットを行う。
  protected onMidiAvailabilityChanged(available: boolean): void {
    this.midiAvailable = available;
    this.initializationComplete = true;
    if (available) {
      this.clearAllLeds();
      this.refreshAllLeds();
    }
  }

  // 初期化完了後かどうかを参照。接続がなくてもtrueになる。
  public isInitialized(): boolean {
    return this.initializationComplete;
  }

  // Web MIDIから渡されたrawメッセージを解析し、種別ごとにハンドラへ振り分ける。
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

  // グリッドボタン押下時のシーン切り替え処理。
  private handleGridPress(rawNote: number, velocity: number): void {
    // Only process button press (velocity > 0), ignore release (velocity = 0)
    if (velocity === 0) {
      return;
    }

    if (rawNote < NOTE_RANGES.GRID_START || rawNote > NOTE_RANGES.GRID_END) {
      return;
    }

    const gridIndex = rawNote - NOTE_RANGES.GRID_START;
    const columnIndex = gridIndex % GRID_COLUMNS;
    const rowFromTop = Math.floor(gridIndex / GRID_COLUMNS);
    const rowIndex = GRID_ROWS - 1 - rowFromTop;
    const available = this.columnSceneCounts[columnIndex] ?? 0;
    if (rowIndex < available) {
      this.setColumnSceneSelection(columnIndex, rowIndex);
    }
  }

  // フェーダーの移動を正規化し、列の出力へ反映する。
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

    if (columnIndex < GRID_COLUMNS && !this.faderButtonLatch[columnIndex]) {
      this.faderValues[columnIndex] = normalized;
    }

  }

  // フェーダー下のラッチボタン（ミュート）操作を処理する。
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

  // 保留中のLED更新をまとめて送信する。
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

  // 全列のLEDを再描画し、視覚状態を初期化する。
  private refreshAllLeds(): void {
    if (!this.midiAvailable) {
      return;
    }

    for (let column = 0; column < GRID_COLUMNS; column++) {
      this.renderColumnLeds(column);
      this.renderFaderButtonLed(column);
    }
  }

  // 指定列の各行に対してLED出力を送信する。
  private renderColumnLeds(column: number): void {
    const selectedRow = this.columnSceneSelections[column];
    const sceneCount = this.columnSceneCounts[column] ?? 0;

    for (let row = 0; row < GRID_ROWS; row++) {
      const gridIndex = (GRID_ROWS - 1 - row) * GRID_COLUMNS + column;
      const note = NOTE_RANGES.GRID_START + gridIndex;

      if (row < sceneCount) {
        const isActive = selectedRow === row;
        const velocity = isActive ? this.columnActiveVelocities[column] ?? 50 : 3;
        this.sendMessage([MIDI_OUTPUT_NOTE_ON, note, velocity]);
      } else {
        this.sendMessage([MIDI_OUTPUT_NOTE_ON, note, 0]);
      }
    }
  }

  // ラッチボタンの発光状態を更新する。
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
    if (column < 0 || column >= GRID_COLUMNS) return;
    this.columnActiveVelocities[column] = velocity;
    this.dirtyColumns.add(column);
  }

  // Web MIDIアクセシビリティを公開する。
  public isMidiConnected(): boolean {
    return this.midiAvailable;
  }

  // すべてのLEDを消灯してから再同期する。
  private clearAllLeds(): void {
    for (let column = 0; column < GRID_COLUMNS; column++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const gridIndex = row * GRID_COLUMNS + column;
        const note = NOTE_RANGES.GRID_START + gridIndex;
        this.sendMessage([MIDI_OUTPUT_NOTE_ON, note, 0]);
      }
    }

    for (let column = 0; column < GRID_COLUMNS; column++) {
      const note = this.getFaderButtonNote(column);
      if (note != null) {
        this.sendMessage([MIDI_FADER_BUTTON_NOTE_ON, note, 0]);
      }
    }
  }

  // フェーダーラッチボタンのノート番号を列番号から算出する。
  private mapFaderButtonToColumn(rawNote: number): number | null {
    if (rawNote < NOTE_RANGES.FADER_BUTTONS_START || rawNote > NOTE_RANGES.FADER_BUTTONS_END) {
      return null;
    }

    const columnIndex = rawNote - NOTE_RANGES.FADER_BUTTONS_START;
    return columnIndex >= 0 && columnIndex < GRID_COLUMNS ? columnIndex : null;
  }

  // 指定列に対応するラッチボタンのノート番号を返す。
  private getFaderButtonNote(columnIndex: number): number | null {
    if (columnIndex < 0 || columnIndex >= GRID_COLUMNS) {
      return null;
    }

    return NOTE_RANGES.FADER_BUTTONS_START + columnIndex;
  }
}