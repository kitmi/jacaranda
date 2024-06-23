export class OpCompleted extends Error {
    constructor(payload) {
        // NAE: Not an error
        super('[NAE]Operation completed with another way.');
        this.payload = payload;
    }
}
