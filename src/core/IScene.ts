// src/core/IScene.ts

import p5 from 'p5';

export interface SceneDrawContext {
    columnIndex: number;
    elapsedSeconds: number;
    deltaSeconds: number;
    toggles: readonly number[];
}

/**
 * すべてのVJシーンが実装すべき最低限のインターフェース
 */
export interface IScene {
    readonly name: string;

    /**
     * シーンインスタンスが列に割り当てられたときに呼ばれる初期化処理。
     */
    setup(p: p5, buffer: p5.Graphics, columnIndex: number): void;

    /**
     * 毎フレームの描画処理。各シーンは与えられたバッファーに直接描画する。
     */
    draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void;
}