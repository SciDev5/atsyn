import { css } from "@emotion/css";
import React from "react";
import Node, { RowInitData } from "../../../nodeGraph/Node";
import { PortSide, TPortSide } from "../../../nodeGraph/PortSide";
import Row from "../../../nodeGraph/Row";

export default class PortRow<S extends TPortSide> extends Row {
    constructor(
        rowInitData:RowInitData<Node>,
        private readonly label:string,
        readonly side?: S,
    ) {
        super(rowInitData, side ? [side] : [PortSide.INPUT,PortSide.OUTPUT]);
    }
    readonly height = 30;
    readonly Component = ()=>{
        return (
            <span
                className={css({
                    lineHeight: this.height+"px",
                    paddingInline: ".5em",
                })}
            >{this.label}</span>
        );
    };
}
export class PortOutRow extends PortRow<typeof PortSide["OUTPUT"]> {
    constructor(rowInitData:RowInitData<Node>,label:string) { super (rowInitData,label,PortSide.OUTPUT) }
    public get port() { return this.portOut_! }
}
export class PortInRow extends PortRow<typeof PortSide["INPUT"]> {
    constructor(rowInitData:RowInitData<Node>,label:string) { super (rowInitData,label,PortSide.INPUT) }
    public get port() { return this.portIn_! }
}
export class PortBothRow extends PortRow<never> {
    constructor(rowInitData:RowInitData<Node>,label:string) { super (rowInitData,label) }
    public get portIn() { return this.portIn_! }
    public get portOut() { return this.portOut_! }
}