/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-check
/** @typedef {import("./WavetableSpec").WavetableSpec} NSpec */

const
    cent = Math.exp(Math.log(2)/1200),
    chunkLen = 128,
    maxPossibleChannels = 5,
    initPhasesRandomly = true;


// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MathExt {
    /**
     * Linerly interpolate from `a` to `b` based on `k`.
     * @param {number} a the start point
     * @param {number} b the end point
     * @param {number} k the blending factor
     * @returns the lerped value
     */
    static lerp(a,b,k) {
        return a+k*(b-a);
    }

    /**
     * Inverse Lerp, linearly "uninterpolate" `v` between `a` and `b`.
     * @param {number} a the start point
     * @param {number} b the end point
     * @param {number} v the value between `a` and `b`
     * @returns the `k` for lerp that returns `v`
     */
    static invLerp(a,b,v) {
        return (v-b)/(a-b);
    }

    /**
     * Clamp a number between 0 and 1.
     * @param {number} v
     */
    static clamp01(v) {
        return v<0?0 : v>1?1 : v;
    }
}


class VoicePhase {
    constructor() {
        this.phase = initPhasesRandomly ? Math.random() : 0;
        /** Imperceptable offset in the frequency to disrupt beats. (±0.5 cents)*/
        this.foff = cent**(Math.random()-.5);
        this.loopedAt = 0;
        // this.notLoopedYet = true;
    }
    /**
     * Increment the phase at the given frequency.
     * @param {number} atFreq the frequency to increment phase at
     * @param {number} i index for debugging
     * @param {number} sampleRate
     */
    step(atFreq,i,sampleRate) {
        // this.phase += (atFreq*this.foff)/sampleRate;
        // if (this.notLoopedYet && (this.phase >= 1 || this.phase < 0)) {
        //     this.loopedAt = i;
        //     this.phase -= Math.floor(this.phase);
        //     this.notLoopedYet = false;
        // }
        // return (this.phase%1+1)%1; // floormod basically

        this.phase += (atFreq*this.foff)/sampleRate;
        if (this.phase >= 1 || this.phase < 0) {
            this.loopedAt = i;
            this.phase -= Math.floor(this.phase);
        }
        return this.phase;


    }
    nextFrame() {
        this.loopedAt -= chunkLen;
        this.phase -= Math.floor(this.phase);
        // this.notLoopedYet = true;
    }
}

class WaveCapture {

    /** @readonly @type {number                     } */ captureFrequency;
    /** @readonly @type {number                     } */ captureLength;
    /** @readonly @type {Float32Array[]             } */ capturedData = [];
    /** @readonly @type {(wave:Float32Array[])=>void} */ sendWave;
    capturedAmount = 0;

    /**
     * @param {(wave:Float32Array[])=>void} sendWave callback for sending the wave data
     * @param {number} length length of capture
     * @param {number} frequency how often to capture data
     */
    constructor(sendWave,length,frequency) {
        this.sendWave = sendWave;
        this.captureLength = length;
        this.captureFrequency = frequency;
    }

    /**
     * 
     * @param {number} nChannels 
     */
    setNChannelsIfIncorrect(nChannels) {
        if (nChannels !== this.capturedData.length) {
            this.capturedData.length = nChannels;
            this.capturedAmount = 0;
            for (let i = 0; i < nChannels; i++)
                this.capturedData[i] = new Float32Array(this.captureLength);
        }
    }

