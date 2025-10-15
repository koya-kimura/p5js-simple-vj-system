# シーン開発ガイド

このドキュメントは、`p5js-simple-vj-system`に新しいシーンを追加して動作確認するまでの流れをまとめたものです。はじめてシーンを作るときは、上から順番に読みながら進めてみてください。

---

## 1. 事前準備

- `npm install` が完了している。
- `npm run dev` で開発サーバーを起動している（作業中は起動したままにすると便利）。
- ブラウザでMIDIとマイクのアクセス許可を与えている。
- （任意）AKAI APC Mini MK2を接続している。

---

## 2. シーンファイルを自動生成する

プロジェクトルートで以下を実行します。

```bash
bash tools/generate-scene.command
```

日本語のプロンプトが表示されるので、順に入力します。

1. **カテゴリ名** – 例: `sky`, `texture`, `experimental/waves` など。存在しない場合はフォルダーが自動作成されます。
2. **シーンの基本名（PascalCase）** – 例: `NebulaBloom`。クラス名に利用されます。
3. **表示名** – 空欄でEnterを押すと自動生成（例: `Sky · Nebula Bloom`）。

最終確認で `y` を入力すると、以下が実行されます。

- `src/scenes/<カテゴリ>/<カテゴリ><シーン>Scene.ts` を生成。
- 必要な中間フォルダーを自動作成。
- VS Codeの`code`コマンドが利用可能なら、生成したファイルを自動で開く。

---

## 3. テンプレートの構成を理解する

生成されたシーンは `IScene` を実装し、トグル操作用のヘルパーも最初から読み込まれています。

```typescript
import { contextToggleEnergy, contextToggleValue } from '../../utils/toggleUtils';
```

編集するときのポイントは次のとおりです。

- `setup(p, buffer, columnIndex)` – 列に割り当てられたときに1度だけ呼ばれる初期化処理。
- `draw(p, buffer, context)` – 毎フレームの描画処理。テンプレートではバッファークリアと原点移動が済んでいます。
- 状態を持たせたい場合はクラスプロパティを追加し、`setup` で初期化、`draw` で更新します。

テンプレート内では以下の例が含まれます。

- `contextToggleEnergy(context)` でトグル全体の平均値を取得。
- `contextToggleValue(context, 'Z', 0, 'smooth')` のようにキー名でトグルを参照。
- トグル値やエネルギーを使って図形の大きさや色を変化させる。

---

## 4. ランタイムパラメーターの扱い方

### トグル入力（Z〜M キー / APC ボタン）

```typescript
const zInstant = contextToggleValue(context, 'Z');              // 瞬時値 (0 or 1)
const mSmooth = contextToggleValue(context, 'M', 0, 'smooth');   // 0.2 秒平滑値
```

キーとインデックスの対応表：

| キー | インデックス |
| --- | --- |
| `Z`/`z` | 0 |
| `X`/`x` | 1 |
| `C`/`c` | 2 |
| `V`/`v` | 3 |
| `B`/`b` | 4 |
| `N`/`n` | 5 |
| `M`/`m` | 6 |

便利な関数：

- `contextToggleEnergy(context, mode)` – 全トグルの平均値。
- `contextToggleAverage(context, start, count, mode)` – 任意範囲の平均値。
- `contextToggleRange(context, start, count, mode)` – 任意範囲の配列を取得。

`mode`を省略すると`'instant'`（瞬時値）になり、`'smooth'`を渡すと0.2秒平滑値を返します。

### オーディオリアクティブ情報

`SceneDrawContext` から正規化されたオーディオデータを取得できます。

```typescript
const level = context.audioLevel;               // 0〜1 の RMS レベル
const spectrum = context.audioSpectrum;         // 64 ビンのスペクトラム (0〜1)
const usingNoise = context.audioDebug;          // デバッグノイズ使用中かどうか
```

使用例：

```typescript
const bass = spectrum.slice(0, 8).reduce((sum, v) => sum + v, 0) / 8;
buffer.strokeWeight(1 + bass * 8);
```

### フェーダー / グリッドの状態

- `context.faderValue` – 列のアルファ値（0：完全非表示、1：完全表示）。
- `context.masterFader` – 9本目のフェーダーで制御する背景黒アルファ。
- `context.columnIndex` – 0始まりの列番号。列ごとのバリエーションに使えます。

### リズム関連

`BPMManager` からビートの情報を取得できます。

```typescript
const beat = context.getBeat();                  // 累積ビート数
const phase = context.getMeasurePhase(4);        // 4 拍子の位相 (0〜1)
```

ビートに合わせたアニメーションやトリガーに活用してください。

---

## 5. SceneLibrary に登録する

`src/core/SceneLibrary.ts` を開き、該当する列の配列にクラスを追加します。

```typescript
import { SkyNebulaBloomScene } from '../scenes/sky/SkyNebulaBloomScene';

export const DEFAULT_SCENE_LIBRARY: SceneLibraryGrid = [
  [SkyAuroraVeilScene, SkyMeteorShowerScene, SkyNebulaBloomScene],
  // ... ほかの列 ...
];
```

各列はAPC Mini MK2の列、およびキーボードフォールバック列と1対1で対応しています。

---

## 6. ブラウザで動作確認する

1. `npm run dev` が動いていることを確認。
2. プレビューを表示しているブラウザをアクティブにする。
3. 新しいシーンを選択する（APCのパッド、または `1`〜`8` / `Q`〜`I`）。
4. Z〜MキーやAPCのトグル、列フェーダーを操作し、シーンの反応を確認。
5. `P` キーでデバッグオーバーレイを表示し、以下をチェック：
   - シーン名が正しい列に表示される。
   - トグル / オーディオ / ビート指標が想定通りに変化する。
6. `L` キーでマイクとデバッグノイズを切り替え、オーディオリアクションを確認。

問題が無ければ `Ctrl + C` で開発サーバーを停止します。

---

## 7. 本番ビルド（任意）

コミット前に以下を実行すると、型エラーやビルドエラーを早期に検出できます。

```bash
npm run build
```

---

## 8. Tips & ベストプラクティス

- 描画前後は `buffer.push()` / `buffer.pop()` を忘れずに。行列変換のリークを防げます。
- `p` インスタンスは必要な関数（`sin`, `noise` など）だけ使い、不要なら無視して構いません。
- ランダム値やジオメトリなど毎フレーム再計算したくない値はクラスプロパティに保持し、`setup` で初期化。
- 計算コストの高い処理はビートの変化を利用して間引くと負荷削減になります（例: `if (Math.floor(beat) !== Math.floor(prevBeat)) { ... }`）。
- 実験用シーンは `experimental` など専用カテゴリを作って、本番用と分けて管理すると便利です。

楽しいシーン開発を！
