import useWindowEvent from "./useWindowEvent";

export class Keybind {
    shiftKey = false;
    ctrlKey = false;
    altKey = false;
    metaKey = false;
    isStrict = false;
    constructor(readonly keyName:string) {}

    get shift() {
        this.shiftKey = true;
        return this;
    }
    get alt() {
        this.altKey = true;
        return this;
    }
    get ctrl() {
        this.ctrlKey = true;
        return this;
    }
    get meta() {
        this.metaKey = true;
        return this;
    }
    strict(isStrict=true) {
        this.isStrict = isStrict;
        return this;
    }

    check(e:KeyboardEvent) {
        if (e.key.toLowerCase() !== this.keyName.toLowerCase()) return false;
        if (this.isStrict)
            return (
                e.shiftKey === this.shiftKey &&
                e.altKey   === this.altKey   &&
                e.metaKey  === this.metaKey  &&
                e.ctrlKey  === this.ctrlKey
            );
        else
            return (
                ( !this.shiftKey || e.shiftKey ) &&
                ( !this.altKey   || e.altKey   ) &&
                ( !this.metaKey  || e.metaKey  ) &&
                ( !this.ctrlKey  || e.ctrlKey  )
            );
    }
}

export default function useKeybind(binding:Keybind,handler:()=>void) {
    useWindowEvent("keydown",e=>{
        if (binding.check(e))
            handler();
    });
}