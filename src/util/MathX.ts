export default class MathX {
    static roundToNearest(x:number,step=1) {
        return Math.round(x/step)*step;
    }
    static floorToNearest(x:number,step=1) {
        return Math.floor(x/step)*step;
    }
    static floorMod(x:number,y:number) {
        return (x%y+y)%y;
    }
}