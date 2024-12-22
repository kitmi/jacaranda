import { _, batchAsync_ } from '@kitmi/utils';
import { runtime, NS_MODULE } from '@kitmi/jacaranda';
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
     * @property {boolean} [options.logMessage] - Flag to log queued message
     * @property {integer} [options.exchanges] - Milliseconds to wait before reconnecting
     */
    constructor(app, connectionString, options) {
        super(app, 'rabbitmq', connectionString, options);

        this.channels = {};
        this.connect();
    }

    getChannelName(opts, direction) {
        return opts.exchange ? `[X]${opts.exchange}|${direction}` : `[Q]${opts.queue}|${direction}`;
    }

    async logEnqueue(queue, obj) {
        const logMsg = `${this.driver}: new message enqueued to [${queue}].`;

        if (this.options.logStatement) {
            this.app.log('info', logMsg, { msg: obj });
        } else {
            this.app.log('verbose', logMsg);
        }
    }

    async logDequeue(queue, obj) {
        const logMsg = `${this.driver}: new message dequeued from [${queue}].`;

        if (this.options.logStatement) {
            this.app.log('info', logMsg, { msg: obj });
        } else {
            this.app.log('verbose', logMsg);
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

        try {
            this.conn?.close();
        } catch (err) {}
    }

    /**
     * Create a database connection based on the default connection string of the connector and given options.
     */
    connect() {
        if (!this.conn) {
            this.conn = new Connection(this.connectionString);

            this.conn.on('error', (err) => {
                this.app.log('error', `${this.driver}: connection error: ${err.message}}`);
            });

            this.conn.on('connection', () => {
                this.app.log('info', `${this.driver}: connection successfully (re)established.`);
            });

            const { publishers, connectorName } = this.options;

            _.each(publishers, (opts, index) => {
                if (!opts.exchange && !opts.queue) {
                    throw new InvalidArgument(
                        `${this.driver}[${connectorName}]: missing exchange or queue for publisher "#${index}".`
                    );
                }

                const chKey = this.getChannelName(opts, 'out');
                const chOpts = { confirm: true, maxAttempts: 2 };
                if (opts.exchange) {
                    chOpts.exchanges = [{ durable: true, type: 'topic', ...opts }];
                } else {
                    chOpts.queues = [{ durable: true, ...opts }];
                }

                this.channels[chKey] = this.conn.createPublisher(chOpts);
            });
        }

        return this.conn;
    }

    ensureChannel(opts, direction, handler) {
        const chKey = this.getChannelName(opts, direction);
        const ch = this.channels[chKey];

        if (ch == null) {
            if (direction === 'out') {
                throw new InvalidArgument(`${this.driver}: missing pre-configured channel for publisher "${chKey}".`);
            }

            // Consume messages from a queue:
            // See API docs for all options
            const sub = this.conn.createConsumer(opts, handler);

            sub.on('error', (err) => {
                this.app.log('error', `${this.driver}: consumer [${chKey}] error: ${err.message}}`);
            });

            return (this.channels[chKey] = sub);
        }

        return ch;
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

        const pub = this.ensureChannel({ queue }, 'out');

        await pub.send(queue, obj);

        this.logEnqueue(queue, obj);
    }

    /**
     * Waiting for message from a queue by a worker.
     * @see https://github.com/cody-greene/node-rabbitmq-client
     * @param {*} queue
     * @param {workerFunction} consumerMethod
     * @param {boolean} [nonCritical=false] - Flag to indicate if the message is non-critical
     */
    waitForJob(queue, consumerMethod, nonCritical) {
        if (!queue) {
            throw new InvalidArgument('Missing queue name.');
        }

        this.ensureChannel(
            {
                queue,
                queueOptions: { durable: true },
                noAck: nonCritical,
                concurrency: 1,
                qos: { prefetchCount: 2 },
            },
            'in',
            async (msg) => {
                this.logDequeue(queue, msg);
                return consumerMethod(msg);
            }
        );
    }
}

RabbitmqConnector.driverLib = rabbitmq;

export default RabbitmqConnector;
