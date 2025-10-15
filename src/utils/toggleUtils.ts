import type { SceneDrawContext } from '../core/IScene';

export type ToggleArray = readonly number[];
export type ToggleSampleMode = 'instant' | 'smooth';
export type ToggleKeyName = 'Z' | 'X' | 'C' | 'V' | 'B' | 'N' | 'M';
export type ToggleKey = number | ToggleKeyName | Lowercase<ToggleKeyName>;

const TOGGLE_KEY_ORDER: ToggleKeyName[] = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

// コンテキストから瞬時値か平滑値のどちらを参照するかを判定する。
function resolveContextToggles(context: SceneDrawContext, mode: ToggleSampleMode): ToggleArray {
  return mode === 'smooth' ? context.togglesSmooth : context.toggles;
}

// 数値またはキー表記からトグルインデックスを求める。
function resolveToggleIndex(key: ToggleKey): number {
  if (typeof key === 'number') {
    return key;
  }
  const upper = key.toUpperCase() as ToggleKeyName;
  const index = TOGGLE_KEY_ORDER.indexOf(upper);
  return index;
}

// トグル配列から安全に値を取得する。範囲外はフォールバック値。
export function toggleValue(toggles: ToggleArray, index: number, fallback = 0): number {
  if (index < 0 || index >= toggles.length) {
    return fallback;
  }
  return toggles[index];
}

// キー名からトグル値を取得するヘルパー。
export function toggleValueByKey(toggles: ToggleArray, key: ToggleKey, fallback = 0): number {
  const index = resolveToggleIndex(key);
  if (index < 0) {
    return fallback;
  }
  return toggleValue(toggles, index, fallback);
}

// 任意範囲のトグル平均値を計算する。
export function toggleRangeAverage(toggles: ToggleArray, start: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  let sum = 0;
  let collected = 0;
  for (let i = 0; i < count; i++) {
    const idx = start + i;
    if (idx >= 0 && idx < toggles.length) {
      sum += toggles[idx];
      collected++;
    }
  }
  return collected > 0 ? sum / collected : 0;
}

// アクティブなトグル数をカウントする。
export function toggleActiveCount(toggles: ToggleArray): number {
  return toggles.reduce((count, value) => count + (value > 0 ? 1 : 0), 0);
}

// トグル全体の平均値（エネルギー量）を取得する。
export function toggleEnergy(toggles: ToggleArray): number {
  if (toggles.length === 0) {
    return 0;
  }
  return toggles.reduce((sum, value) => sum + value, 0) / toggles.length;
}

// シーンコンテキストから対象モード（instant/smooth）のトグル配列を返す。
export function contextToggles(context: SceneDrawContext, mode: ToggleSampleMode = 'instant'): ToggleArray {
  return resolveContextToggles(context, mode);
}

// キーを指定してコンテキスト内の値を調達する。フォールバック、サンプルモードに対応。
export function contextToggleValue(context: SceneDrawContext, key: ToggleKey, fallback = 0, mode: ToggleSampleMode = 'instant'): number {
  const toggles = resolveContextToggles(context, mode);
  const index = resolveToggleIndex(key);
  if (index < 0) {
    return fallback;
  }
  return toggleValue(toggles, index, fallback);
}

// コンテキストトグルを指定範囲で平均するショートカット。
export function contextToggleAverage(context: SceneDrawContext, start: number, count: number, mode: ToggleSampleMode = 'instant'): number {
  return toggleRangeAverage(resolveContextToggles(context, mode), start, count);
}

// コンテキストの全トグル平均値を取得する。シーン全体の活性度指標として利用。
export function contextToggleEnergy(context: SceneDrawContext, mode: ToggleSampleMode = 'instant'): number {
  return toggleEnergy(resolveContextToggles(context, mode));
}
