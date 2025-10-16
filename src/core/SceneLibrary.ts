// src/core/SceneLibrary.ts

import type { IScene } from './IScene';
import { SampleCircleScene } from '../scenes/sample/SampleCircleScene';
import { WaterUpBubbleScene } from '../scenes/water/WaterUpBubbleScene';
import { SpectrumShuffleBarScene } from '../scenes/spectrum/SpectrumShuffleBarScene';
import { UIClockPanelScene } from '../scenes/ui/UIClockPanelScene';
import { UIToggleStatusScene } from '../scenes/ui/UIToggleStatusScene';
import { UIAudioTimelineScene } from '../scenes/ui/UIAudioTimelineScene';
import { UISpectrumHudScene } from '../scenes/ui/UISpectrumHudScene';
import { WaveCircleScene } from '../scenes/wave/WaveCircleScene';

// APC Mini MK2とレイアウトを揃えるための列・行の最大数。
export const GRID_COLUMNS = 8;
export const GRID_ROWS = 8;

export type SceneConstructor = new () => IScene;
export type SceneLibraryColumn = SceneConstructor[];
export type SceneLibraryGrid = SceneLibraryColumn[];

// デフォルトでプレイアブルなシーンの一覧。列順がデバイスの列に対応する。
export const DEFAULT_SCENE_LIBRARY: SceneLibraryGrid = [
    [
        SpectrumShuffleBarScene
    ],
    [
        WaterUpBubbleScene
    ],
    [
        WaveCircleScene
    ],
    [
        SampleCircleScene
    ],
    [
        SampleCircleScene
    ],
    [
        SampleCircleScene
    ],
    [
        SampleCircleScene
    ],
    [
        UIClockPanelScene,
        UIToggleStatusScene,
        UIAudioTimelineScene,
        UISpectrumHudScene
    ],
];

export function getColumnScenes(
    library: SceneLibraryGrid,
    columnIndex: number,
): SceneLibraryColumn {
    // 指定列が未定義の場合でも空配列を返し、呼び出し側でのnullチェックを不要にする。
    return library[columnIndex] ?? [];
}