    /**
     * 
     * @param {Float32Array[]} output 
     * @param {number} loopI
     */
    tick(output,loopI) {
        const { currentFrame, sampleRate } = globalThis;
        this.setNChannelsIfIncorrect(output.length);

        if (this.capturedAmount > 0) { // is capturing.
            const remainingSpace = this.captureLength - this.capturedAmount;
            if (chunkLen > remainingSpace) { // End of capture, collect remaining data and send it.
                this.capturedData.forEach((data,channelN)=>{
                    data.set(output[channelN].slice(0, remainingSpace), this.capturedAmount);
                });
                this.capturedAmount = 0; // mark as no longer capturing.

                this.sendWave(this.capturedData);
            } else {
                this.capturedData.forEach((data,channelN)=>{
                    data.set(output[channelN], this.capturedAmount);
                });
                this.capturedAmount += chunkLen;
                return; // prevent starting a new capture
            }

        }
        if ((currentFrame/sampleRate) % (1/this.captureFrequency) < chunkLen/sampleRate) {
            const off = Math.max(loopI,0); // we know `off < chunkLen`, so `chunkLen - off` is always positive-nonzero.
            this.capturedAmount = Math.min(chunkLen - off, this.captureLength);
            this.capturedData.forEach((data,channelN)=>{
                data.set(output[channelN].slice(off, this.captureLength+off),0);
            });
            // if data takes up the full length, it will get picked up as "0 remaining space" next tick, and sent to the main program. 
        }
    }
}


/** @typedef {"step"|"linear"} WaveTableInterpolation */

class WaveTableLookup {

    /** @readonly @type {Float32Array[]} */
    waveForms = [];
    nWaveForms = 0;
    /** @type {number} */
    waveLen;

    /**
     * 
     * @param {number} waveLen the length of an entry into the table
     */
    constructor(waveLen) {
        this.waveLen = waveLen;
    }

    /**
     * Add a waveform to the wavetable
     * @param {Float32Array} waveForm the waveform to add
     * @param {number} [i] the index to insert at (defaults to `-1` (end))
     */
    addWave(waveForm,i) {
        if (typeof i === "number")
            this.waveForms.splice(i,0,waveForm);
        else
            this.waveForms.push(waveForm);
        ++ this.nWaveForms;
    }
    /**
     * Add a waveform to the wavetable using a generator function.
     * @param {(k:number)=>number} generator the waveform generator to make the wave with (`k` in range `[0,1)`)
     * @param {number} [i] the index to insert at (defaults to `-1` (end))
     */
    genWave(generator,i) {
        const wave = new Float32Array(this.waveLen);
        wave.forEach((_,sampleN)=>
            wave[sampleN] = generator(sampleN/wave.length)
        );
        this.addWave(wave,i);
    }

    /**
     * Remove the waves in the table
     * @param {number} [newWaveLen] If provided, sets the new wavelength to use for waves.
     */
    clearWaves(newWaveLen) {
        this.waveForms.length = 0;
        if (newWaveLen)
            this.waveLen = newWaveLen;
        this.nWaveForms = 0;
    }

    /**
     * 
     * @param {Float32Array[]} waves The new waveForms to use
     * @param {number} [newWaveLen] If provided, sets the new wavelength to use for waves.
     */
    setWaves(waves, newWaveLen) {
        this.clearWaves(newWaveLen);
        if (waves.some(v=>v.length !== this.waveLen))
            throw new Error("setWaves received a wave of the wrong length");
        this.waveForms.push(...waves);
        this.nWaveForms = this.waveForms.length;

        console.log(this);
    }

    /**
     * Sample a value of the wavetable at a given slice and phase.
     * @param {number} wavePhase the sample phase offset.
     * @param {number} tablePos the waveform slice position. [0-1]
     */
    sample(wavePhase,tablePos) {
        const { waveLen, waveForms, nWaveForms} = this,
            wavePhaseI = Math.floor(wavePhase*waveLen),
            tablePosF = MathExt.clamp01(tablePos)*(nWaveForms-1),
            tablePosI = Math.floor(tablePosF),
            tablePosK = tablePosF-tablePosI;
    
        if (tablePosI >= nWaveForms - 1) // avoid issues with wave position being 1.
            return waveForms[tablePosI][wavePhaseI];
        else
            return MathExt.lerp(
                waveForms[tablePosI][wavePhaseI],
                waveForms[tablePosI+1][wavePhaseI],
                tablePosK,
            );
    }
}


export class WavetableWorkletProcessor extends AudioWorkletProcessor {

