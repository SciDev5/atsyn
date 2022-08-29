export default class ShapeGen<T> {
    private constructor(
        private readonly gen:()=>T
    ) {}
    private currentValue?:[T];
    get _():T {
        this.currentValue ??= [this.gen()];
        return this.currentValue[0];
    }
    update() {
        delete this.currentValue;
    }

    static make<T>(gen:()=>T) {
        return new ShapeGen(gen);
    }
}