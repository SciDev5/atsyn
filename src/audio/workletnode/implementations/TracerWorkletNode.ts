import Ensure from "../../../util/Ensure";
import RangeOf from "../../../util/RangeOf";
import { XWorkletNode } from "../XWorkletNode";
import { TracerProcessorMessageOut, TracerProcessorOptions, TracerSpec } from "./TracerSpec";
import { tsChunkSize } from "./_";

export type TracerWorkletNodeOptions = {
    nChannels?: number,
    downsample?: number,
    nChunksPerStore?: number,
};

export default class TracerWorkletNode extends XWorkletNode<TracerSpec> {

    constructor (actx:BaseAudioContext, options?:TracerWorkletNodeOptions) {
        const
            downsample      = options?.downsample ?? 4,
            nChunksPerStore = options?.nChunksPerStore ?? 20,
            channelCount    = options?.nChannels;
        Ensure.that(downsample,"downsample")
            .isInt().and
            .isInRange(RangeOf.everything.greaterThan(0)).and
            .isTrue(tsChunkSize % downsample === 0, `must be a factor of chunkSize [${tsChunkSize}]`);
            
        Ensure.that(nChunksPerStore,"nChunksPerStore")
            .isInt().and
            .isInRange(RangeOf.everything.from(1).to(100));
        if (channelCount !== undefined)
            Ensure.that(channelCount,"channelCount")
                .isIncludedIn([1,2,3,5]);

        const processorOptions:TracerProcessorOptions = {
            downsample,
            nChunksPerStore,
        };
        super(TracerWorkletNode, actx, {
            outputChannelCount:[],
            numberOfOutputs:0,
            numberOfInputs:1,
            processorOptions,
            usePort: true,
        });        
    }
    
    protected onReceiveMessage(message: TracerProcessorMessageOut, e: MessageEvent<TracerProcessorMessageOut>): void {
        switch (message.type) {
        case "waveform": {
            this.onWaves.forEach(v=>v(message.wave));
            break;
        }
        }
    }
    

    private readonly onWaves = new Set<(e:Float32Array[])=>void>();
    public addOnWave(hander:(e:Float32Array[])=>void) {
        this.onWaves.add(hander);
    }
    public removeOnWave(handler:(e:Float32Array[])=>void) {
        this.onWaves.delete(handler);
    }
}