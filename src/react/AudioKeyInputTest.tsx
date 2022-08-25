import React from "react";
import TSynOperator from "../audio/sound-operator/implementations/TSyn";
import LiveNotesInputOperator, { LiveNote } from "../audio/sound-operator/implementations/_core/LiveNotesInput";
import { wavetableWorkletNodeLoader } from "../audio/workletnode/audioWorkletNodes";
import WavetableWorkletNode from "../audio/workletnode/implementations/WavetableWorkletNode";

const actx = new AudioContext, modulesReady = Promise.all([wavetableWorkletNodeLoader.addModuleToContext(actx)]);

function keyToNoteN(key:string):number|undefined {
    const n = "zsxcfvgbnjmk,l.q2w3er5t6y7ui9o0p[=]".split("").indexOf(key);
    if (n === -1) return;
    else return n;
}

export default class AudioKeyInputTest extends React.Component {

    readonly tSynOps = [0,0,0,0].map(()=>new TSynOperator);
    readonly inOp = new LiveNotesInputOperator;

    started = false;


    buildNodetree() {
        const tO = this.tSynOps.map(sO=>sO.TEMP_BUILD_NODETREE(actx,{
            audio: sO.TEMP_GEN_BNTTracksEntry(actx,actx.destination)
        }));

        this.tSynOps.map(tO=>{
            const {nodes} = tO as never as {nodes:{funky:WavetableWorkletNode}};
            
            nodes.funky.setNVoices(7);
            // const t = actx.currentTime;
            // for (let i = 0; i < 500; i++) {
            //     nodes.funky._.wavePosition.linearRampToValueAtTime(0,t+i+0.0);
            //     nodes.funky._.wavePosition.linearRampToValueAtTime(1,t+i+0.9);
            // }
        });

        this.inOp.TEMP_BUILD_NODETREE(actx, {
            keys: tO.map(({frequency,noteOn})=>({
                frequency,
                held: noteOn,
            }))
        });
    }
    async start() {
        this.started = true;
        console.log("starteding");
        
        await modulesReady;
        this.buildNodetree();
        this.inOp.TEMP_START(actx.currentTime);
        this.tSynOps.map(sO=>{
            sO.TEMP_START(actx.currentTime);
        });
        console.log("starteded");
    }
    async stop() {
        this.started = false;
        this.inOp.TEMP_STOP(actx.currentTime);
        this.tSynOps.map(sO=>{
            sO.TEMP_STOP(actx.currentTime);
            sO.destruct();
        });
        this.inOp.destruct();
    }

    componentWillUnmount() {
        this.stop();
    }


    playingAt:LiveNote[] = [];

    render(): React.ReactNode {

        if (actx.state === "suspended")
            return (<button onClick={async e=>{
                await actx.resume();
                this.forceUpdate();
            }}>Unsus ACTX</button>);

        return (<div
            tabIndex={1}
            onKeyDown={e=>{
                const noteN = keyToNoteN(e.key);
                if (noteN === undefined || (noteN in this.playingAt)) return;
                const note = this.inOp.playNote(noteN);
                this.playingAt[noteN] = note;
                
                this.tSynOps.map(tO=>{
                    const {nodes} = tO as never as {nodes:{funky:WavetableWorkletNode}};

                    nodes.funky._.wavePosition.linearRampToValueAtTime(1,actx.currentTime+0.0);
                    nodes.funky._.wavePosition.linearRampToValueAtTime(0,actx.currentTime+0.9);
                });
                this.forceUpdate();
            }}
            onKeyUp={e=>{
                const noteN = keyToNoteN(e.key);
                if (noteN === undefined || !(noteN in this.playingAt)) return;
                this.playingAt[noteN].stop();
                delete this.playingAt[noteN];
                this.forceUpdate();
            }}
        >
            <div>{this.playingAt.map((_,i)=>i).filter(()=>true).join(" ")}</div>
            {this.started ? (
                <button
                    onClick={async e=>{
                        await this.stop();
                        this.forceUpdate();
                    }}
                >Stop</button>
            ) : (
                <button
                    onClick={async e=>{
                        await this.start();
                        this.forceUpdate();
                    }}
                >Start</button>
            )}
            [press here for control]
        </div>);
    }
}