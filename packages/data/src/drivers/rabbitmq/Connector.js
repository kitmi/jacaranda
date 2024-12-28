import { _, batchAsync_ } from '@kitmi/utils';
import { runtime, NS_MODULE, AsyncEmitter } from '@kitmi/jacaranda';
import { tryRequire } from '@kitmi/sys';
import { InvalidArgument } from '@kitmi/types';

import Connector from '../../Connector';

const rabbitmq = runtime.get(NS_MODULE, 'rabbitmq-client') ?? tryRequire('rabbitmq-client');
const { Connection } = rabbitmq;

/**
 * A callback function to be called to handle a dequeued message.
 * @callback workerFunction
 * @param {Message} msg - Message object
 */

/**
 * Rabbitmq data storage connector.
 * @class
 * @extends Connector
 */
class RabbitmqConnector extends Connector {
    /**
     * @param {App} app
     * @param {string} connectionString
     * @param {object} options
     * @property {boolean} [options.logStatement] - Flag to log queued message
     * @property {Array} [options.exchanges] - List of exchanges to be created
     */
    constructor(app, connectionString, options) {
        super(app, 'rabbitmq', connectionString, options);

        this.channels = {};
        this.events = new AsyncEmitter();
        this.connect();
    }

    getChannelName(opts) {
        return opts.exchange
            ? opts.queue
                ? `[X]${opts.exchange}|${opts.queue}`
                : `[X]${opts.exchange}`
            : `[Q]${opts.queue}`;
    }

    async logEnqueue(queue, obj) {
        if (this.options.logStatement) {
            const logMsg = `${this.driver}: new message enqueued to [${queue}].`;
            this.app.log('info', logMsg, { msg: obj });
        }
    }

    async logDequeue(queue, obj) {
        if (this.options.logStatement) {
            const logMsg = `${this.driver}: new message dequeued from [${queue}].`;
            this.app.log('info', logMsg, { msg: obj });
        }
    }

    /**
     * Close all connection initiated by this connector.
     */
    async end_() {
        if (this.channels) {
            await batchAsync_(this.channels, async (ch) => {
                try {
                    await ch.close();
                } catch (err) {}
            });

            delete this.channels;
        }

        await this.events.emit_('closing');

        try {
            this.conn?.close();
        } catch (err) {}

        this.events.allOff();
    }

    /**
     * Create a database connection based on the default connection string of the connector and given options.
     */
    connect() {
        if (!this.conn) {
            this.conn = new Connection(this.connectionString);

            this.conn.on('error', (err) => {
                this.app.log('error', `${this.driver}: connection error: ${err.message}}`, _.omit(err, ['message', 'stack']));
            });

            this.conn.on('connection.blocked', (reason) => {
                this.app.log('warn', `${this.driver}: connection blocked: ${reason}}`);
            });

            this.conn.on('connection.unblocked', () => {
                this.app.log('info', `${this.driver}: connection unblocked.`);
            });

            if (this.options.logConnection) {
                this.conn.on('connection', () => {
                    this.app.log('info', `${this.driver}: connection successfully (re)established.`);
                });
            }

            const { publishers, connectorName } = this.options;

            _.each(
                publishers,
                ({ confirm = true, maxAttempts = 2, routingKey = '', durable = true, ...opts }, index) => {
                    if (!opts.exchange && !opts.queue) {
                        throw new InvalidArgument(
                            `${this.driver}[${connectorName}]: missing exchange or queue for publisher "#${index}".`
                        );
                    }

                    opts.durable = durable;

                    const chKey = this.getChannelName(opts);
                    const chOpts = { confirm, maxAttempts };
                    const arrayOpts = [opts];

                    if (opts.exchange) {
                        if (!opts.type) {
                            opts.type = 'fanout';
                        }
                        chOpts.exchanges = arrayOpts;
                    } else {
                        chOpts.queues = arrayOpts;
                    }

                    this.channels[chKey] = this.conn.createPublisher(chOpts);
                }
            );
        }

        return this.conn;
    }

