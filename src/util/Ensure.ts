import RangeOf from "./RangeOf";

export class EnsureFailError extends Error {}
type EnAnd<T> = {readonly and:Ensure<T>};
type EnMessage = string | { message:string, includeMust?:boolean };
export default class Ensure<T> {
    private inverted = false;
    private constructor(
        private readonly value:T,
        private readonly varName?:string,
    ) {}
    public static thatSomething(varName:string):Ensure<undefined> {
        return new Ensure(undefined,varName);
    }
    public static that<T>(value:T,varName?:string):Ensure<T> {
        return new Ensure(value,varName);
    }
    public get not():Ensure<T> {
        this.inverted = !this.inverted;
        return this;
    }
    private clearInversion() {
        this.inverted = false;
    }
    private readonly andGen:EnAnd<T> = (()=>{
        const clearInversionAndGetSelf = ()=>{
            this.clearInversion();
            return this;
        };
        return {get and() {
            return clearInversionAndGetSelf();
        }};
    })();



    public isTypeOf(type:"string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function", customMessage?:string): EnAnd<T> {
        return this.ifNotThenVarFailed(
            typeof this.value === type,
            "be of type "+type,
            customMessage,
        );
    }
    public isInstanceOf(clazz:{new():void,name:string}, customMessage?:string): EnAnd<T> {
        return this.ifNotThenVarFailed(
            this.value instanceof clazz,
            "be an instance of "+clazz.name,
            customMessage,
        );
    }
    public isInt(customMessage?:string): EnAnd<T> {
        return this.ifNotThenVarFailed(
            Number.isInteger(this.value),
            "be an integer",
            customMessage,
        );
    }
    public isFinite(customMessage?:string): EnAnd<T> {
        return this.ifNotThenVarFailed(
            Number.isFinite(this.value),
            "be finite",
            customMessage,
        );
    }
    public isEqualTo(constV:T,constVName:string,customMessage?:string): EnAnd<T> {
        return this.ifNotThenVarFailed(
            this.value === constV,
            `be equal to '${constVName}'`,
            customMessage,
        );
    }
    // public isInRange(min:number,minInclusive:boolean,max:number,maxInclusive:boolean,customMessage?:string): EnAnd<T> {
    //     if ( typeof this.value !== "number")
    //         this.varFailed("be a number",customMessage);
    //     return this.ifNotThenVarFailed(
    //         (
    //             (minInclusive ? this.value  >= min : this.value  > min) &&
    //             (maxInclusive ? this.value  <= max : this.value  < max)
    //         ),
    //         `be in the range <${minInclusive?"[":"("}${min},${max}${maxInclusive?"]":")"}>`,
    //         customMessage,
    //     );
    // }
    // public isInRangeExclusive(min:number,max:number,customMessage?:string): EnAnd<T> {
    //     return this.isInRange(min,false,max,false,customMessage);
    // }
    // public isInRangeInclusive(min:number,max:number,customMessage?:string): EnAnd<T> {
    //     return this.isInRange(min,true,max,true,customMessage);
    // }
    // public isGreaterThan(min:number,isInclusive?:"orEqualTo"|"",customMessage?:string): EnAnd<T> {
    //     return this.isInRange(min,!!isInclusive,Infinity,true,customMessage);
    // }
    // public isLessThan(min:number,isInclusive?:"orEqualTo"|"",customMessage?:string): EnAnd<T> {
    //     return this.isInRange(-Infinity,true,min,!!isInclusive,customMessage);
    // }
    public isTruthy(customMessage?:string):EnAnd<T> {
        return this.ifNotThenVarFailed(
            !!this.value,
            "be truthy",
            customMessage,
        );
    }
    public isNullish(customMessage?:string):EnAnd<T> {
        return this.ifNotThenVarFailed(
            this.value === null || this.value === undefined,
            "be null or undefined",
            customMessage,
        );
    }
    public isTrue(v:false,message?:string):never;
    public isTrue(v:true,message?:string):EnAnd<T>;
    public isTrue(v:boolean,message?:string):EnAnd<T>;
    public isTrue(v:boolean,message?:string):EnAnd<T> {
        return this.ifNotThenVarFailed(
            v,
            {
                message: message ?? "isTrue ensureance failed",
                includeMust: false,
            },
        );
    }
    public isIncludedIn(list:Set<T>|T[],customMessage?:string):EnAnd<T> {
        return this.ifNotThenVarFailed(
            list instanceof Set ? list.has(this.value) : list.includes(this.value),
            `be included in {${list}}`
        );
    }
    public isIn(thingToBeIn:{[k:string|symbol]:unknown}):EnAnd<T> {
        return this.ifNotThenVarFailed(
            this.value in thingToBeIn,
            `be in [${thingToBeIn}]`
        );
    }
    public isInRange(range:RangeOf):EnAnd<T> {
        return this.isTypeOf("number").and.ifNotThenVarFailed(
            range.applyTo(this.value as never as number),
            `be in range [${range}]`
        );
    }


    private ifNotThenVarFailed(condition:boolean,message:EnMessage,customMessage?:string):EnAnd<T> {
        if (!condition !== this.inverted) // `!==` behaves like XOR with booleans
            this.varFailed(message,customMessage);
        return this.andGen;
    }
    private get varPrefix():string {
        if (this.varName)
            return `variable '${this.varName}'`;
        else return "";
    }
    private static failed(value:unknown,message?:string):never {
        throw new EnsureFailError(`Ensure Failed${message?": "+message:"."}\n[got:${value}]`);
    }
    private varFailed(message:EnMessage,customMessage?:string):never {
        const messageData = typeof message === "string" ? {message} : message,
            messageText = messageData.message,
            includeMust = messageData.includeMust ?? true;
        Ensure.failed(this.value, customMessage ?? [
            this.varPrefix,
            includeMust && "must",
            this.inverted && "not",
            messageText,
        ].filter(Boolean).join(" ")+".");
    }
}

// @ts-expect-error yes
window.Ensure = Ensure;