import { NodeContext } from "../nodeGraph/Node";
import { ValueSource } from "../util/ValueTarget";
import AudioGraphNode from "./AudioGraphNode";
import DestGraphNode from "./impl/DestGraphNode";
import GainGraphNode from "./impl/GainGraphNode";
import OscGraphNode from "./impl/OscGraphNode";

export default class AudioGraphNodeContext extends NodeContext {
    readonly allowedNodes = [
        OscGraphNode,
        GainGraphNode,
        DestGraphNode,
    ] as const;
    get currentlyCreatableNodes() {
        if (![...this.nodes].find(v=>v instanceof DestGraphNode))
            return [ DestGraphNode ];
        return [
            OscGraphNode,
            GainGraphNode,
        ];
    }
    set currentlyCreatableNodes(value) { /* Absorb this event, but still have it present so TypeScript doesn't break. */}

    private get nodesArr() {
        return [...this.nodes] as AudioGraphNode[];
    }

    private readonly playingVSource = new ValueSource<boolean>(false);
    readonly playingV = this.playingVSource.target;
    private _actx?:AudioContext;
    private set actx(value:AudioContext|undefined) {
        this._actx = value;
        this.playingVSource.assign(!!value);
    }

    get playing() { return this.playingV.value }

    async start(actx:AudioContext,when?:number) {
        if (this.playing) throw new Error("tried to play audio while audio was already playing");
        this.actx = actx;

        const { nodesArr } = this;

        await Promise.all(nodesArr.map(node=> node.play(actx,when) ));
        for (const node of nodesArr) node.connectBuilt();
    }
    async stop(when?:number) {
        if (!this.playing) throw new Error("tried to stop audio after audio was already stopped");

        const { nodesArr } = this;
        await Promise.all(nodesArr.map(node=> node.stop(when) ));

        this.actx = undefined;
    }
}