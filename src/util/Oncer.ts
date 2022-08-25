export class OncerError extends Error {}

export default class Oncer {
    constructor(
        readonly errorMessage:string,
    ) {}
    
    public onCall() {
        this.onCall = function(){
            throw new OncerError(this.errorMessage);
        };
    }
}