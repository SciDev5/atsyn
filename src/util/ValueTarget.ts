import { useEffect, useState } from "react";

const targetDispatch = Symbol(), sourceValue = Symbol();

export type Handler<T> = (v:T)=>void;
export default class ValueTarget<T> {
    constructor(private readonly source:ValueSource<T>) {}
    private readonly handlers = new Set<Handler<T>>();
    private readonly handlersOnce = new Set<Handler<T>>();
    [targetDispatch](value:T) {
        this.handlers.forEach(h=>h(value));
        this.handlersOnce.forEach(h=>h(value));
        this.handlersOnce.clear();
    }
    on(handler:Handler<T>) {
        this.handlers.add(handler);
        return this.offCallbackFor(handler);
    }
    once(handler:Handler<T>) {
        this.handlersOnce.add(handler);
        return this.offCallbackFor(handler);
    }
    off(handler:Handler<T>) {
        this.handlers.delete(handler);
        this.handlersOnce.delete(handler);
    }
    private offCallbackFor(handler:Handler<T>) {
        return this.off.bind(this,handler);
    }

    useHandler(handler:Handler<T>) {
        useEffect(()=>{
            this.on(handler);
            return ()=>{
                this.off(handler);
            };
        },[handler]);
    }
    useState() {
        const [value,setValue] = useState(this.value);
        this.useHandler(setValue);
        return value;
    }

    get value() { return this.source[sourceValue]}
}

export class ValueSource<T> {
    [sourceValue]:T;
    constructor(defaultValue:T) {
        this[sourceValue] = defaultValue;
    }

    readonly target = new ValueTarget<T>(this);

    assign(value:T) {
        this[sourceValue] = value;
        this.target[targetDispatch](value);
    }
}