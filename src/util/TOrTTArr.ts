export type TOrTTArr<T> = [T]|[T,T];
export function indexTOrTTArr<T>(v:TOrTTArr<T>,i:0|1):T {
    return v[i%v.length];
}

export function map_TOrTTArr<T,R>(v:TOrTTArr<T>,mapFn:(v:T,i:0|1,a:TOrTTArr<T>)=>R):TOrTTArr<R> {
    return v.map(mapFn as (v:T,i:number,a:T[])=>R) as TOrTTArr<R>;
}

export function rand_TOrTTArr<T>(genChild:()=>T):TOrTTArr<T> {
    return Math.random() > .5 ?
        [ genChild() ] :
        [ genChild(), genChild() ];
}