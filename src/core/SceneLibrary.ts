// src/core/SceneLibrary.ts

import type { IScene } from './IScene';
import { OrbitalPatternFieldScene } from '../scenes/OrbitalPatternFieldScene';
import { LinearFlowGridScene } from '../scenes/LinearFlowGridScene';
import { GlyphCascadeScene } from '../scenes/GlyphCascadeScene';
import { RadialBloomScene } from '../scenes/RadialBloomScene';
import { FallingSphereArrayScene } from '../scenes/FallingSphereArrayScene';
import { RadialPulseConduitsScene } from '../scenes/RadialPulseConduitsScene';
import { BinaryParticleLoomScene } from '../scenes/BinaryParticleLoomScene';
import { PhotoPulseCollageScene } from '../scenes/PhotoPulseCollageScene';

export const GRID_COLUMNS = 8;
export const GRID_ROWS = 8;

export type SceneConstructor = new () => IScene;
export type SceneLibraryColumn = SceneConstructor[];
export type SceneLibraryGrid = SceneLibraryColumn[];

export const DEFAULT_SCENE_LIBRARY: SceneLibraryGrid = [
    [
        OrbitalPatternFieldScene,
        LinearFlowGridScene,
        GlyphCascadeScene,
        RadialBloomScene,
    ],
    [
        FallingSphereArrayScene,
        RadialPulseConduitsScene,
        BinaryParticleLoomScene,
    ],
    [
        PhotoPulseCollageScene,
        LinearFlowGridScene,
        RadialBloomScene,
    ],
    [
        RadialPulseConduitsScene,
        OrbitalPatternFieldScene,
    ],
    [
        BinaryParticleLoomScene,
        PhotoPulseCollageScene,
        GlyphCascadeScene,
    ],
    [
        RadialBloomScene,
        FallingSphereArrayScene,
    ],
    [
        LinearFlowGridScene,
        PhotoPulseCollageScene,
        OrbitalPatternFieldScene,
    ],
    [
        GlyphCascadeScene,
        BinaryParticleLoomScene,
    ],
];

export function getColumnScenes(
    library: SceneLibraryGrid,
    columnIndex: number,
): SceneLibraryColumn {
    return library[columnIndex] ?? [];
}
