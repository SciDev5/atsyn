export default interface NotePress {
    /** The time to start the note press at in beats. */ readonly tStart:number;
    /** The time to end   the note press at in beats. */ readonly tEnd  :number;

    /** Note frequency in semitones relative to A4 (440hz) */
    readonly note:number;
    /** The pitchbend keyframes, `t` relative to `tStart` in beats and `bend` in semitones relative to `note` */
    readonly pitchBend?:{t:number,bend:number}[];

}