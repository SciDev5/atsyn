import XWorkletNodeLoader from "../workletnode/XWorkletNode";
import NodeDestructor from "./NodeDestructor";
import { SomeTrackFiberOrBundle, TrackBundle, TrackFiber } from "./Track";


class BuildNodeTreeTracksEntry {
    constructor(
        private readonly actx:BaseAudioContext,
        private readonly node:AudioParam|AudioNode,
        private readonly inputN?:number,
        private readonly clearParam=true,
    ) {}

    public connectFrom(srcNode:AudioNode,outputN?:number) {
        if (this.node instanceof AudioNode) {
            srcNode.connect(this.node,outputN,this.inputN);
        } else {
            if (this.clearParam) { // Allow the param to be driven purely by it's connections.
                this.node.cancelScheduledValues(this.actx.currentTime);
                this.node.value = 0;
            }
            srcNode.connect(this.node,outputN);
        }
    }
}
type Z<T extends SomeTrackFiberOrBundle> =
    T extends TrackFiber ? 
        BuildNodeTreeTracksEntry : 
    T extends TrackBundle<{[k: string]:SomeTrackFiberOrBundle}> ?
        {[k in keyof T["_"]]:Z<T["_"][k]>} : 
    T extends TrackBundle<SomeTrackFiberOrBundle[]> ?
        Z<T["_"][number]>[]
    : never;
export type BuildNodeTreeTracks<T extends SoundOpIOData> = {[k in keyof T]:Z<T[k]>};

export type SoundOpIOData = {[key: string]: SomeTrackFiberOrBundle};

export default abstract class SoundOperator<TIn extends SoundOpIOData|void, TOut extends SoundOpIOData> {
    // TODO implementation
    public TEMP_BUILD_NODETREE(actx:BaseAudioContext,outputs:BuildNodeTreeTracks<TOut>): TIn extends SoundOpIOData ? BuildNodeTreeTracks<TIn> : void {
        this._actx = actx;
        return this.buildNodeTree(actx,outputs);
    }
    public TEMP_GEN_BNTTracksEntry(
        actx:BaseAudioContext,
        node:AudioParam|AudioNode,
        inputN?:number
    ) { return new BuildNodeTreeTracksEntry(actx,node,inputN) }
    public TEMP_START(t:number) {
        this.startNodes(t,()=>{throw new Error("oh no, startnodes doesn't like me")});
    }
    public TEMP_STOP(t:number) {
        this.stopNodes(t,()=>{throw new Error("oh no, stopnodes doesn't like me")});
    }




    /**
     * Build the audio graph for this operator.
     * Outputs are passed in, inputs must be populated by this
     */
    protected abstract buildNodeTree(actx:BaseAudioContext,outputs:BuildNodeTreeTracks<TOut>): TIn extends SoundOpIOData ? BuildNodeTreeTracks<TIn> : void;

    /**
     * Start all startable nodes at the given time.
     * @param time the time to start them at.
     * @param notReadyError a function that can be called to throw if the SoundOperator is not ready. (shouldn't happen, but the common assertion is useful).
     */
    protected abstract startNodes(time:number,notReadyError:()=>never):void;
    /**
      * Stop all stoppable nodes at the given time.
      * @param time the time to stop them at.
      * @param notReadyError a function that can be called to throw if the SoundOperator is not ready. (shouldn't happen, but the common assertion is useful).
      */
    protected abstract stopNodes(time:number,notReadyError:()=>never):void;

    /**
     * Prepare timed controls for a chunk of time, such as parameter automation.
     * @param tStartData The time offset in the source data to start preparing at
     * @param tStartActx The real context time to prepare at.
     * @param tLength The length of the chunk to prepare.
     */
    protected prepareTimeChunk(tStartData:number,tStartActx:number,tLength:number):void {
        // no default behavior.
    }
    /**
     * Clear any carried state created by `prepareTimeChunk`.
     */
    protected clearPrepareTimeChunkCarry():void {
        // no default behavior.
    }

    protected abstract readonly nodeDestructors:NodeDestructor<AudioNode>[];
    private readonly destructableNodes = new Set<AudioNode>();
    protected setDestructableNodes(...nodes:AudioNode[]) {
        nodes.forEach(node=>
            this.destructableNodes.add(node)
        );
    }
    public destruct() {
        this.destructableNodes.forEach(node=>{
            this.nodeDestructors.forEach(destructor=>{
                if (destructor.worksOn(node))
                    destructor.destruct(node);
            });
        });
        this.destructableNodes.clear();
    }

    private _actx?:BaseAudioContext;
    protected exportNode(node:AudioNode,inputN?:number):BuildNodeTreeTracksEntry;
    protected exportNode(node:AudioParam):BuildNodeTreeTracksEntry;
    protected exportNode(node:AudioNode|AudioParam,inputN?:number):BuildNodeTreeTracksEntry {
        return new BuildNodeTreeTracksEntry(this._actx!,node,inputN);
    }

    protected abstract readonly requiredModules:XWorkletNodeLoader[];
}
