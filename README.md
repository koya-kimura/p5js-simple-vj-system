# p5js-simple-vj-system

`p5js-simple-vj-system`はp5.jsとWebGLシェーダーで構築した、ライブ運用しやすいVJプロジェクトです。AKAI APC Mini MK2の8×8グリッドとフェーダーを前提にしたインターフェイスを備え、列ごとに割り当てたシーンをリアルタイムで切り替え・ブレンドできます。

本リポジトリは2025-10-14時点の最新版です。UIオーバーレイ機能は除去済みで、シーンとポストエフェクトに集中した構成になっています。

---

## 特徴
- p5.js（`p5@2.x`）とViteを使った高速ホットリロード開発環境
- AKAI APC Mini MK2のグリッド／フェーダーを前提にしたシーン切り替えとフェーダーブレンド
- TypeScriptで統一されたシーンインターフェイス（`IScene`）による拡張しやすい設計
- WebGLベースのポストプロセスシェーダーでのフィルター処理（`public/shader/post.frag`）
- MIDIが接続できない環境でもシーンを確認できるフォールバック処理
- 列ごとに独立したシーンセットを登録可能（最大8列×8行＝64シーン）
- グリッドLEDは登録済みシーンをベロシティ3で点灯し、選択中シーンは列ごとのアクセントカラーで発光

---

## 開発環境
- Node.js18以上（LTS系列推奨）
- npm（同梱でOK）
- 対応ブラウザ:Chrome/Edge最新版（Web MIDI APIが有効なブラウザ）

### 主要スクリプト
- `npm run dev`:Vite開発サーバーを起動
- `npm run build`:TypeScript型チェック後に本番ビルド
- `npm run preview`:ビルド成果物の簡易サーバーを起動

---

## セットアップと実行
1. 依存パッケージをインストールします。

   ```bash
   npm install
   ```

2. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

3. ブラウザで表示されるローカルホストのURLにアクセスします。

4. APC Mini MK2を接続している場合はブラウザでMIDI利用を許可してください。初期化にはおよそ1秒かかります。

5. 本番想定ビルドを確認する場合は以下を実行します。

   ```bash
   npm run build
   npm run preview
   ```

---

## プロジェクト構成

```
p5js-simple-vj-system/
├─ public/
│  ├─ assets/               # フォントなどの静的アセット
│  ├─ image/                # 画像素材（連番）
│  └─ shader/               # ポストエフェクト用シェーダー
├─ src/
│  ├─ main.ts               # p5.jsエントリーポイント
│  ├─ core/
│  │  ├─ IScene.ts          # すべてのシーンが実装すべきインターフェイス
│  │  ├─ SceneLibrary.ts    # 列ごとのシーン一覧（最大8×8のグリッド）
│  │  └─ SceneManager.ts    # 列ごとのバッファー管理と描画合成
│  ├─ scenes/               # 実装済みシーン群
│  ├─ midi/
│  │  ├─ midiManager.ts     # Web MIDI初期化と共通処理
│  │  └─ APCMiniMK2Manager.ts # APC Mini MK2用の入出力制御
│  ├─ rhythm/               # BPM管理（テンポ同期用ユーティリティ）
│  ├─ utils/                # イージングなどの共有ユーティリティ
│  └─ config/               # 将来的なカスタム設定用の雛形（現状は最小）
├─ templates/               # 旧来のテンプレート（参考用）
├─ index.html               # 単純なHTMLエントリーファイル
└─ tsconfig.json            # TypeScript設定
```

### ランタイムの流れ
- `src/main.ts`でp5インスタンスを生成し、`SceneManager`をセットアップ
- `SceneManager`は列ごとに`p5.Graphics`バッファーを保持し、APC Miniからの入力でシーンを切り替え
- `APCMiniMK2Manager`がWeb MIDIメッセージを受け取り、シーン選択とフェーダー値を管理
- `SceneManager#composite`が列のバッファーをフェーダー値に基づき重ね合わせ、キャンバスへ描画
- `public/shader/post.frag`でGLSLベースのポストエフェクトを実行（必要に応じて拡張可能）

---

## MIDIコントローラーについて
- APC Mini MK2の8×8グリッドがシーン選択インターフェイスとして機能します。登録済みスロットはベロシティ3で点灯し、選択中スロットは列カラーで発光します。
- 各列のフェーダーでシーン合成時のアルファ値を調整します。フェーダーが0の列は描画処理自体がスキップされ、パフォーマンスを確保します（MIDI未接続時のみ全列を強制表示）。
- 各列最下段のボタン（100番台のノート）はフェーダーのラッチ機能として扱われ、押すとフェーダー値が0に固定されます。
- 右端（9本目）のマスターフェーダーが背景の透過度を制御します。最下段（値0）で黒背景が不透明（α255）、最上段（値1）でα0になります。
- MIDIが利用できない環境では初期状態で何も表示されず、数字キー`1`〜`8`で各列1行目のシーンを、`0`で非表示を切り替えられます。さらに`Q`〜`I`キーで各列のシーンを順番にローテーションできます。
- `P`キーで右下にデバッグパネルを表示／非表示できます（MIDI接続の有無にかかわらず利用可能）。

