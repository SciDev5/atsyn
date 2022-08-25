// import processorCode from "!!raw-loader!./TestProcessor";

import EPromise from "../../util/EPromise";

let CANNOTLOAD = false;
const CANNOTLOADError = new Error("Advanced audio nodes are not available. [Try loading this app in a secure context (https:)]");
if (!("AudioWorkletNode" in window)) {
    window.AudioWorkletNode ??= class {} as never;
    CANNOTLOAD = true;
}


export type WorkletNodeTemplate = {msgIn:unknown,msgOut:unknown,paramName:string}; 

export class XWorkletNode<T extends WorkletNodeTemplate> extends AudioWorkletNode {
    public readonly _:{[key in T["paramName"]]:AudioParam};
    constructor(selfClass:{loader?:XWorkletNodeLoader<WorkletNodeTemplate>}, actx:BaseAudioContext, options?:AudioWorkletNodeOptions&{usePort?:boolean}) {
        if (CANNOTLOAD) throw CANNOTLOADError;
        if (!selfClass.loader) throw new Error("The class's loader must be assigned before creating nodes (try constructing one).");
        super(actx, selfClass.loader.workletRegistryName, options);
        
        this._ = Object.fromEntries([...this.parameters.entries()]) as {[key in T["paramName"]]:AudioParam};
        if (options?.usePort ?? false) {
            this.port.addEventListener("message",this.onReceiveMessage_);
            this.port.start();
        }
    }
    private static _loader?:XWorkletNodeLoader<WorkletNodeTemplate>;
    public static get loader() { return this._loader }
    public static setLoader<T extends WorkletNodeTemplate>(loader:XWorkletNodeLoader<T>) {
        if (this._loader) throw new Error("_loader was set twice");
        this._loader = loader;
    }

    private readonly onReceiveMessage_:(e:MessageEvent<T["msgOut"]>)=>void = e=>{
        this.onReceiveMessage(e.data,e);
    };
    protected onReceiveMessage(message:T["msgOut"],e:MessageEvent<T["msgOut"]>):void {
        // may be overridden, default to no behavior.
    }

    protected sendMessage(msg:T["msgIn"],transfer?:Transferable[]) {
        if (transfer)
            this.port.postMessage(msg,transfer);
        else
            this.port.postMessage(msg);
    }
    private readonly requests:(()=>void)[] = [];
    protected async awaitRequest(sendRequest:(reqN:number)=>void):Promise<void> {
        const p = new EPromise<void>();
        const reqN = this.requests.push(()=>p.res())-1;
        sendRequest(reqN);
        await p;
        // remove the request from the request list after it is resolved.
        delete this.requests[reqN];
        if (reqN === this.requests.length-1) {
            let i = this.requests.length;
            while (!((--i) in this.requests) && i >= 0); // decrement until we hit the first filled value.
            this.requests.length = i+1; // set the length to just barely fit it.
        }
    }
    protected resolveRequestN(n:number) {
        if (n in this.requests)
            this.requests[n]();
    }

    public param(name:T["paramName"]):AudioParam {
        const p = this.parameters.get(name);
        if (!p) throw new Error("Requested nonexistant param");
        return p;
    }
}

export default class XWorkletNodeLoader<
    T extends WorkletNodeTemplate = WorkletNodeTemplate,
    Z=never,
    V extends {
        new(
            actx:BaseAudioContext,
            options?:Z,
        ): unknown,
        setLoader(loader:XWorkletNodeLoader<T,Z,V>):void,
    } = {
        new(
            actx:BaseAudioContext,
            options?:Z,
        ): unknown,
        setLoader(loader:XWorkletNodeLoader<T,Z>):void,
    },
> {
    constructor(
        public readonly workletRegistryName:string,
        workletClass:V,
    ) {
        workletClass.setLoader(this);
    }
         
    private readonly processorCode:Promise<string> = import("!!raw-loader!./implementations/"+this.workletRegistryName+"Processor").then(v=>v.default);
    public async addModuleToContext(actx:BaseAudioContext) {
        if (!("audioWorklet" in actx)) CANNOTLOAD = true;
        if (CANNOTLOAD) throw CANNOTLOADError;
        const url = URL.createObjectURL(new Blob([
            `function registerProcessor(n,c){globalThis.registerProcessor("${this.workletRegistryName}",c)}`,
            await this.processorCode,
        ],{type:"text/javascript"}));
        await actx.audioWorklet.addModule(url);
    }
}