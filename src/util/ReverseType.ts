/* eslint-disable @typescript-eslint/no-explicit-any */
// https://stackoverflow.com/questions/59658536/how-to-write-an-invert-type-in-typescript-to-invert-the-order-of-tuples
type ReverseTuple<T extends any[], R extends any[] = []> = T extends [infer F, ...infer L] ? ReverseTuple<L,[F,...R]> : R;
type ReverseType<T extends any[]> = number extends T["length"] ? T : ReverseTuple<T>;
export default ReverseType;