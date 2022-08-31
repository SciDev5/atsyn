export type EvMap = {[evName:string]:unknown};
export type EvHandler<T> = (data:T)=>void;
type EvHandlerMap<T extends EvMap> = {[ev in keyof T]?:Set<EvHandler<T[ev]>>};

type KeysWithVoidValues<T extends EvMap> = {[K in keyof T]: [void] extends [T[K]] ? K : never}[keyof T];

export class EvSource<T extends EvMap> {
    private handlers:EvHandlerMap<T> = {};
    private onceHandlers:EvHandlerMap<T> = {};

    readonly target = new EvTarget(this.handlers,this.onceHandlers);

    dispatch<K extends KeysWithVoidValues<T>>(evName:K):void;
    dispatch<K extends keyof T>(evName:K,value:T[K]):void;
    dispatch<K extends keyof T>(evName:K,value?:T[K]) {
        this.handlers[evName]?.forEach(v=>v(value!));
        this.onceHandlers[evName]?.forEach(v=>v(value!));
        this.onceHandlers[evName]?.clear();
    }
}
export default class EvTarget<T extends EvMap> {
    constructor(
        private handlers:EvHandlerMap<T>,
        private onceHandlers:EvHandlerMap<T>,
    ) {}
    on<K extends keyof T>(evName:K,handler:EvHandler<T[K]>,once=false) {
        const handlers = once ? this.onceHandlers : this.handlers;
        handlers[evName] ??= new Set;
        handlers[evName]?.add(handler);
    }
    once<K extends keyof T>(evName:K,handler:EvHandler<T[K]>) {
        this.on(evName,handler,true);
    }
    off<K extends keyof T>(evName:K,...handlers:EvHandler<T[K]>[]) {
        for (const handler of handlers) {
            this.handlers[evName]?.delete(handler);
            this.onceHandlers[evName]?.delete(handler);
        }
    }
}