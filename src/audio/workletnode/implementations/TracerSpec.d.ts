import { AudioWorkletProcessorOptions } from "./_";

export type TracerProcessorMessageOut = {
    type: "waveform",
    wave: Float32Array[],
};
export type TracerSpec = {
    msgIn: TracerProcessorMessageIn,
    msgOut: TracerProcessorMessageOut,
    paramName: never,
};
export type TracerProcessorOptions = {
    nChunksPerStore: number,
    downsample: number,
};
export type TracerProcessorConstructData = AudioWorkletProcessorOptions<TracerProcessorOptions>;