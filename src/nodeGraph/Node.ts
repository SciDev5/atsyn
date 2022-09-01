import { EvSource, Random, SymbolMap, symbolMapValues, Vec } from "@scidev5/util-h";
import React from "react";
import { Connection } from "./Connection";
import NodeShape from "./NodeShape";
import { NodeUpdateEv } from "./NodeUpdateEv";
import Port from "./Port";
import { PortSide, TPortSide } from "./PortSide";
import Row from "./Row";
import ShapeGen from "./ShapeGen";

export type NodeClass = {new(context:NodeContext,pos:Vec):Node};

export type RowInitData<N extends Node> = {
    readonly addPort: <S extends TPortSide>(row:Row<N>,side:S)=>Port<S>,
    readonly addRow: (row:Row<N>)=>void,
    readonly node:N,
};

export default abstract class Node {
    abstract readonly Header: string | React.ComponentType<{[k:string]:never}>;
    readonly strId = Random.strFast();
    readonly id = Symbol();
    private readonly ports:{readonly [side in TPortSide]: Set<Port<side>>} = {
        [PortSide.INPUT  ]: new Set,
        [PortSide.OUTPUT ]: new Set,
    };
    get allPorts() { return symbolMapValues(this.ports).flatMap(portSet=>[...portSet]) }

    private readonly rows:Row[] = [];
    constructor(
        readonly context:NodeContext,
        pos:Vec,
    ) {
        this.pos = pos;
        this.contextLists.node(this);
    }
    protected addPort<S extends TPortSide>(row:Row,side:S):Port<S> {
        const newPort = new Port(
            side,
            row,
            this,
            conn=>{
                this.contextLists.conn(conn);
            },
        );
        (this.ports[side] as Set<Port<S>>).add(newPort);

        return newPort;
    }
    protected addRow(row:Row) {
        this.rows.push(row);
    }
    protected readonly genericRowInitData = Node.rowInitData<Node>(this);
    protected static rowInitData<N extends Node>(node:N):RowInitData<N> {
        return {
            node,
            addPort: node.addPort.bind(node),
            addRow: node.addRow.bind(node),
        };
    }
    private get contextLists() {
        return this.context[private_listsLink];
    }

    get isDeleted() { return this.isDeleted_ }
    private isDeleted_ = false;
    remove() {
        this.isDeleted_ = true;
        this.contextLists.node(this);
    }

    static connect<RA extends Row, RB extends Row>(fromRow:RA,toRow:RB) {
        const
            from = fromRow.portOut_,
            to   = toRow.portIn_;
        if (!from) throw new Error("fromRow does not have an output");
        if (!to) throw new Error("toRow does not have an input");
        return from.connect(to);
    }

    private pos_ = new Vec(0,0);
    get pos() { return this.pos_ }
    set pos(newPos) {
        this.pos_ = newPos;
        this.updateShapes();
    }
    private width_ = 200;
    get width() { return this.width_ }
    set width(newWidth) {
        this.width_ = newWidth;
        this.updateShapes();
    }
    private updateShapes() {
        this.shape.update();
        for (const port of this.allPorts)
            port.updateShapes();
        this.contextLists.node(this);
        for (const connection of this.connections)
            this.contextLists.conn(connection);
    }
    readonly shape = ShapeGen.make(()=>
        new NodeShape(
            this,
            this.pos,
            this.width,
            this.rows,
        )
    );
    get connections() {
        return this.allPorts.flatMap(v=>[...v.connections]);
    }
}

const private_listsLink = Symbol("NodeContext&Node:: NodeContext to Node private link");
export abstract class NodeContext {
    private readonly evSource = new EvSource<{
        [ NodeUpdateEv.node ]: Node;
        [ NodeUpdateEv.conn ]: Connection;
    }>();
    readonly ev = this.evSource.target;

    readonly nodes = new SymbolMap<Node>;
    readonly connections = new SymbolMap<Connection>;

    protected checkNewNode(node:Node) {
        if (!this.allowedNodes.some(clazz=>(node instanceof clazz)))
            throw new Error("added node is not allowed in this context");
        if (node.context !== this as unknown as NodeContext)
            throw new Error("updating node from the wrong context");
    }
    protected checkUpdatingNode(node:Node) {
        if (!(node.id in this.nodes._))
            this.checkNewNode(node);
    }

    abstract readonly allowedNodes:readonly NodeClass[];
    abstract readonly currentlyCreatableNodes:readonly NodeClass[];

    readonly [private_listsLink] = {
        node: (node:Node)=>{
            this.checkUpdatingNode(node);
            if (node.isDeleted)
                delete this.nodes._[node.id];
            else
                this.nodes._[node.id] = node;
            this.evSource.dispatch(NodeUpdateEv.node, node);
        },
        conn: (conn:Connection)=>{
            if (conn.isDisconnected)
                delete this.connections._[conn.id];
            else
                this.connections._[conn.id] = conn;
            this.evSource.dispatch(NodeUpdateEv.conn, conn);
        },
    } as const;
}