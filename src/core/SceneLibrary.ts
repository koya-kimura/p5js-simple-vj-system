// src/core/SceneLibrary.ts

import type { IScene } from './IScene';
import { BioOrganicBloomScene, BioCellMeshScene, BioNeuralPulseScene } from '../scenes/bio/BioScenes';
import { LightningArcStormScene, LightningIonBurstScene, LightningPulseGridScene } from '../scenes/lightning/LightningScenes';
import { AudioSpectrumColumnScene, AudioSpectrumWaveScene, AudioSpectrumRadialScene } from '../scenes/audioSpectrum/AudioSpectrumScenes';
import { ParticleDriftFieldScene, ParticleRibbonSwirlScene, ParticleCascadeScene } from '../scenes/particle/ParticleScenes';
import { ShapeRotatingMosaicScene, ShapePolyOrbitScene, ShapeRecursiveGridScene } from '../scenes/shapes/ShapeScenes';
import { OrientalSeigaihaScene, OrientalAsanohaScene, OrientalKikkoScene } from '../scenes/oriental/OrientalScenes';
import { SkyAuroraVeilScene, SkyMeteorShowerScene, SkyNebulaBloomScene } from '../scenes/sky/SkyScenes';
import { TextureWeaveScene, TextureNoiseFabricScene, TextureGlassShardScene } from '../scenes/texture/TextureScenes';

export const GRID_COLUMNS = 8;
export const GRID_ROWS = 8;

export type SceneConstructor = new () => IScene;
export type SceneLibraryColumn = SceneConstructor[];
export type SceneLibraryGrid = SceneLibraryColumn[];

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
    return library[columnIndex] ?? [];
}
