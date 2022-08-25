import React, { useState } from "react";
import { useEffect } from "react";
import { tracerWorkletNodeLoader, wavetableWorkletNodeLoader } from "../audio/workletnode/audioWorkletNodes";
import TracerWorkletNode from "../audio/workletnode/implementations/TracerWorkletNode";
import WavetableWorkletNode from "../audio/workletnode/implementations/WavetableWorkletNode";

declare global {
    interface AudioWorkletProcessor {
        otherPort?:MessagePort;
    }
}


const
    actx = new AudioContext(),
    moduleReady = Promise.all([
        wavetableWorkletNodeLoader.addModuleToContext(actx),
        tracerWorkletNodeLoader.addModuleToContext(actx)
    ]);

function ARateDisplay(props:{name:string,param:AudioParam}) {
    const {param,name} = props;
    const [value,setValue] = useState(props.param.value);
    useEffect(()=>{
        const interval = setInterval(()=>{
            setValue(param.value);            
        },100);

        return ()=>{
            clearInterval(interval);
        };
    },[param]);

    return (
        <div><span>{name}</span>: <code>{value}</code></div>
    );
}
function WaveformDisplay(props:{waves:Float32Array[],width:number,height:number,xScale?:number,channelColors?:string[]}) {
    const {
            waves,
            width,
            height,
        } = props,
        xScale = props.xScale ?? 1,
        channelColors = props.channelColors ?? [];
    return (
        <svg width={width} height={height}>
            <line
                x1={0}     y1={height/2}
                x2={width} y2={height/2}
                stroke="#77777744"
                strokeWidth={4}
            />
            {waves.map((wave,i)=>(
                <path key={i}
                    style={{mixBlendMode:"plus-lighter"}}
                    d={[...wave].map((v,i)=>`L ${i*xScale} ${(-v+1)*.5*height}`).join(" ").replace(/L/,"M"/*Replace first L command with M*/)}
                    stroke={channelColors[i] ?? "currentColor"}
                    strokeWidth={2}
                    fill="none"
                />
            ))}
        </svg>
    );
}
function WaveformDisplay2d(props:{waves:Float32Array[],size:number,scale?:number}) {
    const cacheLen = 5;
    const [allWaves,setAllWaves] = useState<{off:number,data:string[]}>({off:0,data:[]});
    const {
            waves,
            size,
        } = props,
        scale = props.scale ?? 1,
        wavesInvalid = waves.length !== 2 || waves.some(v=>!v);
    
    useEffect(()=>{
        if (wavesInvalid) return;
        const [w0,w1] = waves;
        setAllWaves({
            off: allWaves.off+1,
            data:[
                [...w0].map((v,i)=>`L ${(w0[i]*scale+1)/2*size} ${(w1[i]*scale+1)/2*size}`).join(" ").replace(/L/,"M"/*Replace first L command with M*/),
                ...allWaves.data.slice(0,cacheLen-1)
            ]
        }); 
    },[waves]);
    if (wavesInvalid)
        return <>{"wrong number of channels"}</>;
    return (
        <svg width={size} height={size}>
            <line
                x1={0}    y1={size/2}
                x2={size} y2={size/2}
                stroke="#77777744"
                strokeWidth={4}
            />
            <line
                y1={0}    x1={size/2}
                y2={size} x2={size/2}
                stroke="#77777744"
                strokeWidth={4}
            />
            {allWaves.data.map((wave,i)=>(

                <path key={i-allWaves.off}
                    style={{mixBlendMode:"plus-lighter"}}
                    d={wave}
                    stroke={`rgba(20,255,200,${1-i/cacheLen})`}
                    strokeWidth={2}
                    fill="none"
                />
            ))}
        </svg>
    );
}
function NodeWaveformDisplay(props:{node:WavetableWorkletNode}) {
    const {node} = props;
    const [displayedWaves,setDisplayedWaves] = useState<Float32Array[]>([]);
    
    useEffect(()=>{
        const onWaves = (waves:Float32Array[])=>setDisplayedWaves(waves);
        node.addOnWave(onWaves);
        return ()=>{ node.removeOnWave(onWaves) };
    },[node]);
    return (
        <WaveformDisplay
            waves={displayedWaves}
            width={500} height={60} xScale={1}
            channelColors={["#ff7700","#0077ff"]}
        />
    );
}
function NodeWaveformDisplay2d(props:{node:TracerWorkletNode}) {
    const {node} = props;
    const [[displayedWaves0,displayedWaves1],setDisplayedWaves] = useState<Float32Array[]>([]);
    
    useEffect(()=>{
        const onWaves = (waves:Float32Array[])=>setDisplayedWaves(waves);
        node.addOnWave(onWaves);
        return ()=>{ node.removeOnWave(onWaves) };
    },[node]);
    return (
        <WaveformDisplay2d
            waves={[displayedWaves0,displayedWaves1??displayedWaves0]}
            size={500}
        />
    );
}

