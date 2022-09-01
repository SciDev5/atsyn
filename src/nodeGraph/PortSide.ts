import { EnumType } from "@scidev5/util-h";

export type TPortSide = EnumType<typeof PortSide>;
export class PortSide {
    static readonly INPUT = Symbol();
    static readonly OUTPUT = Symbol();
}