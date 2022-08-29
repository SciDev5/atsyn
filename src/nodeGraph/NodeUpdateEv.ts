import EnumType from "../util/EnumType";

export class NodeUpdateEv {
    static readonly node = Symbol();
    static readonly conn = Symbol();
}
export type TNodeUpdateEv = EnumType<typeof NodeUpdateEv>;
