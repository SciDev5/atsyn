interface RangeConstraint {
    applyTo(x:number):boolean;
}
class RangeConstraintInequality implements RangeConstraint {
    constructor(
        readonly value:number,
        readonly shouldGreater:boolean,
        readonly shouldEqual:boolean,
    ) {}
    applyTo(x:number) {
        return x === this.value ?
            this.shouldEqual :
            this.shouldGreater === (x > this.value);
    }
}
class RangeConstraintEquality implements RangeConstraint{
    constructor(
        readonly value:number,
        readonly invert:boolean,
    ) {}
    applyTo(x:number) {
        return this.invert !== (x===this.value); // `!==` acts like xor here.
    }
}

export default class RangeOf {
    private constraints:RangeConstraint[][] = [[]]; // or-ed group of and-ed groups of constraints
    private nextOpIsOr = false;


    private addConstraint(constraint:RangeConstraint) {
        if (this.nextOpIsOr)
            this.constraints.push([]);
        this.nextOpIsOr = false;

        this.constraints[this.constraints.length-1].push(constraint);
        return this;
    }

    private constructor(otherToClone?:RangeOf) {
        if (otherToClone) {
            this.constraints = [...otherToClone.constraints];
            this.constraints[this.constraints.length-1] = [...this.constraints[this.constraints.length-1]]; // because only this one may get modified.
        }
        return new Proxy(this,{
            has(range, p) {
                const value = typeof p === "symbol"? NaN : parseFloat(p);
                if (isNaN(value)) return p in range;
                else return range.applyTo(value);
            },
        });
    }

    public static get everything() { return new RangeOf }

    public get or() { this.nextOpIsOr = true; return this }
    public lessThan              (value:number) { return this.addConstraint(new RangeConstraintInequality(value,false,false)) }
    public greaterThan           (value:number) { return this.addConstraint(new RangeConstraintInequality(value,true, false)) }
    public lessThanOrEqualTo     (value:number) { return this.addConstraint(new RangeConstraintInequality(value,false,true )) }
    public greaterThanOrEqualTo  (value:number) { return this.addConstraint(new RangeConstraintInequality(value,true, true )) }
    public equalTo               (value:number) { return this.addConstraint(new RangeConstraintEquality(value,false)) }
    public notEqualTo            (value:number) { return this.addConstraint(new RangeConstraintEquality(value,true )) }

    public after(value:number) { return this.greaterThan(value) }
    public until(value:number) { return this.lessThan(value) }
    public from(value:number) { return this.greaterThanOrEqualTo(value) }
    public to(value:number) { return this.lessThanOrEqualTo(value) }

    public applyTo(x:number) {
        return this.constraints.some( // groups coallalessed by or
            group => group.every( // constraints in groups coallalessed by and
                constraint =>constraint.applyTo(x)
            )
        );
    }
}