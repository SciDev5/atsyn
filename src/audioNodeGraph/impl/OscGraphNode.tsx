import React from "react";
import AudioGraphNode, { BuiltAudioNodes } from "../AudioGraphNode";
import InputRow from "./row/InputRow";
import { PortOutRow } from "./row/PortRow";
import SelectRow from "./row/SelectRow";


export default class OscGraphNode extends AudioGraphNode {
    readonly type = new SelectRow(this.genericRowInitData, { sine: "Sine", sawtooth: "Sawtooth", square: "Square" }, "sine");
    readonly freq: InputRow = new InputRow(this.genericRowInitData, ({connected})=>(connected?"+ ":"")+"frequency", 440, v => (v <= 48000 && v >= -48000));
    readonly out: PortOutRow = new PortOutRow(this.genericRowInitData, "waveform");
    readonly Header = () => (<>oscillator ({this.freq.valueTarget.useState()}hz)</>);
    buildNodes(actx: AudioContext, startTime: number): BuiltAudioNodes {
        const { inputs, outputs } = this.nodeBuildEmptyIOPuts;
        const osc = new OscillatorNode(actx, { frequency: this.freq.value });
        osc.type = this.type.value;
        osc.start(startTime);

        const freqHandleRelease = this.freq.valueTarget.on(freq=>{
            osc.frequency.value = freq;
        });
        const typeHandleRelease = this.type.valueTarget.on(type=>{
            osc.type = type;
        });

        this.assignBuildPort(inputs, this.freq.port, { isParam: true, param: osc.frequency });
        this.assignBuildPort(outputs, this.out.port, { node: osc });

        return {
            nodes: [osc],
            stoppables: [osc],
            handleReleases: [freqHandleRelease,typeHandleRelease],
            inputs, outputs,
        };
    }
}
