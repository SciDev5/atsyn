import XWorkletNodeLoader from "./XWorkletNode";
import WavetableWorkletNode from "./implementations/WavetableWorkletNode";
import TracerWorkletNode from "./implementations/TracerWorkletNode";


export const wavetableWorkletNodeLoader = new XWorkletNodeLoader("Wavetable",WavetableWorkletNode);
export const tracerWorkletNodeLoader = new XWorkletNodeLoader("Tracer",TracerWorkletNode);
