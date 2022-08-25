import Ensure from "../../../../util/Ensure";
import RangeOf from "../../../../util/RangeOf";
import { GeneralNodeDestructor } from "../../NodeDestructor";
import SoundOperator, { BuildNodeTreeTracks } from "../../SoundOperator";
import { NotesInputOutputs } from "./NotesInput";

export class LiveNote {
    constructor(
        private readonly actx:BaseAudioContext,
        public readonly startedAt:number,
        private readonly _stop:()=>void,
        public readonly pitchBend:(targetNoteN:number,delay:number)=>void,
        private _stoppedAt?:number,
    ) {}

    public onLost?:()=>void;
    public stop() {
        this._stop();
        this._stoppedAt = this.actx.currentTime;
    }
    public get stoppedAt() { return this._stoppedAt }
    public get stopped() { return this._stoppedAt !== undefined }
}

export default class LiveNotesInputOperator extends SoundOperator<void,NotesInputOutputs> {
    
    private nodes:{frequency:ConstantSourceNode,held:ConstantSourceNode}[] = [];
    private actx?:BaseAudioContext;
    
    protected buildNodeTree(actx: BaseAudioContext, outputs: BuildNodeTreeTracks<NotesInputOutputs>): void {
        this.nodes = outputs.keys.map(ent=>{
            const
                held = new ConstantSourceNode(actx,{offset:0}),
                frequency = new ConstantSourceNode(actx,{offset:400});
            ent.held.connectFrom(held);
            ent.frequency.connectFrom(frequency);
            return {held,frequency};
        });
        this.actx = actx;

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

    private noteNToFrequency(n:number):number {
        return 440*2**(n/12);
    }

    private readonly playingNotes:LiveNote[] = [];
    public playNote(noteN:number):LiveNote {
        if (!this.actx) throw new Error("must wait for nodes to be built before platying notes");
        if (this.playingNotes.length !== this.nodes.length) {
            this.playingNotes.length = this.nodes.length;
            this.playingNotes.fill(new LiveNote(
                this.actx,
                -Infinity,
                ()=>void 0,
                ()=>void 0,
                -Infinity
            ));
        }
        const stoppedNotes = this.playingNotes.map((v,i)=>({v,i})).filter(({v:note}) => note.stopped);
        
        const targetNoteI = (
            stoppedNotes.length === 0 ?
                this.playingNotes.slice().map((v,i)=>({v,i})).sort(({v:a},{v:b})=>a.startedAt-b.startedAt) : // sort oldest first
                stoppedNotes.sort(({v:a},{v:b})=>a.stoppedAt!-b.stoppedAt!) // sort oldest first
        )[0].i; // get the oldest (the first one).
        const oldNote = this.playingNotes[targetNoteI];
        
        if (!oldNote.stopped)
            oldNote.stop();

        const node = this.nodes[targetNoteI];
        node.held      .offset.setValueAtTime( 1,                            this.actx.currentTime );
        node.frequency .offset.setValueAtTime( this.noteNToFrequency(noteN), this.actx.currentTime );
        
        const newNote = new LiveNote(this.actx,this.actx.currentTime,()=>{
            // Stop function.
            if (!this.actx || node.frequency.context !== this.actx) return; // If the context changed, no need to schedule values.
            if (this.playingNotes[targetNoteI] !== newNote) return; // If the note changed, we don't want to mess up new data.
            node.held.offset.setValueAtTime(0,this.actx.currentTime);
        },(targetNoteN,delay)=>{
            Ensure.that(delay,"pitchBend:delay").isInRange(RangeOf.everything.greaterThan(0.001));
            // Pitchbend function.
            if (!this.actx || node.frequency.context !== this.actx) return; // If the context changed, no need to schedule values.
            if (this.playingNotes[targetNoteI] !== newNote) return; // If the note changed, we don't want to mess up new data.
            const now = this.actx.currentTime;
            node.frequency.offset.cancelScheduledValues(now);
            node.frequency.offset.setValueAtTime(node.frequency.offset.value,now+0.001);
            node.frequency.offset.exponentialRampToValueAtTime(this.noteNToFrequency(targetNoteN),now+delay);
        });
        this.playingNotes[targetNoteI] = newNote;
        return newNote;
    }


    protected readonly nodeDestructors = [
        new GeneralNodeDestructor
    ];
    protected readonly requiredModules = [

    ];

}