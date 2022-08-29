import Vec from "../util/Vec";
import Port from "./Port";
import { TPortSide } from "./PortSide";

export default class PortShape {
    readonly pos:Vec;
    constructor(
        readonly ref:Port<TPortSide>,
    ) {
        this.pos = ref.node.shape._.connectionPoint(ref.side,ref.row);
    }
    static readonly radius = 5;
}