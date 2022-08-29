import genStrId from "../util/genStrId";
import { ConnectionShape as ConnectionShape } from "./ConnectionShape";
import Port from "./Port";
import { PortSide } from "./PortSide";
import ShapeGen from "./ShapeGen";

export class Connection {
    readonly id = Symbol();
    readonly strId = genStrId();
    constructor(
        readonly from: Port<typeof PortSide["OUTPUT"]>,
        readonly to: Port<typeof PortSide["INPUT"]>,
        readonly on: {
            disconnect: (conn: Connection) => void;
            disconnectPort: () => void;
        }
    ) {}

    
    private _wasDisconnected = false;
    public get isDisconnected() { return this._wasDisconnected }
    
    disconnect() {
        this._wasDisconnected = true;
        this.on.disconnectPort();
        this.on.disconnect(this);
    }

    readonly shape = ShapeGen.make(()=>
        new ConnectionShape(
            this,
            this.from.shape._,
            this.to.shape._,
        )
    );
}