---

## 既存シーン一覧
- `OrbitalPatternFieldScene`：軌道状に回転する粒子表現
- `LinearFlowGridScene`：グリッド状の矩形アニメーション
- `GlyphCascadeScene`：記号の降雨エフェクト
- `RadialBloomScene`：放射状のブルームライン（`src/scenes/RadialBloomScene.ts`）
- `FallingSphereArrayScene`：落下する球体アニメーション
- `RadialPulseConduitsScene`：多角形の脈動ライン
- `BinaryParticleLoomScene`：0/1ビットのパーティクルレイン
- `PhotoPulseCollageScene`：画像コラージュ風パルスアニメーション

各シーンは`IScene`インターフェイスを実装し、`setup`と`draw`でバッファーへ描画します。`SceneDrawContext`から列番号や経過時間などを受け取れます。

---

## シーンを追加する手順

1. **ファイルを作成**
   - `src/scenes/MyAwesomeScene.ts`のように新しいファイルを作成します。
   - 既存シーンをコピーするか、下記スケルトンを参考にしてください。

   ```typescript
   import p5 from 'p5';
   import type { IScene, SceneDrawContext } from '../core/IScene';

   export class MyAwesomeScene implements IScene {
     public readonly name = 'My Awesome Scene';

     public setup(_p: p5, _buffer: p5.Graphics, _columnIndex: number): void {
       // シーン初期化処理（必要に応じて状態を保持）
     }

     public draw(p: p5, buffer: p5.Graphics, context: SceneDrawContext): void {
       buffer.push();
       buffer.clear();
       // 描画ロジック
       buffer.pop();
     }
   }
   ```

2. **`SceneLibrary`に登録**
    - `src/core/SceneLibrary.ts`を開き、新しいシーンをインポートします。
    - `DEFAULT_SCENE_LIBRARY`は列（配列）ごとに別のシーン配列を持ちます。追加したい列の配列へシーンを差し込みます。各列の最大要素数は8です。

    ```typescript
    import { MyAwesomeScene } from '../scenes/MyAwesomeScene';

    export const DEFAULT_SCENE_LIBRARY: SceneLibraryGrid = [
       [
          OrbitalPatternFieldScene,
          LinearFlowGridScene,
          MyAwesomeScene, // ← 1列目の3行目に追加
       ],
       [
          RadialBloomScene,
          FallingSphereArrayScene,
       ],
       // ...残りの列
    ];
    ```

3. **必要ならAPC側の設定を調整**
   - 列数を増やしたい場合は`APCMiniMK2Manager`内の定数`GRID_COLS`を変更します。ハードウェアの物理列数（8）を超える構成を実装する場合はレイヤー切り替えなどの追加対応が必要です。
   - 列ごとのLEDカラーを変えたい場合は`COLUMN_ACTIVE_VELOCITIES`（0〜127）を編集します。

4. **動作確認**
   - `npm run dev`でホットリロードを起動し、グリッドボタンで新しいシーンが選択できるか確認します。
   - ハードウェアがない場合は`APCMiniMK2Manager#setColumnSceneSelection`を直接呼び出すテストコードを追加するか、`DEFAULT_SCENE_LIBRARY`の先頭に配置してデフォルトで描画させます。

5. **ビルドチェック**
   - `npm run build`を実行し、型エラーが発生していないことを確認します。

> **補足:** `templates/sceneTemplate.ts`は旧アーキテクチャに基づくテンプレートです。最新構成では`IScene`を直接実装するほうがシンプルなため、上記スケルトンの利用を推奨します。

> **描画ヒント:** 各シーンは`buffer.clear`や`buffer.background`を呼び出さず、`SceneManager`が用意したクリア済みバッファーに描画してください。

---

## ポストエフェクトをカスタマイズする
- `src/config/postEffectConfig.ts`で利用可能なポストエフェクトとフェーダーへの割り当てを定義しています。
- `POST_EFFECT_POOL`にエフェクトを追加し、`buildActivePostEffects`または`POST_EFFECT_SELECTION_PLAN`を編集するとフェーダーに割り当てられるエフェクトが変化します。
- GLSLシェーダー本体は`public/shader/post.frag`にあります。必要なユニフォームを追加したうえで、`APCMiniMK2Manager`から値を送る処理を実装してください。

---

## 開発上のヒント
- Web MIDI初期化は1秒遅延して行われます。ブラウザがMIDI利用を許可するまで少し待ってください。
- 画像コラージュシーンは`public/image/`以下の`image-1.*`〜`image-10.*`を利用します。差し替えたい場合は同じファイル名で置き換えてください。
- Viteのホットリロードでp5.jsキャンバスがリセットされた場合はブラウザをリロードするか、APC側で再度シーンを選択してください。
- ブラウザコンソールに余計なログが溜まる場合は`APCMiniMK2Manager`や`SceneManager`の`console.log`を確認し、必要に応じて削除またはコメントアウトしてください。

---

## ライセンス
リポジトリにライセンスファイルは含まれていません。利用・配布ポリシーを設定する場合は`LICENSE`ファイルを追加してください。