    /** The time when the node starts. */
    startAt = Infinity;
    /** The time when the node stops. */
    stopAt = Infinity;

    /** @type {WaveCapture|undefined}  */
    capture;

    /** @type {WaveTableLookup} */
    waveTableLookup;

    nVoices = 0;
    /** @readonly @type {VoicePhase[][]} */
    voicePhases;
    /** @readonly @type {VoicePhase[]} */
    centralVoicePhase;

    /**
     * Set the number of voices to use for this synth (not meant to call at playtime, will cause popping if used as such)
     * @param {number} nVoices The new number of voices to use
     */
    setNVoices(nVoices) {
        this.nVoices = nVoices;
        this.voicePhases      .forEach((_,i,a)=>a[i]= new Array(nVoices).fill(0).map(()=>new VoicePhase)); 
        this.centralVoicePhase.forEach((_,i,a)=>a[i]= new VoicePhase);
    }

    /**
     * 
     * @param {import("./WavetableSpec").WavetableProcessorConstructData} options 
     */
    constructor(options) {
        super();
        const { processorOptions } = options;

        
        const nChannels = (options.outputChannelCount ?? [maxPossibleChannels])[0];
        this.voicePhases       = new Array(nChannels).fill([]);
        this.centralVoicePhase = new Array(nChannels).fill([]);
        
        this.setNVoices(processorOptions.nVoices);
        this.waveTableLookup = new WaveTableLookup(0);
        this.waveTableLookup.setWaves(
            processorOptions.waveforms,
            processorOptions.waveforms[0].length,
        );

        /** @type {(e:MessageEvent<import("./WavetableSpec").WavetableProcessorMessageIn>)=>void} */
        this.port.onmessage = e=>{
            const
                { data } = e,
                res = () => ("reqN" in data) ? this.send({type:"confirm",reqN:data.reqN}) : void 0;
            switch (data.type) {
            case "setNVoices": {
                this.setNVoices(data.nVoices);
                res();
                break;
            }
            case "capture": {
                if (data.enabled)
                    this.capture = new WaveCapture(
                        wave=>this.send({type:"waveform",wave}),
                        data.length,
                        data.frequency,
                    );
                else
                    delete this.capture;
                res();
                break;
            }
            case "setWaveforms": {
                this.waveTableLookup.setWaves(
                    data.waveforms,
                    data.waveforms[0].length,
                );
                res();
                break;
            }
            case "stop" : this. stopAt = Math.min(this. stopAt, data.time ?? -Infinity); break;
            case "start": this.startAt = Math.min(this.startAt, data.time ?? -Infinity); break;
            }
        };
    }
    /**
     * 
     * @param {Float32Array[][]} inputs 
     * @param {Float32Array[][]} outputs 
     * @param {{[pName in NSpec["paramName"]]:Float32Array}} parameters 
     * @returns {boolean}
     */
    process (inputs, outputs, parameters) {

        const { currentTime } = globalThis;
        if (currentTime > this.stopAt) return false; // If stopped, don't render and mark the node ready for cleanup.
        if (currentTime < this.startAt) return true; // If not started yet, don't render, but keep the node alive.

        const {
                frequency,
                detune,
                chorus,
                wavePosition,
            } = parameters,
            frequencyIn  = frequency    .length === 1 ? new Float32Array(chunkLen).fill(frequency   [0]) : frequency   ,
            detuneIn     = detune       .length === 1 ? new Float32Array(chunkLen).fill(detune      [0]) : detune      ,
            chorusIn     = chorus       .length === 1 ? new Float32Array(chunkLen).fill(chorus      [0]) : chorus      ,
            wavePosIn    = wavePosition .length === 1 ? new Float32Array(chunkLen).fill(wavePosition[0]) : wavePosition;

        const centralPhase = this.nVoices&1 ? this.voicePhases[0][Math.floor(this.voicePhases.length/2)] : this.centralVoicePhase[0];

        if (chunkLen !== outputs[0][0].length) throw new Error("chunkLen was incorrect");
        
        // this.processBaseWave(outputs[0][0],0,{
        //     frequencyIn,
        //     chorusIn,
        //     detuneIn,
        //     wavePosIn,
        // });
        // outputs[0][1].set(outputs[0][0]);

        outputs[0].forEach((channelData,channelN) => {
            this.processBaseWave(channelData,channelN,{
                frequencyIn,
                chorusIn,
                detuneIn,
                wavePosIn,
            });
        });
        this.capture?.tick(outputs[0], centralPhase.loopedAt);
        
        outputs[0].forEach((_,i)=>{
            this.voicePhases[i].forEach(v=>v.nextFrame());
        });

        return true;
    }