    ensurePubChannel(opts) {
        const chKey = this.getChannelName(opts);
        const ch = this.channels[chKey];

        if (ch == null) {
            throw new InvalidArgument(`${this.driver}: missing pre-configured channel for publisher "${chKey}".`);
        }

        return [chKey, ch];
    }

    async createConsumer_(opts, handler) {
        return new Promise((resolve, reject) => {
            const chKey = this.getChannelName(opts);

            let _deleteOnStop = false;
            let _timeout = 5000;

            if (opts.exchange) {
                let { exchange, type = 'fanout', durable = true, deleteOnStop, timeout, ..._opts } = opts;
                if (deleteOnStop) {
                    _deleteOnStop = deleteOnStop;
                }
                if (timeout) {
                    _timeout = timeout;
                }
                opts = { ..._opts, exchanges: [{ exchange, type, durable }] };
            }

            const timerHandle = setTimeout(() => {
                reject(new Error(`${this.driver}: consumer [${chKey}] timeout.`));
            }, _timeout);

            const sub = this.conn.createConsumer(opts, (msg) => {
                this.logDequeue(chKey, msg);
                return handler(msg);
            });

            sub.on('error', (err) => {
                this.app.log('error', `${this.driver}: consumer [${chKey}] error: ${err.message}}`, _.omit(err, ['message', 'stack']));
            });

            sub.on('ready', () => {
                clearTimeout(timerHandle);
                if (this.options.logConnection) {
                    this.app.log('info', `${this.driver}: consumer [${chKey}] ready.`);
                }
                resolve(chKey);
            });

            if (_deleteOnStop) {
                this.events.on('closing', async () => {
                    await this.conn.queueDelete({ queue: sub.queue });
                });
            }

            this.app.on('stopping', async () => {
                await sub.close();
            });
        });
    }

    async ping_() {
        return true;
    }

    /**
     * Send a job to worker queue.
     * @see https://github.com/cody-greene/node-rabbitmq-client
     * @param {*} queue
     * @param {*} obj
     */
    async postJob_(queue, obj) {
        if (!queue) {
            throw new InvalidArgument('Missing queue name.');
        }

        const [key, pub] = this.ensurePubChannel({ queue });

        await pub.send(queue, obj);

        this.logEnqueue(key, obj);
    }

    /**
     * Publish a message to an exchange.
     * @param {String} exchange
     * @param {Object} obj
     * @param {Object} [opts]
     */
    async publish_(exchange, obj, opts) {
        if (!exchange) {
            throw new InvalidArgument('Missing exchange name.');
        }

        const [key, pub] = this.ensurePubChannel({ exchange });

        await pub.send({ exchange, routingKey: '', ...opts }, obj);

        this.logEnqueue(key, obj);
    }

    /**
     * Waiting for message from a queue by a worker.
     * @see https://github.com/cody-greene/node-rabbitmq-client
     * @param {*} queue
     * @param {workerFunction} consumerMethod
     * @param {boolean} [nonCritical=false] - Flag to indicate if the message is non-critical
     */
    async waitForJob_(queue, consumerMethod, nonCritical) {
        if (!queue) {
            throw new InvalidArgument('Missing queue name.');
        }

        return this.createConsumer_(
            {
                queue,
                queueOptions: { durable: true },
                noAck: nonCritical,
                concurrency: 1,
                qos: { prefetchCount: 2 },
            },
            consumerMethod
        );
    }

    /**
     * Subscribe to a message from an exchange.
     * @param {String} exchange
     * @param {workerFunction} consumerMethod
     */
    async subscribe_(exchange, consumerMethod, { routingKey = '', ...options } = {}) {
        if (!exchange) {
            throw new InvalidArgument('Missing exchange name.');
        }

        return this.createConsumer_(
            {
                exchange,
                queueBindings: [{ exchange, routingKey }],
                exclusive: true,
                noAck: true,
                ...options,
            },
            consumerMethod
        );
    }
}

RabbitmqConnector.driverLib = rabbitmq;

export default RabbitmqConnector;
