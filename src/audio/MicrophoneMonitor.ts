const HISTORY_DURATION_SECONDS = 10;
const HISTORY_MAX_SAMPLES = 1200;
const LOWER_PERCENTILE = 0.1;
const UPPER_PERCENTILE = 0.9;
const EPSILON = 1e-6;

function clamp01(value: number): number {
    if (value <= 0) {
        return 0;
    }
    if (value >= 1) {
        return 1;
    }
    return value;
}

function computePercentile(values: number[], fraction: number): number {
    if (values.length === 0) {
        return 0;
    }
    if (values.length === 1) {
        return values[0];
    }
    const sorted = [...values].sort((a, b) => a - b);
    const clampedFraction = Math.min(1, Math.max(0, fraction));
    const index = clampedFraction * (sorted.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const weight = index - lowerIndex;
    if (upperIndex === lowerIndex) {
        return sorted[lowerIndex];
    }
    return sorted[lowerIndex] + (sorted[upperIndex] - sorted[lowerIndex]) * weight;
}

export class MicrophoneMonitor {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private timeDomainData: Uint8Array<ArrayBuffer> | null = null;
    private frequencyData: Float32Array<ArrayBuffer> | null = null;

    private readonly spectrumBins = 64;
    private readonly spectrum: number[];
    private readonly normalizedSpectrum: number[];

    private rawLevel = 0;
    private smoothedLevel = 0;
    private normalizedLevel = 0;

    private readonly levelHistory: Array<{ time: number; value: number }> = [];
    private readonly spectrumHistory: Array<{ time: number; values: number[] }> = [];

    private readonly amplitudeSmoothing = 0.85;
    private readonly spectrumSmoothing = 0.7;

    private resumeRequested = false;
    private debugMode = false;
    private debugPhase = 0;

    constructor() {
        this.spectrum = new Array(this.spectrumBins).fill(0);
        this.normalizedSpectrum = new Array(this.spectrumBins).fill(0);
    }

    async start(): Promise<void> {
        if (this.analyser) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Browser does not support audio capture.');
        }

        const audioContext = new AudioContext();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0;
        analyser.minDecibels = -100;
        analyser.maxDecibels = -20;
        source.connect(analyser);

        this.audioContext = audioContext;
        this.analyser = analyser;
    this.timeDomainData = new Uint8Array(analyser.fftSize) as Uint8Array<ArrayBuffer>;
    this.frequencyData = new Float32Array(analyser.frequencyBinCount) as Float32Array<ArrayBuffer>;

        this.resumeRequested = false;
        this.clearHistory();
        this.rawLevel = 0;
        this.smoothedLevel = 0;
        this.normalizedLevel = 0;
        this.spectrum.fill(0);
        this.normalizedSpectrum.fill(0);
    }

    update(): void {
        const timestamp = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
    const updated = this.debugMode ? this.updateDebugAudio(timestamp) : this.updateLiveAudio();
        if (!updated) {
            return;
        }

        this.pushHistory(timestamp);
        this.trimHistory(timestamp);
        this.computeNormalization();
    }

    getLevel(): number {
        return this.normalizedLevel;
    }

    getSpectrum(): readonly number[] {
        return this.normalizedSpectrum;
    }

    isActive(): boolean {
        return this.debugMode || this.analyser != null;
    }

    setDebugMode(enabled: boolean): void {
        if (this.debugMode === enabled) {
            return;
        }
        this.debugMode = enabled;
        this.clearHistory();
        this.rawLevel = 0;
        this.smoothedLevel = 0;
        this.normalizedLevel = 0;
        this.spectrum.fill(0);
        this.normalizedSpectrum.fill(0);
        this.debugPhase = 0;
        if (enabled) {
            this.resumeRequested = false;
        }
    }

    toggleDebugMode(): boolean {
        this.setDebugMode(!this.debugMode);
        return this.debugMode;
    }

    isDebugMode(): boolean {
        return this.debugMode;
    }

    private updateLiveAudio(): boolean {
        if (!this.analyser || !this.timeDomainData || !this.frequencyData) {
            return false;
        }

        if (this.audioContext && this.audioContext.state === 'suspended' && !this.resumeRequested) {
            this.resumeRequested = true;
            this.audioContext.resume().catch(() => {
                this.resumeRequested = false;
            });
        }

        this.analyser.getByteTimeDomainData(this.timeDomainData);
        let sumSquares = 0;
        for (let i = 0; i < this.timeDomainData.length; i++) {
            const sample = this.timeDomainData[i] / 128 - 1;
            sumSquares += sample * sample;
        }

        const rootMeanSquare = Math.sqrt(sumSquares / this.timeDomainData.length);
        this.rawLevel = Number.isFinite(rootMeanSquare) ? rootMeanSquare : 0;
        this.smoothedLevel = this.smoothedLevel * this.amplitudeSmoothing + this.rawLevel * (1 - this.amplitudeSmoothing);

        this.analyser.getFloatFrequencyData(this.frequencyData);
        this.populateSpectrumFromFrequencyData(this.frequencyData);

        return true;
    }

    private updateDebugAudio(timestamp: number): boolean {
        const bins = this.spectrumBins;
        const phase = timestamp;
        for (let i = 0; i < bins; i++) {
            const ratio = bins > 1 ? i / (bins - 1) : 0;
            const lowBias = Math.pow(1 - ratio, 1.4);
            const wobble = 0.35 * Math.sin(phase * 2.4 + ratio * 12 + this.debugPhase);
            const rumble = 0.2 * Math.sin(phase * 0.9 + ratio * 3.0);
            const ripple = 0.1 * Math.sin(phase * 5.7 + ratio * 28.0);
            const value = clamp01(lowBias + wobble + rumble + ripple);
            this.spectrum[i] = this.spectrum[i] * this.spectrumSmoothing + value * (1 - this.spectrumSmoothing);
        }

        const lowSpan = Math.max(1, Math.floor(bins * 0.15));
        let lowSum = 0;
        for (let i = 0; i < lowSpan; i++) {
            lowSum += this.spectrum[i];
        }
        const average = lowSum / lowSpan;
        this.rawLevel = clamp01(average);
        this.smoothedLevel = this.smoothedLevel * this.amplitudeSmoothing + this.rawLevel * (1 - this.amplitudeSmoothing);
        this.debugPhase += 0.02;

        return true;
    }

    private populateSpectrumFromFrequencyData(data: Float32Array<ArrayBuffer>): void {
        const analyser = this.analyser;
        if (!analyser) {
            return;
        }

        const minDb = analyser.minDecibels;
        const maxDb = analyser.maxDecibels;
        const range = maxDb - minDb || 1;

        const bins = this.spectrumBins;
        const bucketSize = Math.max(1, Math.floor(data.length / bins));

        for (let i = 0; i < bins; i++) {
            const start = i * bucketSize;
            const end = Math.min(data.length, start + bucketSize);
            let sum = 0;
            let count = 0;
            for (let j = start; j < end; j++) {
                const normalized = (data[j] - minDb) / range;
                sum += clamp01(normalized);
                count++;
            }
            const average = count > 0 ? sum / count : 0;
            this.spectrum[i] = this.spectrum[i] * this.spectrumSmoothing + average * (1 - this.spectrumSmoothing);
        }
    }

    private pushHistory(timestamp: number): void {
        this.levelHistory.push({ time: timestamp, value: this.smoothedLevel });
        this.spectrumHistory.push({ time: timestamp, values: this.spectrum.slice() });
    }

    private trimHistory(timestamp: number): void {
        const cutoff = timestamp - HISTORY_DURATION_SECONDS;

        while (this.levelHistory.length > 0 && this.levelHistory[0].time < cutoff) {
            this.levelHistory.shift();
        }
        while (this.spectrumHistory.length > 0 && this.spectrumHistory[0].time < cutoff) {
            this.spectrumHistory.shift();
        }

        if (this.levelHistory.length > HISTORY_MAX_SAMPLES) {
            this.levelHistory.splice(0, this.levelHistory.length - HISTORY_MAX_SAMPLES);
        }
        if (this.spectrumHistory.length > HISTORY_MAX_SAMPLES) {
            this.spectrumHistory.splice(0, this.spectrumHistory.length - HISTORY_MAX_SAMPLES);
        }
    }

    private computeNormalization(): void {
        if (this.levelHistory.length === 0 || this.spectrumHistory.length === 0) {
            this.normalizedLevel = clamp01(this.smoothedLevel);
            for (let i = 0; i < this.spectrumBins; i++) {
                this.normalizedSpectrum[i] = clamp01(this.spectrum[i]);
            }
            return;
        }

        const levelValues = this.levelHistory.map((entry) => entry.value);
        const levelFloor = computePercentile(levelValues, LOWER_PERCENTILE);
        const levelCeil = computePercentile(levelValues, UPPER_PERCENTILE);
        this.normalizedLevel = this.normalizeValue(this.smoothedLevel, levelFloor, levelCeil);

        const bins = this.spectrumBins;
        const binSamples: number[][] = Array.from({ length: bins }, () => []);
        for (const entry of this.spectrumHistory) {
            const values = entry.values;
            for (let i = 0; i < bins; i++) {
                binSamples[i].push(values[i] ?? 0);
            }
        }

        for (let i = 0; i < bins; i++) {
            const samples = binSamples[i];
            const binFloor = computePercentile(samples, LOWER_PERCENTILE);
            const binCeil = computePercentile(samples, UPPER_PERCENTILE);
            this.normalizedSpectrum[i] = this.normalizeValue(this.spectrum[i], binFloor, binCeil);
        }
    }

    private normalizeValue(value: number, floor: number, ceil: number): number {
        const range = Math.max(EPSILON, ceil - floor);
        const adjusted = value - floor;
        return clamp01(adjusted / range);
    }

    private clearHistory(): void {
        this.levelHistory.length = 0;
        this.spectrumHistory.length = 0;
    }
}
