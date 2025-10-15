# p5js-simple-vj-system

`p5js-simple-vj-system`は、p5.js+TypeScriptで構築されたライブVJプレイグラウンドです。AKAI APC Mini MK2を前提に、シーンの高速切り替え、LED連動、オーディオリアクティブ描画、MIDIとキーボードのフォールバック操作を統合しています。はじめて触る人でも「とりあえず動かして、自分のシーンを追加して、音やパラメーターに反応させる」ことをゴールに、コードとドキュメントを整理しています。

---

## 主な特徴

- Vite+TypeScript+ESLint+ホットリロードによる快適な開発体験
- APC Mini MK2（8列×8行）と完全同期するシーン管理とLEDフィードバック
- 9本のフェーダー（最右は背景黒アルファ）とミュートボタンをMIDIで制御
- Z〜Mの7トグルを瞬時値と0.2秒スムーズ値の両方で全シーンへ供給
- マイク入力を10秒窓で正規化した`audioLevel`/64bin`audioSpectrum`
- `L`でマイク↔ノイズのデバッグ切替、`P`で詳細なデバッグオーバーレイ
- キーボードフォールバックやBPMタップテンポなど、MIDI未接続でも遊べる設計
- カテゴリ別（Bio/Lightning/AudioSpectrum/Particle/Shapes/Oriental/Sky/Texture）の64スロット構成
- `tools/generate-scene.command`による対話的なシーンファイル自動生成（VS Codeで自動オープン）

---

## 動作環境

- Node.js18以上・npm
- Web MIDI APIとgetUserMediaをサポートするChromium系ブラウザ（Chrome推奨）
- （任意）AKAI APC Mini MK2、オーディオ入力

初回起動ではブラウザからMIDIとマイクの許可を求められます。

---

## セットアップと基本操作

1. 依存関係のインストール

   ```bash
   npm install
   ```

2. 開発サーバーの起動

   ```bash
   npm run dev
   ```

   表示されたURLをブラウザで開き、マイクとMIDIのアクセスを許可します。

3. 本番ビルド / プレビュー

   ```bash
   npm run build
   npm run preview
   ```

---

## MIDI コントローラー連携

- **フェーダー1〜8**: 各列のアルファ（0=非表示）。フェーダーボタンでミュートし、LEDが点灯すると完全にミュート。
- **フェーダー9**: 背景黒アルファ（0=255、1=0）を制御。フェーダーボタンは背景ミュート。
- **グリッドパッド**: 8×8のセル。登録済セルはベロシティ3で点灯し、アクティブセルは列色で点灯。
- **列ごとのシーン数**: `SceneLibrary.ts`に記述した順（最大8つ）。シーンが3つの列なら、上段3つが点灯＋選択可能。
- **MIDI未接続**: フォールバックとしてキーボード操作が有効化され、LED更新等は行われません。

MIDI制御は[`src/midi/APCMiniMK2Manager.ts`](src/midi/APCMiniMK2Manager.ts)が担当し、列ごとのアクティブシーン、フェーダー値、LEDを管理します。

---

## キーボードショートカット

| キー | 動作 |
| --- | --- |
| `1`〜`8` | 各列の1行目シーンをアクティブ化（フォールバック時） |
| `0` | フォールバックシーンを解除 |
| `Q`〜`I` | 列ごとのシーンを順送り（フォールバック時） |
| `Z`〜`M` | 7トグルトグルのオン/オフ（0 or 1） |
| `P` | デバッグオーバーレイの表示切替 |
| `L` | マイク↔ノイズのデバッグオーディオ切替 |
| `Enter` | BPMタップテンポ |
| `Shift` | BPM/ビートのリセット |
| `Space` | フルスクリーン切替 |

キーボード操作は[`src/input/KeyboardController.ts`](src/input/KeyboardController.ts)に実装されています。

---

## デバッグオーバーレイ（`P`）

[`SceneManager`](src/core/SceneManager.ts)が描画するオーバーレイで、右下に以下を表示します：

- FPS / 経過時間 / 背景フェーダー値
- トグル瞬時値・平滑値（Z〜M）
- オーディオレベル（正規化済み）とソース（microphone / debug noise）
- 低域・中域・高域のスペクトラム平均
- 各列のフェーダー値、アクティブシーン名、キーボードフォールバック状態

`L`を押すとオーディオソースがノイズに切り替わり、マイク無しでもオーディオリアクティブ挙動をテストできます。

---

## オーディオ処理パイプライン

1. [`src/audio/MicrophoneMonitor.ts`](src/audio/MicrophoneMonitor.ts)が`getUserMedia`でオーディオを取得し、RMSと64binスペクトラムをリアルタイムで計算。
2. 生のRMS/スペクトラムを指数スムージング（アタック速め・リリース遅め）した後、最大1200サンプル（約10秒）のリングバッファーに蓄積。
3. バッファーから10パーセンタイル（ノイズフロア）と90パーセンタイル（ピーク）を算出し、`(値-floor)/(ceil-floor)`で正規化（空の場合は生値にフォールバック）。
4. 正規化された単一値を`audioLevel`、配列を`audioSpectrum`として`SceneDrawContext`に供給。`audioDebug`で現在のソース種別を判定可能。
5. デバッグモード（`L`）では低域寄りノイズスペクトラムを合成し、同じ正規化パイプラインを通して配信します。

この仕組みにより、環境音量が変化しても滑らかで扱いやすい0〜1値を取得できます。

---

## リズム/BPM

[`src/rhythm/BPMManager.ts`](src/rhythm/BPMManager.ts)がタップテンポ、ビート進行、フェーズ計算を担当します。