class AudioInspector2 {

    readonly tNode:TracerWorkletNode;
    readonly sNode:MediaStreamAudioSourceNode;

    readonly n:AudioNode[];

    constructor(private readonly actx: AudioContext, mediaStream: MediaStream) {
        this.sNode = new MediaStreamAudioSourceNode(actx,{mediaStream});        
        this.tNode = new TracerWorkletNode(actx);

        const g = new GainNode(actx,{gain:0.001});
        this.sNode.connect(g).connect(actx.destination);
        this.n = [g];

        this.sNode.connect(this.tNode);
    }


    public static async makeOnReady() {
        await actx.resume();
        await moduleReady;

        const stream = await navigator.mediaDevices.getDisplayMedia({
            audio:{channelCount:2},
            video:true,
        });
        stream.getVideoTracks().forEach(videoTrack=>{
            videoTrack.stop();
            stream.removeTrack(videoTrack);
        });

        return new AudioInspector2(actx,stream);
    }

    
    public destroy() {
        this.sNode.disconnect();
        this.sNode.mediaStream.getTracks().forEach(track=>{
            track.stop();
            this.sNode.mediaStream.removeTrack(track);
        });
        this.n.forEach(v=>v.disconnect());
    }
}
class AudioRunner {
    readonly aNodes:WavetableWorkletNode[];
    readonly gNode:GainNode;
    readonly gNode1:GainNode;
    readonly tNode:TracerWorkletNode;

    constructor(private readonly actx: AudioContext) {
            
        const frequenies = 
            // [0,4];
            [0,4,7,17,12];
            // [0,3,6,8];
            // [0,4,7,17,12,24,19];
            // [0,4,7,17,12,24,19,20,25,28];
            // [0,4,7,17,12,24,19,20,25,28,30,34,37,39,40,48,-20];
            // [0,4,7,17,12,24,19,20,25,28,30,34,37,39,40,48,-20,-10,-4,-3,-8,-15,-30,50,30,12];
        console.log("INITIALIZING %o NODES",frequenies.length);
        
        this.aNodes = frequenies.map(freq=>{
            const n = new WavetableWorkletNode(actx);
            n._.frequency.value = 400*(2**(freq/12));
            return n;
        });
        this.tNode = new TracerWorkletNode(actx);
        this.gNode1 = new GainNode(actx);
        this.gNode = new GainNode(actx,{gain:0.05});
            
        this.aNodes.slice(1).forEach(n=>n.connect(this.gNode));
        
        this.aNodes[0].connect(this.gNode1).connect(this.gNode);
        this.gNode1.connect(this.tNode);
        
        this.gNode.connect(actx.destination);

        this.aNodes.forEach(n=>{
            n.start(actx.currentTime+1+Math.random());
        });

        const wl = 256, gen=(m:(i:number)=>number)=>new Float32Array(wl).map((_,i)=>m(i/wl)), wave:Float32Array[] = [
            gen(i=>Math.abs(i-.5)*4-1),
            gen(i=>((i*4-1)%2-1)*Math.sign((i*2.3+.24)%1-.5)),
            gen(i=>-Math.sin(i*Math.PI*2)),
            gen(i=>i*2-1),
            gen(i=>i>.5?1:-1),
        ];
        this.aNodes.flatMap(v=>{
            v._.detune.value = 0.1;
        });
        Promise.all([
            ...this.aNodes.flatMap(v=>[
                v.setWaveforms(wave),
                v.setNVoices(9),
            ]),
            this.aNodes[0].setCapture(true,20,1000),
        ]);

    }

    public static async makeOnReady() {
        await actx.resume();
        await moduleReady;

        return new AudioRunner(actx);
    }

    public destroy() {
        this.aNodes.forEach(n=>{
            n.stop();
            n.disconnect();
        });
        this.gNode.disconnect();

    }
}

