import { Connection } from "./Connection";
import PortShape from "./PortShape";


export class ConnectionShape {
    constructor(
        readonly ref:Connection,
        readonly from:PortShape,
        readonly to:PortShape,
    ) { }
}
