import AudioGraphNode, { BuiltAudioNodes } from "../AudioGraphNode";
import { PortInRow } from "./row/PortRow";

export default class DestGraphNode extends AudioGraphNode {
    readonly in:PortInRow = new PortInRow(this.genericRowInitData,"destination");
    readonly Header = "destination";
    buildNodes(actx:AudioContext):BuiltAudioNodes {
        const {inputs,outputs} = this.nodeBuildEmptyIOPuts;

        this.assignBuildPort(inputs, this.in.port, { node: actx.destination });

        return {
            nodes: [],
            inputs, outputs,
        };
    }
}