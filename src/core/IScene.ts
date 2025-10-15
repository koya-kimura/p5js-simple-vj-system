// src/core/IScene.ts

import p5 from 'p5';

// シーン描画時に渡される実行時情報。各シーンが必要な入力を安全に参照できる。
export interface SceneDrawContext {
    columnIndex: number; // 自列のインデックス。配色や配置の差別化に利用する。
    elapsedSeconds: number; // システム起動からの累積経過秒。
    deltaSeconds: number; // 前フレームからの経過秒。アニメーション速度に利用。
    toggles: readonly number[]; // 瞬時トグル値の配列（0か1）。
    togglesSmooth: readonly number[]; // 平滑化済みトグル値（0〜1）。
    audioLevel: number; // 正規化された音量指標（0〜1）。
    audioDebug: boolean; // デバッグノイズ使用中かどうか。
    audioSpectrum: readonly number[]; // 低域〜高域を均等に並べた正規化スペクトラム。
}

/**
 * すべてのVJシーンが実装すべき最低限のインターフェース
 */
export interface IScene {
    readonly name: string;

    /**
     * シーンインスタンスが列に割り当てられたときに呼ばれる初期化処理。
     * @param p p5インスタンス。環境設定の参照に利用。
     * @param buffer この列専用の描画バッファー。
     * @param columnIndex 列番号。シーン固有の初期化条件に使える。
     */
    setup(p: p5, buffer: p5.Graphics, columnIndex: number): void;

    /**
     * 毎フレーム実行されるメイン処理。与えられたバッファーにすべての描画を収める。
     * @param p p5インスタンス。ランダムやノイズ関数などの呼び出しに利用。
     * @param buffer 出力先バッファー。最終合成前の作画面。
     * @param context ランタイムのトグル/音声/時間情報。
     */
    draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void;
}