- `Enter`でタップテンポ。複数回の間隔からBPMを推定。
- `Shift`でBPMと位相をリセット。
- `SceneDrawContext`から`beat`,`getBeat()`,`getMeasurePhase()`などを参照できます。ビート同期のアニメーションやスナップに利用してください。

---

## トグル/フェーダーのユーティリティ

各シーンで生のトグル配列を扱う代わりに、[`src/utils/toggleUtils.ts`](src/utils/toggleUtils.ts)を利用できます。

| 関数 | 説明 |
| --- | --- |
| `contextToggleValue(context, key, 'instant' | 'smooth')` | トグルの瞬時値or平滑値（既定は瞬時）。`key`には数字か`'Z'`〜`'M'`（小文字も可）を渡せます |
| `contextToggleEnergy(context)` | トグル全体の平均（スムーズ値） |
| `contextToggleAverage(context, start, count)` | 任意範囲の平均 |
| `contextToggleRange(context, start, count, mode)` | 範囲の配列取得 |

フェーダー値（0〜1）は`SceneDrawContext.faderValue`/`masterFader`から参照できます。

### トグルキーの対応表

| キー | インデックス |
| --- | --- |
| `Z`/`z` | 0 |
| `X`/`x` | 1 |
| `C`/`c` | 2 |
| `V`/`v` | 3 |
| `B`/`b` | 4 |
| `N`/`n` | 5 |
| `M`/`m` | 6 |

`contextToggleValue(context, 'M', 0, 'smooth')`のように記述すると、インデックスを覚えなくても扱えます。

---

## シーンの追加方法

### 1. 自動生成スクリプト（推奨）

```bash
bash tools/generate-scene.command
```

- 日本語プロンプトが表示され、カテゴリ（例: `sky`）、シーン基本名（PascalCase推奨/例: `NebulaBloom`）、表示名を順に入力します。
- 生成前にカテゴリ一覧とプレビューが出力され、`y`で確定すると`src/scenes/<カテゴリ>/<カテゴリ><シーン>Scene.ts`が生成されます。
- VS Codeの`code`コマンドが利用可能なら自動でファイルが開きます。
- テンプレートは[`templates/sceneTemplate.ts`](templates/sceneTemplate.ts)を使用し、`SceneDrawContext`とトグルユーティリティを最初からインポート済みです。

### 2. SceneLibrary への登録

[`src/core/SceneLibrary.ts`](src/core/SceneLibrary.ts)の`DEFAULT_SCENE_LIBRARY`に新しいクラスを追加します。列ごとに配列で管理しているため、好きな位置に挿入・削除が可能です。

```ts
import { SkyNebulaBloomScene } from '../scenes/sky/SkyNebulaBloomScene';

export const DEFAULT_SCENE_LIBRARY: SceneLibraryGrid = [
  [SkyNebulaBloomScene, /* ... */],
  // ...
];
```

### 3. 実装のヒント

- バッファーのクリアやトランスフォームはテンプレートのように`buffer.clear()`→`buffer.push()`→`buffer.pop()`で管理してください。
- `context.deltaSeconds`や`context.elapsedSeconds`を使うとフレーム依存しないアニメーションになります。
- トグルやオーディオ値は0〜1の範囲なので、色やアルファのモジュレーションにそのまま活用できます。
- 列番号`context.columnIndex`を使うと列固有のバリエーションを付けられます。
- 状態を持たせたい場合はクラスプロパティを追加し、`setup`で初期化、`draw`で更新する構造が定番です。

### 4. テンプレートから実装を発展させる例

テンプレートのリングアニメーションを基に、スペクトラム平均でリング数を変えるなど、配列データを活用してみましょう。

```ts
const bass = contextToggleAverage(context, 0, 3);
const spectrumEnergy = context.audioSpectrum.slice(0, 8).reduce((sum, v) => sum + v, 0) / 8;
const rings = 4 + Math.round(spectrumEnergy * 6);
```

---

## プロジェクト構造ガイド

```
src/
├─ main.ts                  // p5 エントリポイント
├─ audio/MicrophoneMonitor.ts
├─ config/                  // カラーパレットなどの設定
├─ core/
│  ├─ SceneManager.ts       // シーン切替・BPM 連動・デバッグ
│  ├─ SceneLibrary.ts       // シーン登録テーブル
│  └─ IScene.ts             // 必須インターフェース
├─ input/KeyboardController.ts
├─ midi/
│  ├─ APCMiniMK2Manager.ts  // MIDI I/O と LED 更新
│  └─ midiManager.ts        // Web MIDI イニシャライズ
├─ rhythm/BPMManager.ts
├─ scenes/
│  ├─ audioSpectrum/
│  ├─ bio/
│  ├─ lightning/
│  ├─ particle/
│  ├─ shapes/
│  ├─ oriental/
│  ├─ sky/
│  └─ texture/
└─ utils/toggleUtils.ts
```

シーンカテゴリは必要に応じて増やせます。`generate-scene.command`で新規フォルダーも自動生成されます。

---

## NPM スクリプト

- `npm run dev` – 開発サーバー（ホットリロード）
- `npm run build` – 型チェック+本番バンドル
- `npm run preview` – 本番バンドルのローカルプレビュー

---

## トラブルシューティング

- **ブラウザでマイクが無音**: アドレスバーのマイクアイコンからアクセス許可を確認し、システムサウンド設定で入力デバイスを選択してください。
- **MIDIが認識されない**: Chromeの`chrome://settings/content/midiDevices`でアクセス許可を確認。`APCMiniMK2Manager`の`console`出力も参考になります。
- **ビルド時のエラー**: TypeScriptのstrictモードを有効にしています。テンプレート通りに型を明示するか、`npm run build`のログを参照して修正してください。

---

## ライセンス

このプロジェクトはMITライセンスです。詳細は[`LICENSE`](LICENSE)を参照してください。