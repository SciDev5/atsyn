import React from "react";
import Node, { RowInitData } from "./Node";
import Port from "./Port";
import { PortSide, TPortSide } from "./PortSide";

export default abstract class Row<N extends Node = Node> {
    abstract readonly Component: React.ComponentType<{[k:string]:never}>;
    readonly node: N;
    constructor(
        rowInitData: RowInitData<N>,
        sides: TPortSide[],
    ) {
        this.node = rowInitData.node;
        const ports = [...new Set(sides)].map(s=>rowInitData.addPort(this,s));
        this.portIn_ = (ports.find(v=>v.side === PortSide.INPUT)??undefined) as Port<typeof PortSide["INPUT"]>|undefined;
        this.portOut_ = (ports.find(v=>v.side === PortSide.OUTPUT)??undefined) as Port<typeof PortSide["OUTPUT"]>|undefined;
        rowInitData.addRow(this);
    }
    readonly portIn_?:Port<typeof PortSide["INPUT"]>;
    readonly portOut_?:Port<typeof PortSide["OUTPUT"]>;
    abstract readonly height:number;
}