class BasicBusiness {
    constructor(app, schemaName, ctx) {
        this.app = app;
        this.db = this.app.db(schemaName);               

        if (ctx) {
            this.db = this.db.forkWithCtx(ctx);
        }
    }

    async withOtherDb_(name, fromApp, asyncActionFn) {
        if (asyncActionFn == null && typeof fromApp === 'function') {
            asyncActionFn = fromApp;
            fromApp = null;
        }            

        let db;

        try {            
            if (fromApp) {
                let _app = this.app.getOtherApp(fromApp);
                db = _app.db(name);
            } else {
                db = this.app.db(name);
            }
            if (this.db.ctx) {
                db = db.forkWithCtx(this.db.ctx);
            } 

            return await asyncActionFn(db);
        } finally {
            if (db && db !== this.db) {
                // close the db connection if it's not the same as the current one
                db.end();
            }
        }
    }

    otherBus(name, fromApp) {
        return this.app.bus(name, fromApp, this.db.ctx);
    }    
}

export default BasicBusiness;