export default function AudioTestsDisplay() {
    const [runner,setRunner] = useState<AudioRunner|undefined>();
    const [insp2,setInsp2] = useState<AudioInspector2|undefined>();
    useEffect(()=>{
        return ()=>{
            runner?.destroy();
        };
    },[runner]);
    useEffect(()=>{
        return ()=>{
            insp2?.destroy();
        };
    },[insp2]);
    return (
        <div>
            Audio things.
            {/* <button onClick={async e=>{
                globalThis.sampleRate = actx.sampleRate;
                globalThis.AudioWorkletProcessor = class {
                    port: MessagePort;
                    otherPort: MessagePort;
                    constructor() {
                        const messages = new MessageChannel();
                        this.port = messages.port1;
                        this.otherPort = messages.port2;
                    }
                };
                globalThis.registerProcessor = ()=>{null};
                const { TestWorkletProcessor } = await import("./processors/TestProcessor");
                const { TestWorkletProcessor: TestWorkletProcessorTest } = await import("./processors/TestProcessor-test");
                const wp = new TestWorkletProcessor(), port = wp.otherPort!;
                const wpT = new TestWorkletProcessorTest(), portT = wpT.otherPort!;
                // port.addEventListener("message",({data})=>console.log("dataReceived",data));
                port.addEventListener("message",()=>{null});
                port.start();
                portT.addEventListener("message",()=>{null});
                portT.start();
                const output = Arr.genByI(2,i=>new Float32Array(128)), params:{[key in TestProcessorSpec["paramName"]]:Float32Array} = {
                    chorus: new Float32Array(128).fill(1),
                    detune: new Float32Array(128).fill(5),
                    frequency: new Float32Array(128).fill(400),
                    wavePosition: new Float32Array(128).fill(.5),
                };
                const times:number[] = [], timesT:number[] = [];
                function benchmark(processor:typeof wp | typeof wpT) {

                    const tStart = performance.now(), nTicksTest = 100;
                    for (let i = 0; i < nTicksTest; i++) {
                        globalThis.currentFrame = 128*i;
                        processor.process([],[output],params);
                    }
                    return (performance.now()-tStart)/nTicksTest;
                }
                function microseconds(t:number) {
                    return (t*1000).toFixed(0)+"µs";
                }
                function fMicroseconds(formatString:TemplateStringsArray,...numbers:number[]) {
                    let builtString = "";
                    for (let i = 0; i < formatString.length || i < numbers.length; i++) {
                        if (i in formatString)
                            builtString += formatString[i];
                        if (i in numbers)
                            builtString += microseconds(numbers[i]);
                    }
                    return builtString;
                }
                for (let n = 0; n < 10; n++) {
                    benchmark(wp);
                    benchmark(wpT);
                    console.log("warmup [/10]");
                }
                for (let n = 0; n < 100; n++) {
                    const tR = benchmark(wp), tT = benchmark(wpT);
                    // console.log(fMicroseconds`TIME [${tR}/tick] [Test:${tT}/tick] [test is ${tR-tT} faster]`);
                    times.push(tR);
                    timesT.push(tT);
                    console.log("tick [/100]");
                }
                function mavar(a:number[]):number {
                    const avg = Arr.reduceAverage(a);
                    return Arr.reduceAverage(times.map(v=>Math.abs(v-avg)));
                }
                const
                    atR = Arr.reduceAverage(times),
                    atT = Arr.reduceAverage(timesT),
                    mavR = mavar(times),
                    mavT = mavar(timesT);
                console.log(fMicroseconds`AVG [${atR}/tick] [Test:${atT}/tick] [test is ${atR-atT} faster] [mav: ${Arr.reduceAverage([mavT,mavR])}; (R${mavR}; T${mavT})]`);
            }}>TEST</button> */}
            
            { insp2 ? (
                <button onClick={async e=>{
                    setInsp2(undefined);
                }}>destroyI</button>

            ) : (
                <button onClick={async e=>{
                    setInsp2(await AudioInspector2.makeOnReady());
                }}>makeI</button>
            )}
            {insp2 && (<>
                <NodeWaveformDisplay2d node={insp2.tNode}/>
            </>)}
            { runner ? (
                <button onClick={async e=>{
                    setRunner(undefined);
                }}>destroyR</button>

            ) : (
                <button onClick={async e=>{
                    setRunner(await AudioRunner.makeOnReady());
                }}>makeR</button>
            )}
            {runner && (<>
                <button onClick={e=>{
                    if (!runner) return;
                    const now = actx.currentTime;
                    for (const n of runner.aNodes) {
                        const fB = n._.frequency.value;
                        n._.frequency.linearRampToValueAtTime(fB,now);
                        n._.frequency.linearRampToValueAtTime(fB*(2**(1/12)),now+1);
                        n._.frequency.linearRampToValueAtTime(fB,now+2);
                    }
                }}>animate, idk</button>
                <button onClick={e=>{
                    if (!runner) return;
                    const now = actx.currentTime;
                    for (const n of runner.aNodes) {
                        n._.chorus.cancelScheduledValues(now);
                        n._.chorus.linearRampToValueAtTime(1,now);
                        n._.chorus.linearRampToValueAtTime(0,now+.05);
                        n._.chorus.linearRampToValueAtTime(1,now+1);
                    }
                }}>animate, idk 2: electric boogaloo</button>
                <button onClick={e=>{
                    if (!runner) return;
                    const now = actx.currentTime;
                    for (const n of runner.aNodes) {
                        const current = n._.chorus.value;
                        n._.chorus.cancelScheduledValues(now);
                        n._.chorus.linearRampToValueAtTime(current,now);
                        n._.chorus.linearRampToValueAtTime(1-Math.round(current),now+.25);
                    }
                }}>setChorus</button>
                <button onClick={e=>{
                    if (!runner) return;
                    const now = actx.currentTime;
                    for (const n of runner.aNodes) {
                        const current = n._.detune.value;
                        n._.detune.cancelScheduledValues(now);
                        n._.detune.linearRampToValueAtTime(current,now);
                        n._.detune.linearRampToValueAtTime(Math.random()*100,now+1);
                    }
                }}>randomizeDetune</button>
                <button onClick={e=>{
                    if (!runner) return;
                    const now = actx.currentTime;
                    for (const n of runner.aNodes) {
                        n._.wavePosition.linearRampToValueAtTime(n._.wavePosition.value,now);
                        n._.wavePosition.linearRampToValueAtTime(1,now+1);
                        n._.wavePosition.linearRampToValueAtTime(1,now+3);
                        n._.wavePosition.linearRampToValueAtTime(0,now+6);
                    }
                }}>animate, idk 3</button>
                <button onClick={e=>{
                    if (!runner) return;
                    const now = actx.currentTime;
                    for (const n of runner.aNodes) {
                        const fB = n._.frequency.value;
                        n._.wavePosition.linearRampToValueAtTime(n._.wavePosition.value,now);
                        n._.wavePosition.linearRampToValueAtTime(1,now+1);
                        n._.wavePosition.linearRampToValueAtTime(1,now+3);
                        n._.wavePosition.linearRampToValueAtTime(0,now+6);
                        n._.chorus.linearRampToValueAtTime(1,now);
                        n._.chorus.linearRampToValueAtTime(0,now+0.03);
                        n._.chorus.linearRampToValueAtTime(1,now+1);
                        n._.chorus.linearRampToValueAtTime(0,now+1.03);
                        n._.chorus.linearRampToValueAtTime(1,now+2);
                        n._.chorus.linearRampToValueAtTime(0,now+2.5);
                        n._.chorus.linearRampToValueAtTime(1,now+3);
                        n._.detune.linearRampToValueAtTime(30,now);
                        n._.detune.linearRampToValueAtTime(50,now+1);
                        n._.detune.linearRampToValueAtTime(0,now+2);
                        n._.detune.linearRampToValueAtTime(5,now+3);
                        n._.detune.linearRampToValueAtTime(30,now+5);
                        n._.frequency.linearRampToValueAtTime(fB,now);
                        n._.frequency.linearRampToValueAtTime(fB*(2**(1/12)),now+1);
                        n._.frequency.linearRampToValueAtTime(fB,now+2);
                        n._.frequency.linearRampToValueAtTime(fB*(2**(4/12)),now+3);
                        n._.frequency.linearRampToValueAtTime(fB,now+4);
                    }
                }}>animate lots</button>
                <NodeWaveformDisplay node={runner.aNodes[0]}/>
                <NodeWaveformDisplay2d node={runner.tNode}/>
                {runner.aNodes.map((n,i)=>(<div key={i}>
                    <ARateDisplay name="Base Frequency (hz)" param={n._.frequency}/>
                    <ARateDisplay name="Detune (cents)" param={n._.detune}/>
                    <ARateDisplay name="Chorus" param={n._.chorus}/>
                    <ARateDisplay name="Wave Position" param={n._.wavePosition}/>

                    {/* <NodeWaveformDisplay node={n}/> */}
                </div>
                ))}
            </>)}
        </div>
    );
}