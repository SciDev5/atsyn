import { GeneralNodeDestructor } from "../../NodeDestructor";
import SoundOperator, { BuildNodeTreeTracks } from "../../SoundOperator";
import KeyTrack from "../../track-types/KeyTrack";

export type NotesInputOutputs = {keys:KeyTrack};

export default class NotesInputOperator extends SoundOperator<void,NotesInputOutputs> {
    
    private nodes:{frequency:ConstantSourceNode,held:ConstantSourceNode}[] = [];
    
    protected buildNodeTree(actx: BaseAudioContext, outputs: BuildNodeTreeTracks<NotesInputOutputs>): void {
        this.nodes = outputs.keys.map(ent=>{
            const
                held = new ConstantSourceNode(actx,{offset:0}),
                frequency = new ConstantSourceNode(actx,{offset:400});
            ent.held.connectFrom(held);
            ent.frequency.connectFrom(frequency);
            return {held,frequency};
        });

        this.setDestructableNodes(...this.nodes.flatMap(v=>[v.held,v.frequency]));
        return;
    }
    protected startNodes(time: number, notReadyError: () => never): void {
        this.nodes.forEach(({frequency,held})=>{
            frequency.start(time);
            held.start(time);
        });
    }
    protected stopNodes(time: number, notReadyError: () => never): void {
        this.nodes.forEach(({frequency,held})=>{
            frequency.stop(time);
            held.stop(time);
        });
    }

    private prepareTimeChunkState?:{heldNotes:Set<number>,oldestReleasedNote:number};
    protected prepareTimeChunk(tStartData: number, tStartActx: number, tLength: number): void {
        return; // TODO
    }
    protected clearPrepareTimeChunkCarry(): void {
        delete this.prepareTimeChunkState;
    }


    protected readonly nodeDestructors = [
        new GeneralNodeDestructor
    ];
    protected readonly requiredModules = [

    ];

}