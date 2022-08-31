import genStrId from "../util/genStrId";
import { ValueSource } from "../util/ValueTarget";
import { Connection } from "./Connection";
import Node from "./Node";
import PortShape from "./PortShape";
import { PortSide, TPortSide } from "./PortSide";
import Row from "./Row";
import ShapeGen from "./ShapeGen";

export type PortEitherSide = Port<typeof PortSide["INPUT"]>|Port<typeof PortSide["OUTPUT"]>;
export default class Port<S extends TPortSide> {
    readonly id = Symbol();
    readonly strId = genStrId();
    constructor(
        readonly side:S,
        readonly row:Row,
        readonly node:Node,
        private readonly onConnChange: (c:Connection)=>void,
    ) {}

    readonly connections = new Set<Connection>;
    private readonly nConnectionsSource = new ValueSource(this.connections.size);
    readonly nConnections = this.nConnectionsSource.target;
    private updateNConnections() { this.nConnectionsSource.assign(this.connections.size) }

    private get isOutput() { return this.side === PortSide.OUTPUT }

    connect(other:Port<Exclude<TPortSide,S>>) {
        const [from,to] = [this,other,this].slice(this.isOutput ? 0 : 1) as never as [Port<typeof PortSide["OUTPUT"]>,Port<typeof PortSide["INPUT"]>];
        const conn = new Connection(
            from, to,
            {
                disconnect: conn=>{
                    this.onConnChange(conn);
                },
                disconnectPort: ()=>{
                    this.connections.delete(conn);
                    other.connections.delete(conn);
                    this.updateNConnections();
                    other.updateNConnections();
                },
            }
        );
        this.connections.add(conn);
        other.connections.add(conn);
        this.updateNConnections();
        other.updateNConnections();
        this.onConnChange(conn);
        return conn;
    }

    updateShapes() {
        this.shape.update();
        this.connections.forEach(v=>v.shape.update());
    }
    readonly shape:ShapeGen<PortShape> = ShapeGen.make(()=>
        new PortShape(
            this,
        )
    );
}
