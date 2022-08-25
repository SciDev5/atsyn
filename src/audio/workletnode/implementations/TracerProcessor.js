/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-check
/** @typedef {import("./TracerSpec").TracerSpec} NSpec */

const chunkLen = 128;

export class TestWorkletProcessor extends AudioWorkletProcessor {

    /** @readonly @type {Float32Array} */ zeroes;

    /** @readonly @type {Float32Array[]} */
    storedData = [];
    storedChunks = 0;

    /** @readonly @type {number} */ nChunksPerStore;
    /** @readonly @type {number} */ downsample;

    /**
     * 
     * @param {import("./TracerSpec").TracerProcessorConstructData} options 
     */
    constructor(options) {
        super();

        this.nChunksPerStore = options.processorOptions.nChunksPerStore;
        this.downsample = options.processorOptions.downsample;
        this.zeroes = new Float32Array(chunkLen/this.downsample);
    }
    /**
     * 
     * @param {Float32Array[][]} inputs 
     * @param {Float32Array[][]} outputs 
     * @param {{[pName in NSpec["paramName"]]:Float32Array}} parameters 
     * @returns {boolean}
     */
    process (inputs, outputs, parameters) {
        const { zeroes, downsample, nChunksPerStore } = this;
        this.updateNChannelsIfIncorrect(inputs[0].length);
        inputs[0].forEach((inputChannel,channelN)=>{
            let i = chunkLen;
            const chunk = this.storedData[channelN];
            chunk.set(zeroes,this.storedChunks*chunkLen/downsample);
            while (i--)
                chunk[Math.floor(i+this.storedChunks*chunkLen)/downsample] += inputChannel[i];
        });
        ++this.storedChunks;

        if (this.storedChunks === nChunksPerStore) {
            this.storedChunks = 0;
            this.send({
                type: "waveform",
                wave: this.storedData,
            });
        }

        return false;
    }


    /**
     * 
     * @param {number} nChannels the real number of channels
     */
    updateNChannelsIfIncorrect(nChannels) {
        if (this.storedData.length !== nChannels) {
            this.storedData.length = nChannels;
            this.storedData.fill(this.storedData[0]);
            this.storedData.forEach((_,i)=>
                this.storedData[i] = new Float32Array(this.nChunksPerStore * chunkLen / this.downsample)
            );
        }
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
registerProcessor("", TestWorkletProcessor);