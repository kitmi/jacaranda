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
const _worker = /*#__PURE__*/ _interop_require_default(require("./worker"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Start a message queue worker.
 * @param {Function} worker
 * @param {*} queueService
 * @param {*} queueName
 * @param {object} options
 */ async function startQueueWorker(worker, queueService, queueName, options) {
    const workerOptions = {
        workerName: queueName + 'Worker',
        ...options,
        dontStop: true
    };
    return (0, _worker.default)(async (app)=>{
        let messageQueue = app.getService(queueService);
        app.log('info', `A queue worker is started and waiting for message on queue "${queueName}" ...`);
        await messageQueue.workerConsume_(queueName, (channel, msg)=>{
            let info = msg && msg.content;
            try {
                info = info && JSON.parse(info.toString());
            } catch (error) {
                app.log('error', 'The incoming message is not a valid JSON string.');
                channel.ack(msg);
                return;
            }
            if (info && info.$mock) {
                app.log('info', 'A mock message is received.\nMessage: ' + raw);
                channel.ack(msg);
                return;
            }
            worker(app, info).then((shouldAck)=>{
                if (shouldAck) {
                    channel.ack(msg);
                } else {
                    channel.nack(msg);
                }
            }).catch((error)=>{
                app.logError(error);
                if (error.needRetry) {
                    channel.nack(msg);
                } else {
                    channel.ack(msg);
                }
            });
        });
    }, workerOptions);
}
const _default = startQueueWorker;

//# sourceMappingURL=queueWorker.js.map