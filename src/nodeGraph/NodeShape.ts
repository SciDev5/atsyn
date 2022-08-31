import Vec from "../util/Vec";
import Node from "./Node";
import NodeGraphConsts from "./NodeGraphConsts";
import { PortSide, TPortSide } from "./PortSide";
import Row from "./Row";

const heightPadd = NodeGraphConsts.rowBorderTop + NodeGraphConsts.rowPaddingBlock*2;

export default class NodeShape {
    readonly hdrHeight = 30;
    constructor(
        readonly ref: Node,
        readonly pos: Vec,
        readonly width: number,
        readonly rows: Row[],
    ) { }

    connectionPoint(side: TPortSide, row: Row): Vec {
        if (!this.rows.includes(row)) return new Vec(0,0);
        const otherSideOffset = new Vec(this.width, 0);
        const hdrOffset = new Vec(0, this.hdrHeight);
        const rowsBefore = this.rows.slice(0,this.rows.indexOf(row));

        const rowsOffset = new Vec(0, rowsBefore.map(v=>v.height+heightPadd).reduce((a,b)=>a+b,0) + (row.height+heightPadd)/2);
        return this.pos
            .plus(otherSideOffset.times(side === PortSide.INPUT ? 0 : 1))
            .plus(hdrOffset)
            .plus(rowsOffset);
    }
    get height() {
        return this.hdrHeight + this.rows.map(v=>v.height+heightPadd).reduce((a,b)=>a+b,0);
    }

    get maxPos() {
        return this.pos.plus(new Vec(this.width,this.height));
    }
}
