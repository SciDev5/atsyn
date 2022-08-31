import React from "react";
import AudioGraphNode, { BuiltAudioNodes } from "../AudioGraphNode";
import InputRow from "./row/InputRow";
import { PortBothRow } from "./row/PortRow";


export default class GainGraphNode extends AudioGraphNode {
    readonly wave: PortBothRow = new PortBothRow(this.genericRowInitData, "waveform");
    readonly gain: InputRow = new InputRow(this.genericRowInitData, ({connected})=>(connected?"+ ":"")+"gain", 1);
    readonly Header = () => {
        const gain = this.gain.valueTarget.useState();
        return (
            <>gain ({(Math.log10(Math.abs(gain))*10).toFixed(1)}db)</>
        );
    };
    buildNodes(actx: AudioContext): BuiltAudioNodes {
        const { inputs, outputs } = this.nodeBuildEmptyIOPuts;
        const gain = new GainNode(actx, { gain: this.gain.value });

        const gainHandleRelease = this.gain.valueTarget.on(gainV=>{
            gain.gain.value = gainV;
        });

        this.assignBuildPort(inputs, this.gain.port, { isParam: true, param: gain.gain });
        this.assignBuildPort(inputs, this.wave.portIn, { node: gain });
        this.assignBuildPort(outputs, this.wave.portOut, { node: gain });

        return {
            nodes: [gain],
            handleReleases: [gainHandleRelease],
            inputs, outputs,
        };
    }
}
