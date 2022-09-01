import { EnumType } from "@scidev5/util-h";

export class NodeUpdateEv {
    static readonly node = Symbol();
    static readonly conn = Symbol();
}
export type TNodeUpdateEv = EnumType<typeof NodeUpdateEv>;