    /**
     * Calculate the base wave at a channel.
     * @param {Float32Array} output the float32array to output to
     * @param {number} channelN the channel to use the voicePhases from
     * @param {{[k in "frequencyIn"|"detuneIn"|"chorusIn"|"wavePosIn"]:Float32Array}} parameters normalized parameter data
     */
    processBaseWave(output,channelN,parameters) {
        const
            { frequencyIn, chorusIn, detuneIn, wavePosIn} = parameters,
            voicePhases = this.voicePhases[channelN],
            centralVoicePhase = this.centralVoicePhase[channelN],
            chunkLen_ = output.length,
            nVoices = voicePhases.length,
            { sampleRate } = globalThis,
            { waveTableLookup, centralPhaseN } = this;
        for (let i = 0; i < chunkLen_; ++i) {
            const
                frequency = frequencyIn [i],
                detune    = detuneIn    [i],
                chorus    = chorusIn    [i],
                wavePos   = wavePosIn   [i];
    
            let out = 0, outMag = 0;
            let n = nVoices;
            while (n--) {
                const voiceOffset = nVoices === 1 ? 0 : (n / (nVoices - 1))*2 - 1,
                    voiceFrequency = frequency * (cent ** (detune*voiceOffset)),
                    magnitude = Math.abs(n-centralPhaseN) < 0.6 ? 1 : Math.exp(-(.5+Math.abs(voiceOffset))/chorus/Math.LOG2E),
                    samplePhase = magnitude > 0 ? voicePhases[n].step(voiceFrequency,i,sampleRate) : 0;
                out += waveTableLookup.sample(samplePhase,wavePos) * magnitude;
                outMag += magnitude;
            }
            out /= outMag;
                    
            if (nVoices & 1) {
                output[i] = out;
            } else {
                const outC = waveTableLookup.sample(centralVoicePhase.step(frequency,i,sampleRate),wavePos);
                output[i] = outC + Math.min(1,chorus) * (out - outC);
            }
    
            // detune; chorus;
            // channelData[i] = centralPhase.step(frequency,i)*2-1;
        }
    }
    get centralPhaseN() {
        return (this.voicePhases[0].length-1)*.5;
    }

    /**
     * @returns {Iterable<AudioParamDescriptor<NSpec["paramName"]>>}
     */
    static get parameterDescriptors() {
        const { sampleRate } = globalThis;
        return [
            {
                name: "frequency",
                minValue: -sampleRate/2,
                maxValue: sampleRate/2,
                defaultValue: 440,
                automationRate: "a-rate",
            },
            {
                name: "detune",
                minValue: -100,
                maxValue: 100,
                defaultValue: 30,
                automationRate: "a-rate",
            },
            {
                name: "chorus",
                minValue: 0,
                defaultValue: 1,
                automationRate: "a-rate",
            },
            {
                name: "wavePosition",
                minValue: 0,
                maxValue: 1,
                automationRate: "a-rate",
            }
        ];
    }

    /**
     * 
     * @param {import("./WavetableSpec").WavetableProcessorMessageOut} msg 
     * @param {Transferable[]} [transfer]
     */
    send(msg,transfer) {
        if (transfer)
            this.port.postMessage(msg,transfer);
        else
            this.port.postMessage(msg);
    }

}
registerProcessor("", WavetableWorkletProcessor);