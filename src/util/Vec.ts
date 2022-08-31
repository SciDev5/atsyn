export default class Vec {
    constructor(
        readonly x:number,
        readonly y:number,
    ) {}

    plus(other:Vec) {
        return new Vec(
            this.x+other.x,
            this.y+other.y,
        );
    }
    get negative() {
        return this.times(-1);
    }
    minus(other:Vec) {
        return this.plus(other.negative);
    }
    times(scale:number) {
        return new Vec(
            this.x*scale,
            this.y*scale,
        );
    }
    dot(other:Vec) {
        return (
            this.x*other.x +
            this.y*other.y
        );
    }
    get lenSq() {
        return this.dot(this);
    }
    get len() {
        return Math.sqrt(this.lenSq);
    }
    get norm() {
        return this.times(1/this.len);
    }
    get angle() {
        return Math.atan2(this.y,this.x);
    }
    static fromAngle(angle:number) {
        return new Vec(Math.cos(angle),Math.sin(angle));
    }

    roundSnap(granularity = 1) {
        return new Vec(
            Math.round(this.x / granularity) * granularity,
            Math.round(this.y / granularity) * granularity,
        );
    }
}