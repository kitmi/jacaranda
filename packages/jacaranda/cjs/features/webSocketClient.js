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
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    stage: _Feature.default.SERVICE,
    groupable: true,
    packages: [
        'ws'
    ],
    load_: async function(app, options, name) {
        const { endpoint, autoReconnect, reconnectInterval = 5000, wsOptions } = app.featureConfig(options, {
            schema: {
                endpoint: {
                    type: 'text'
                },
                autoReconnect: {
                    type: 'boolean',
                    default: true
                },
                reconnectInterval: {
                    type: 'integer',
                    default: 5000
                },
                wsOptions: {
                    type: 'object',
                    optional: true
                }
            }
        }, name);
        const WebSocket = app.tryRequire('ws');
        let ws;
        let wsConnected = false;
        let shouldReconnect = autoReconnect;
        const queue = [];
        const wsClient = {
            get isConnected () {
                return wsConnected;
            },
            onMessage: null,
            onReconnect: null,
            onClose: null,
            onError: null,
            async connect_ (reconnect = false) {
                if (wsConnected) {
                    return wsClient;
                }
                return new Promise((resolve, reject)=>{
                    ws = new WebSocket(endpoint, wsOptions);
                    ws.on('open', ()=>{
                        wsConnected = true;
                        queue.forEach(({ data, resolve, reject })=>{
                            ws.send(data, (error)=>{
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve();
                                }
                            });
                        });
                        queue.length = 0;
                        app.log('info', `Successfully connected to web socket "${endpoint}".`);
                        resolve(wsClient);
                        if (reconnect) {
                            wsClient.onReconnect?.();
                        }
                    });
                    ws.on('message', (data)=>{
                        wsClient.onMessage?.(data);
                    });
                    ws.on('close', (code, reason)=>{
                        wsConnected = false;
                        app.log('info', `Disconnected from web socket "${endpoint}".`);
                        wsClient.onClose?.(code, reason);
                        ws = null;
                        if (shouldReconnect) {
                            setTimeout(()=>wsClient.connect_(true).catch(app.logError), reconnectInterval);
                        }
                    });
                    ws.on('error', (error)=>{
                        if (!wsConnected) {
                            reject(error);
                        } else {
                            app.logError(error);
                        }
                    });
                    ws.on('unexpected-response', ()=>{
                        app.log('warn', `Unexpected response from web socket "${endpoint}".`);
                    });
                });
            },
            async send_ (data) {
                return new Promise((resolve, reject)=>{
                    if (!wsConnected) {
                        queue.push({
                            data,
                            resolve,
                            reject
                        });
                    } else {
                        ws.send(data, (error)=>{
                            if (error) {
                                reject(error);
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            },
            close () {
                shouldReconnect = false;
                ws?.close();
                ws = null;
                queue.forEach((item)=>{
                    item.reject(new Error('WebSocket closed.'));
                });
                queue.length = 0;
            }
        };
        app.once('ready', ()=>{
            wsClient.connect_().catch(app.logError);
        });
        app.once('stopping', ()=>{
            wsClient.close();
        });
        app.registerService(name, wsClient);
    }
};

//# sourceMappingURL=webSocketClient.js.map