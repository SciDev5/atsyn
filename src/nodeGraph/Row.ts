import React from "react";
import Node, { RowInitData } from "./Node";
import Port from "./Port";
import { PortSide, TPortSide } from "./PortSide";

export default abstract class Row<N extends Node = Node> {
    abstract readonly Component: React.ComponentType<{[k:string]:never}>;
    readonly node:N;
    constructor(
        rowInitData:RowInitData<N>,
        sides: Set<TPortSide>,
    ) {
        this.node = rowInitData.node;
        const ports = [...sides].map(s=>rowInitData.addPort(this,s));
        this.portIn = (ports.find(v=>v.side === PortSide.INPUT)??undefined) as Port<typeof PortSide["INPUT"]>|undefined;
        this.portOut = (ports.find(v=>v.side === PortSide.OUTPUT)??undefined) as Port<typeof PortSide["OUTPUT"]>|undefined;
        rowInitData.addRow(this);
    }
    readonly portIn?:Port<typeof PortSide["INPUT"]>;
    readonly portOut?:Port<typeof PortSide["OUTPUT"]>;
    abstract readonly height:number;
}