import EnumType from "../util/EnumType";

export type TPortSide = EnumType<typeof PortSide>;
export class PortSide {
    static readonly INPUT = Symbol();
    static readonly OUTPUT = Symbol();
}