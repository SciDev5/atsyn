import { Connection } from "../nodeGraph/Connection";
import Node from "../nodeGraph/Node";
import Port from "../nodeGraph/Port";
import { PortSide, TPortSide } from "../nodeGraph/PortSide";

export type BuiltAudioNodes = {
    stoppables?: (AudioNode & {stop(when?:number):void})[],
    handleReleases?: (()=>void)[],
    nodes: AudioNode[],
    inputs: {[connId:symbol]:{isParam:true,param:AudioParam}|{isParam?:false,node:AudioNode,inputI?:number}},
    outputs: {[connId:symbol]:{node:AudioNode,outputI?:number}},
};
export default abstract class AudioGraphNode extends Node {
    private builtNodes?:BuiltAudioNodes;
    private actx?:AudioContext;
    private _playing = false;
    private _built = false;
    get playing() { return this._playing }
    async play(actx:AudioContext,startTime=actx.currentTime) {
        if (this._playing) throw new Error("already playing audio, call stop first");
        this._playing = true;
        this.actx = actx;
        this.builtNodes = await this.buildNodes(actx,startTime);
        this._built = true;
    }
    async stop(when?:number) {
        if (!this.builtNodes || !this.actx) return;
        this.builtNodes.stoppables?.forEach(v=>v.stop(when));
        const { actx } = this;
        if (when !== undefined)
            while (actx.currentTime < when)
                await new Promise<void>(res=>setTimeout(res,900*actx.currentTime));
        this.builtNodes.stoppables?.forEach(v=>v.disconnect());
        this.builtNodes.nodes.forEach(v=>v.disconnect());
        this.builtNodes.handleReleases?.forEach(v=>v());
        this._playing = false;
        this._built = false;
        delete this.actx;
    }
    get connectedToNodes() {
        type Z = {remoteNode:AudioGraphNode,conn:Connection,connId:symbol};
        const inNodes:Z[] = [], outNodes:Z[] = [];
        for (const conn of this.connections) {
            const isOutput = conn.from.node === this;
            const remoteNode = (isOutput ? conn.to : conn.from).node;
            if (remoteNode instanceof AudioGraphNode)
                (isOutput ? outNodes : inNodes).push({ remoteNode, conn, connId:conn.id });
            else throw new Error("AudioGraphNode was connected to non AudioGraphNode");
        }
        return { inNodes, outNodes };
    }
    connectBuilt() {
        const {inNodes,outNodes} = this.connectedToNodes;
        if (
            !this._built ||
            !inNodes.every(v=>v.remoteNode._built) ||
            !outNodes.every(v=>v.remoteNode._built)
        ) throw new Error("cannot connect unbuilt nodes");
        this.checkBuiltSide(this.builtNodes!.inputs,inNodes.map(v=>v.conn),false);
        this.checkBuiltSide(this.builtNodes!.outputs,outNodes.map(v=>v.conn),true);


        for (const inp of inNodes) {
            const fromOut = inp.remoteNode.builtNodes!.outputs[inp.connId];
            const thisIn = this.builtNodes!.inputs[inp.connId];

            if (thisIn.isParam)
                fromOut.node.connect(thisIn.param,fromOut.outputI);
            else
                fromOut.node.connect(thisIn.node,fromOut.outputI,thisIn.inputI);
        }
    }
    protected abstract buildNodes(actx:AudioContext,startTime:number):Promise<BuiltAudioNodes>|BuiltAudioNodes;
    private checkBuiltSide(
        built:BuiltAudioNodes["inputs"]|BuiltAudioNodes["outputs"],
        connections:Connection[],
        isOutput:boolean,
    ) {
        for (const conn of connections)
            if (!(conn.id in built))
                throw new Error(`Unhandled ${isOutput ? "output" : "input"} connection. [Node: '${this.constructor.name}'; Row: '${(isOutput ? conn.from : conn.to).row.constructor.name}']`);
    }
    protected get nodeBuildEmptyIOPuts() {
        return {
            inputs: {} as BuiltAudioNodes["inputs"],
            outputs: {} as BuiltAudioNodes["outputs"],
        };
    }

    protected assignBuildPort<Side extends TPortSide>(
        puts:BuiltANodePutsBySide<Side>, port:Port<Side>, value:BuiltANodePutsBySide<Side>[symbol]
    ):void {
        for (const conn of port.connections)
            puts[conn.id] = value;
    }
}
    type BuiltANodePutsBySide<Side extends TPortSide> = Side extends typeof PortSide["OUTPUT"] ? BuiltAudioNodes["outputs"] : BuiltAudioNodes["inputs"];