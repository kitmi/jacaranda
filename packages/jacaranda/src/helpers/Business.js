class BasicBusiness {
    constructor(app, schemaName, ctx) {
        this.app = app;
        this.db = this.app.db(schemaName);               

        if (ctx) {
            this.db = this.db.forkWithCtx(ctx);
        }
    }
}

export default BasicBusiness;