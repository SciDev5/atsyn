/* eslint-disable @typescript-eslint/no-empty-function */

import { Vec } from "@scidev5/util-h";

type Buttons = {
    readonly shift  :boolean,
    readonly ctrl   :boolean,
    readonly alt    :boolean,
    readonly meta   :boolean,
    readonly mouse0 :boolean,
    readonly mouse1 :boolean,
    readonly mouse2 :boolean,
};
const buttonsNone:Buttons =  { shift:false, ctrl:false, alt:false, meta:false, mouse0:false, mouse1:false, mouse2:false };

const _addDrag = Symbol();

export default class DragHandler {
    private drags = new Set<Drag>;
    private modifiers:Buttons = buttonsNone;
    public scale = 0;
    public pan = new Vec(0,0);
    private posRaw = new Vec(0,0);
    private lastPosRaw = new Vec(0,0);
    get pos() { return this.posRaw.times(this.scale).minus(this.pan) }
    get deltaPosNoPan() { return this.posRaw.times(this.scale).minus(this.lastPosRaw.times(this.scale)) }

    [_addDrag](drag:Drag){
        this.drags.add(drag);
    }

    private watchingElt?:HTMLElement;
    unwatch() {
        if (!this.watchingElt) throw new Error("Cannot unwatch when there is not element to unwatch.");
        const elt = this.watchingElt;
        delete this.watchingElt;

        elt.removeEventListener("mousedown",  this.onMouseDown,  {capture:true});
        elt.removeEventListener("mouseup",    this.onMouseUp,    {capture:true});
        elt.removeEventListener("mousemove",  this.onMouseMove,  {capture:true});
        elt.removeEventListener("keydown",    this.onKeyDown,    {capture:true});
        elt.removeEventListener("keyup",      this.onKeyUp,      {capture:true});
    }
    watch(elt:HTMLElement) {
        if (this.watchingElt) throw new Error("Cannot watch more than one element for drags.");
        this.watchingElt = elt;

        elt.addEventListener("mousedown",  this.onMouseDown,  {capture:true});
        elt.addEventListener("mouseup",    this.onMouseUp,    {capture:true});
        elt.addEventListener("mousemove",  this.onMouseMove,  {capture:true});
        elt.addEventListener("keydown",    this.onKeyDown,    {capture:true});
        elt.addEventListener("keyup",      this.onKeyUp,      {capture:true});
    }

    private readonly onMouseDown  = (e:MouseEvent)=>this.update_MouseEvent(e);
    private readonly onMouseMove  = (e:MouseEvent)=>this.update_MouseEvent(e);
    private readonly onMouseUp    = (e:MouseEvent)=>this.update_MouseEvent(e);
    private readonly onKeyDown = (e:KeyboardEvent)=>this.update_KeyEvent(e);
    private readonly onKeyUp   = (e:KeyboardEvent)=>this.update_KeyEvent(e);

    private update_KeyEvent(e:KeyboardEvent) {
        this.modifiers = {
            ...this.modifiers,
            alt: e.altKey,
            ctrl: e.ctrlKey,
            meta: e.metaKey,
            shift: e.shiftKey,
        };
        this.afterUpdateModifiers();
    }
    private update_MouseEvent(e:MouseEvent) {
        this.modifiers = {
            mouse0: !!(e.buttons & 0b1),
            mouse1: !!(e.buttons & 0b10),
            mouse2: !!(e.buttons & 0b100),
            alt: e.altKey,
            ctrl: e.ctrlKey,
            meta: e.metaKey,
            shift: e.shiftKey,
        };
        this.updateMousePos(e);
        this.afterUpdateModifiers();
    }

    private updateMousePos(e:MouseEvent) {
        const {clientWidth,clientHeight,clientTop,clientLeft} = this.watchingElt!;

        this.lastPosRaw = this.posRaw;
        this.posRaw = new Vec(
            e.clientX - clientLeft - clientWidth  * 0.5,
            e.clientY - clientTop  - clientHeight * 0.5,
        );
    }

    private afterUpdateModifiers() {
        this.updateDrags();
    }

    private updateDrags() {
        for (const drag of [...this.drags])
            if (!drag.canContinue(this.modifiers)) {
                this.drags.delete(drag);
                drag.onEnd(this.pos);
            }
        for (const drag of this.drags)
            drag.onDrag(this.pos,this.deltaPosNoPan,this.modifiers);
    }
}

export class Drag {
    constructor(
        dragHandler:DragHandler,
        readonly canContinue:(modifiers:Buttons)=>boolean,
        readonly onDrag:(pos:Vec,deltaPosNoPan:Vec,modifiers:Buttons)=>void,
        readonly onEnd:(pos:Vec)=>void,
    ) {
        dragHandler[_addDrag](this);
    }
}