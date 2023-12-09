"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _utils = require("@kitmi/utils");
let HTTPException;
class HonoEngine {
    async init_(config) {
        const Hono = await this.server.tryRequire_('hono');
        if (!HTTPException) {
            const { HTTPException: _HTTPException } = await this.server.tryRequire_('hono/http-exception');
            HTTPException = _HTTPException;
        }
        this.engineType = Hono;
        this.engine = new Hono();
        this._initialize(config ?? {});
    }
    async _initialize_(options) {
        const port = options.httpPort || 2331;
        if (typeof Bun !== 'undefined') {
            // this code will only run when the file is run with Bun
            this.server.on('ready', ()=>{
                const httpServer = Bun.serve({
                    port,
                    fetch: this.engine.fetch
                });
                this._ready(httpServer);
            });
        } else {
            const { serve } = await this.server.tryRequire_('@hono/node-server');
            server.on('ready', ()=>{
                const httpServer = serve({
                    port,
                    fetch: this.engine.fetch
                });
                this._ready(httpServer);
            });
        }
    }
    _ready(httpServer) {
        this.server.httpServer = httpServer;
        this.server.host = httpServer.hostname;
        this.server.port = httpServer.port;
        this.server.log('info', `A hono http service is listening on port [${httpServer.port}] ...`);
        /**
         * Http server ready event
         * @event WebServer#httpReady
         */ this.server.emit_('httpReady', this.server);
    }
    use(middleware) {
        this.engine.use(middleware);
    }
    attach(router) {
        this.engine.use(router.routes());
        this.engine.use(router.allowedMethods());
    }
    mount(route, childApp) {
        this.engine.route(route, childApp.engine);
    }
    constructor(server1){
        this.server = server1;
    }
}
const _default = HonoEngine;

//# sourceMappingURL=hono.js.map