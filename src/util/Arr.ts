import ReverseType from "./ReverseType";

export default class Arr {
    public static genByI<T>(len:number,filler:(i:number)=>T):T[] {
        if (len === 0) return [];
        return new Array(len).fill(0).map((v,i)=>filler(i));
    }
    public static genFill<T>(len:number,fill:T):T[] {
        if (len === 0) return [];
        return new Array(len).fill(fill);
    }
    public static nMatchI(len:number,isMatch:(i:number)=>boolean):number {
        return new Array(len).fill(0).filter((_,i)=>isMatch(i)).length;
    }
    /**
     * Combine two arrays element-wise by.
     * @param musher The callback called to combine values from each array.
     */
    public static mushTogether<T0,T1,R>(a:T0[],b:T1[],musher:(a:T0,b:T1)=>R):R[] {
        if (a.length !== b.length)
            throw new Error("Arr.mushToghether array lengths must match");
        return a.map((_,i)=>musher(a[i],b[i]));
    }
    public static reduceSum(v:number[]):number {
        return v.reduce((a,b)=>a+b);
    }
    public static reduceAverage(v:number[]):number {
        return this.reduceSum(v)/v.length;
    }

    public static randomSample<T>(arr:T[]|readonly T[]):T {
        return arr[Math.floor(Math.random()*arr.length)];
    }

    public static conditionalReverse<T extends unknown[]>(arr:T,reverse:boolean):ReverseType<T>|T {
        return reverse ? (arr.reverse() as ReverseType<T>) : arr;
    }
}