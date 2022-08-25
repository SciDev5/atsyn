import { wavetableWorkletNodeLoader } from "../../workletnode/audioWorkletNodes";
import WavetableWorkletNode from "../../workletnode/implementations/WavetableWorkletNode";
import { GeneralNodeDestructor, StoppableNodeDestructor } from "../NodeDestructor";
import SoundOperator, { BuildNodeTreeTracks } from "../SoundOperator";
import { TrackFiber } from "../Track";

export type TSynInputs = {noteOn:TrackFiber,frequency:TrackFiber};
export type TSynOutputs = {audio:TrackFiber};

export default class TSynOperator extends SoundOperator<TSynInputs,TSynOutputs> {
    private nodes: null | {
        funky: WavetableWorkletNode,
        gain: GainNode,
    } = null;

    protected buildNodeTree(actx: BaseAudioContext, outputs: BuildNodeTreeTracks<TSynOutputs>): BuildNodeTreeTracks<TSynInputs> {
        const Z = new Float32Array(512); Z.forEach((v,i,a)=>a[i]=i/a.length);
        const funky = new WavetableWorkletNode(actx,{waveforms:[
            Z.map(i=>Math.abs(i-.5)*4-1),
            // Z.map(i=>i*2-1),
            Z.map(i=>i>.5?-1:1),
            // new Float32Array(512).map((_,i)=>Math.sin(i*2*Math.PI)),
        ]});
        const gain = new GainNode(actx,{gain:0});
        
        this.nodes = { funky, gain };
        
        funky.connect(gain);
        outputs.audio.connectFrom(gain);
        
        this.setDestructableNodes(funky, gain);
        return {
            noteOn: this.exportNode(gain.gain),
            frequency: this.exportNode(funky._.frequency),
        };
    }

    protected startNodes(time: number, notReadyError: () => never): void {
        const {nodes} = this;
        if (!nodes) notReadyError();
        nodes.funky.start(time);
    }
    protected stopNodes(time: number, notReadyError: () => never): void {
        const {nodes} = this;
        if (!nodes) notReadyError();
        nodes.funky.stop(time);
    }

    protected readonly nodeDestructors = [
        new GeneralNodeDestructor,
        new StoppableNodeDestructor,
    ];

    protected readonly requiredModules = [
        wavetableWorkletNodeLoader,
    ];
}
