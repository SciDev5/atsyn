export type AudioWorkletProcessorOptions<T> = Omit<AudioWorkletNodeOptions,"processorOptions">&{processorOptions:T};

export const tsChunkSize = 128;