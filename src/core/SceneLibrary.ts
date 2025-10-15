// src/core/SceneLibrary.ts

import type { IScene } from './IScene';
import { BioOrganicBloomScene } from '../scenes/bio/BioOrganicBloomScene';
import { BioCellMeshScene } from '../scenes/bio/BioCellMeshScene';
import { BioNeuralPulseScene } from '../scenes/bio/BioNeuralPulseScene';
import { LightningArcStormScene } from '../scenes/lightning/LightningArcStormScene';
import { LightningIonBurstScene } from '../scenes/lightning/LightningIonBurstScene';
import { LightningPulseGridScene } from '../scenes/lightning/LightningPulseGridScene';
import { AudioSpectrumColumnScene } from '../scenes/audioSpectrum/AudioSpectrumColumnScene';
import { AudioSpectrumWaveScene } from '../scenes/audioSpectrum/AudioSpectrumWaveScene';
import { AudioSpectrumRadialScene } from '../scenes/audioSpectrum/AudioSpectrumRadialScene';
import { ParticleDriftFieldScene } from '../scenes/particle/ParticleDriftFieldScene';
import { ParticleRibbonSwirlScene } from '../scenes/particle/ParticleRibbonSwirlScene';
import { ParticleCascadeScene } from '../scenes/particle/ParticleCascadeScene';
import { ShapeRotatingMosaicScene } from '../scenes/shapes/ShapeRotatingMosaicScene';
import { ShapePolyOrbitScene } from '../scenes/shapes/ShapePolyOrbitScene';
import { ShapeRecursiveGridScene } from '../scenes/shapes/ShapeRecursiveGridScene';
import { OrientalSeigaihaScene } from '../scenes/oriental/OrientalSeigaihaScene';
import { OrientalAsanohaScene } from '../scenes/oriental/OrientalAsanohaScene';
import { OrientalKikkoScene } from '../scenes/oriental/OrientalKikkoScene';
import { SkyAuroraVeilScene } from '../scenes/sky/SkyAuroraVeilScene';
import { SkyMeteorShowerScene } from '../scenes/sky/SkyMeteorShowerScene';
import { SkyNebulaBloomScene } from '../scenes/sky/SkyNebulaBloomScene';
import { TextureWeaveScene } from '../scenes/texture/TextureWeaveScene';
import { TextureNoiseFabricScene } from '../scenes/texture/TextureNoiseFabricScene';
import { TextureGlassShardScene } from '../scenes/texture/TextureGlassShardScene';

// APC Mini MK2とレイアウトを揃えるための列・行の最大数。
export const GRID_COLUMNS = 8;
export const GRID_ROWS = 8;

export type SceneConstructor = new () => IScene;
export type SceneLibraryColumn = SceneConstructor[];
export type SceneLibraryGrid = SceneLibraryColumn[];

// デフォルトでプレイアブルなシーンの一覧。列順がデバイスの列に対応する。
export const DEFAULT_SCENE_LIBRARY: SceneLibraryGrid = [
    [
        BioOrganicBloomScene,
        BioCellMeshScene,
        BioNeuralPulseScene,
    ],
    [
        LightningArcStormScene,
        LightningIonBurstScene,
        LightningPulseGridScene,
    ],
    [
        AudioSpectrumColumnScene,
        AudioSpectrumWaveScene,
        AudioSpectrumRadialScene,
    ],
    [
        ParticleDriftFieldScene,
        ParticleRibbonSwirlScene,
        ParticleCascadeScene,
    ],
    [
        ShapeRotatingMosaicScene,
        ShapePolyOrbitScene,
        ShapeRecursiveGridScene,
    ],
    [
        OrientalSeigaihaScene,
        OrientalAsanohaScene,
        OrientalKikkoScene,
    ],
    [
        SkyAuroraVeilScene,
        SkyMeteorShowerScene,
        SkyNebulaBloomScene,
    ],
    [
        TextureWeaveScene,
        TextureNoiseFabricScene,
        TextureGlassShardScene,
    ],
];

export function getColumnScenes(
    library: SceneLibraryGrid,
    columnIndex: number,
): SceneLibraryColumn {
    // 指定列が未定義の場合でも空配列を返し、呼び出し側でのnullチェックを不要にする。
    return library[columnIndex] ?? [];
}
