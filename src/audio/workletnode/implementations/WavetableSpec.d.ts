import { AudioWorkletProcessorOptions } from "./_";

export type WavetableProcessorMessageIn = {reqN:number} & ({
    type: "setNVoices",
    nVoices: number,
} | {
    type: "capture",
    enabled: true,
    length: number,
    frequency: number,
} | {
    type: "capture",
    enabled: false,
} | {
    type: "setWaveforms",
    waveforms: Float32Array[],
}) | {
    type: "stop"|"start",
    time?: number,
};
export type WavetableProcessorMessageOut = {
    type: "waveform",
    wave: Float32Array[],
} | {
    type: "confirm",
    reqN: number,
};
export type WavetableSpec = {
    msgIn: WavetableProcessorMessageIn,
    msgOut: WavetableProcessorMessageOut,
    paramName: "frequency"|"detune"|"chorus"|"wavePosition",
};
export type WavetableProcessorOptions = {
    nVoices:number,
    waveforms:Float32Array[],
};
export type WavetableProcessorConstructData = AudioWorkletProcessorOptions<WavetableProcessorOptions>;