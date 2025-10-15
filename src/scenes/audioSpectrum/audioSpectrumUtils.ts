export function spectrumSample(spectrum: readonly number[], index: number, total: number): number {
  if (spectrum.length === 0 || total <= 1) {
    return 0;
  }
  const clampedIndex = Math.max(0, Math.min(total - 1, index));
  const ratio = clampedIndex / (total - 1);
  const spectrumIndex = Math.min(
    spectrum.length - 1,
    Math.floor(ratio * (spectrum.length - 1)),
  );
  return spectrum[spectrumIndex] ?? 0;
}

export function spectrumAverage(
  spectrum: readonly number[],
  startRatio: number,
  endRatio: number,
): number {
  if (spectrum.length === 0) {
    return 0;
  }
  const start = Math.max(0, Math.min(1, startRatio));
  const end = Math.max(start, Math.min(1, endRatio));
  const startIndex = Math.floor(start * (spectrum.length - 1));
  const endIndex = Math.floor(end * (spectrum.length - 1));
  let sum = 0;
  let count = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    sum += spectrum[i];
    count++;
  }
  return count > 0 ? sum / count : 0;
}
