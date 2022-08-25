import Ensure from "../../../util/Ensure";
import RangeOf from "../../../util/RangeOf";
import { XWorkletNode } from "../XWorkletNode";
import { WavetableProcessorMessageIn, WavetableProcessorMessageOut, WavetableProcessorOptions, WavetableSpec } from "./WavetableSpec";

export type WavetableWorkletNodeOptions = {numberOfChannels?:number,nVoices?:number,waveforms?:Float32Array[]};

export default class WavetableWorkletNode extends XWorkletNode<WavetableSpec> {

    constructor (actx:BaseAudioContext, options?:WavetableWorkletNodeOptions) {
        const
            nVoices = options?.nVoices ?? 5,
            waveforms = [...options?.waveforms ?? [0,0].map(()=>new Float32Array(256))];

        const nChannels = options?.numberOfChannels ?? 2;
        const processorOptions:WavetableProcessorOptions = {
            nVoices,
            waveforms,
        };
        super(WavetableWorkletNode, actx, {
            outputChannelCount:[nChannels],
            numberOfInputs:0,
            numberOfOutputs:1,
            processorOptions,
            usePort: true,
        });

        this._nVoices = 5;
        this._waveforms = waveforms;
    }
    
    private async requestMessage(message:WavetableProcessorMessageIn|Omit<WavetableProcessorMessageIn,"reqN">) {
        await this.awaitRequest(reqN=>this.sendMessage({...message,reqN} as WavetableProcessorMessageIn)); 
    }

    public start(time?:number) {
        this.sendMessage({type:"start",time});
    }
    public stop(time?:number) {
        this.sendMessage({type:"stop",time});
    }

    private _nVoices;
    get nVoices() { return this._nVoices }
    set nVoices(v:number) { this.setNVoices(this._nVoices) }
    public async setNVoices(nVoices:number) {
        Ensure.that(nVoices,"nVoices")
            .isInt().and
            .isInRange(RangeOf.everything.from(1).to(20));
        this._nVoices = nVoices;
        await this.requestMessage({type:"setNVoices",nVoices});
    }

    private _capture:false|{frequency:number,length:number} = false;
    public get capture() { return structuredClone(this._capture) }
    public async setCapture(enabled:false):Promise<void>;
    public async setCapture(enabled:true,frequency:number,length:number):Promise<void>;
    public async setCapture(enabled:boolean,frequency?:number,length?:number) {
        if (enabled) {
            Ensure.that(length,"capture length")
                .isInt().and
                .isInRange(RangeOf.everything.greaterThanOrEqualTo(1));
            Ensure.that(frequency,"capture frequency")
                .isFinite().and
                .isInRange(RangeOf.everything.greaterThan(0));
        }
        this._capture = enabled && { frequency: frequency!, length: length! };
        await this.requestMessage(enabled ? {
            type: "capture",
            enabled,
            frequency: frequency!,
            length: length!,
        } : {
            type:"capture",
            enabled,
        });
    }

    private readonly _waveforms:Float32Array[];
    public get waveforms() { return [...this._waveforms] }
    public get waveLen() { return this._waveforms[0].length }
    public async setWaveforms(waveforms: Float32Array[]) {
        Ensure.thatSomething("waveforms")
            .isTrue(waveforms.length >= 2, "length must be at least 2").and
            .isTrue(waveforms.every(v=>v.length===waveforms[0].length),"must all have the same length");
        
        this._waveforms.length = 0;
        this._waveforms.push(...waveforms);
        await this.requestMessage({
            type: "setWaveforms",
            waveforms,
        });
    }


    
    protected onReceiveMessage(message: WavetableProcessorMessageOut, e: MessageEvent<WavetableProcessorMessageOut>): void {
        switch (message.type) {
        case "waveform": {
            this.onWaves.forEach(v=>v(message.wave));
            break;
        }
        case "confirm": {
            this.resolveRequestN(message.reqN);
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