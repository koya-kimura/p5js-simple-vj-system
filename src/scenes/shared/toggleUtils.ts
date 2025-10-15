import type { SceneDrawContext } from '../../core/IScene';

export type ToggleArray = readonly number[];
export type ToggleSampleMode = 'instant' | 'smooth';

function resolveContextToggles(context: SceneDrawContext, mode: ToggleSampleMode): ToggleArray {
  return mode === 'smooth' ? context.togglesSmooth : context.toggles;
}

export function toggleValue(toggles: ToggleArray, index: number, fallback = 0): number {
  if (index < 0 || index >= toggles.length) {
    return fallback;
  }
  return toggles[index];
}

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

export function toggleActiveCount(toggles: ToggleArray): number {
  return toggles.reduce((count, value) => count + (value > 0 ? 1 : 0), 0);
}

export function toggleEnergy(toggles: ToggleArray): number {
  if (toggles.length === 0) {
    return 0;
  }
  return toggles.reduce((sum, value) => sum + value, 0) / toggles.length;
}

export function contextToggles(context: SceneDrawContext, mode: ToggleSampleMode = 'instant'): ToggleArray {
  return resolveContextToggles(context, mode);
}

export function contextToggleValue(context: SceneDrawContext, index: number, fallback = 0, mode: ToggleSampleMode = 'instant'): number {
  return toggleValue(resolveContextToggles(context, mode), index, fallback);
}

export function contextToggleAverage(context: SceneDrawContext, start: number, count: number, mode: ToggleSampleMode = 'instant'): number {
  return toggleRangeAverage(resolveContextToggles(context, mode), start, count);
}

export function contextToggleEnergy(context: SceneDrawContext, mode: ToggleSampleMode = 'instant'): number {
  return toggleEnergy(resolveContextToggles(context, mode));
}
