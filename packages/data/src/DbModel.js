import { naming, sleep_ } from '@kitmi/utils';
import { ApplicationError, UnexpectedState } from '@kitmi/types';

class DbModel {
    constructor(app, connector, transaction) {
        this.app = app;
        this.connector = connector;
        this.transaction = transaction;

        this._entities = {};
    }

    get paramToken() {
        return this.connector.specParamToken;
    }

    escapeId(id) {
        return this.connector.escapeId(id);
    }

    escapeValue(val) {
        return this.connector.escapeValue(val);
    }

    /**
     * Get the db model metadata, e.g. Entity classes.
     */
    get meta() {
        return this.constructor.meta;
    }

    /**
     * Get the schema name.
     * @returns {string}
     */
    get schemaName() {
        return this.meta.schemaName;
    }

    /**
     * Get the driver.
     * @returns {string}
     */
    get driver() {
        return this.connector.driver;
    }

    /**
     * Fork the model with transaction flag.
     * @param {Client} transaction - Client created from beginTransaction_.
     * @returns {DbModel}
     */
    fork(transaction) {
        return new this.constructor(this.app, this.connector, transaction);
    }

    /**
     * Get an entity instance by entity name.
     * @param {string} entityName
     * @returns {EntityModel}
     */
    entity(entityName) {
        if (this._entities[entityName]) return this._entities[entityName];

        const modelClassName = naming.pascalCase(entityName);
        if (this._entities[modelClassName]) return this._entities[modelClassName];

        const EntityModel = this.meta.entities[modelClassName];

        if (typeof EntityModel !== 'function') {
            throw new Error(`Entity "${entityName}" not found in the db model.`);
        }

        return (this._entities[modelClassName] = new EntityModel(this));
    }

    /**
     * Run a transaction.
     * @param {*} action_
     * @param {*} connOptions
     * @param {*} maxRetry
     * @param {*} interval
     * @param {*} onRetry_
     */
    async transaction_(transactionFunc) {
        if (this.transaction != null) {
            // already in transaction
            return transactionFunc(this);
        }

        let db;

        try {
            db = this.fork(await this.connector.beginTransaction_());
            let result = await transactionFunc(db);
            await db.connector.commit_(db.transaction);
            return result;
        } catch (error) {
            db && (await db.connector.rollback_(db.transaction, error));
            throw error;
        } finally {
            db.end();
        }
    }

    /**
     * Run an action and automatically retry when failed.
     * @param {String} transactionName - Name of the transaction for tracking purpose.
     * @param {Function} action_ - The action to run.
     * @param {Function} onNextRetry_ - The action to run if action failed and before next retry.
     * @param {*} maxRetry
     * @param {*} interval
     * @returns {Promise} result
     */
    async retry_(transactionName, action_, onRetry_, payload, maxRetry, interval) {
        if (this.transaction != null) {
            throw new ApplicationError('"db.retry_" is not allowed in a transaction for performance issue.');
        }

        let i = 0;
        if (maxRetry == null) maxRetry = 2;

        while (i++ <= maxRetry) {
            try {
                const [finished, result] = await action_(payload);

                if (finished) {
                    return result;
                }
            } catch (error) {
                this.app.logErrorAsWarning(
                    error,
                    `Unable to complete "${transactionName}" transaction and will try ${
                        maxRetry - i + 1
                    } more times after ${interval || 0} ms.`
                );
            }

            if (i > maxRetry) {
                break;
            }

            if (interval != null) {
                await sleep_(interval);
            }

            if (onRetry_) {
                await onRetry_(payload);
            }
        }

        throw new UnexpectedState(`Failed to complete "${transactionName}" transaction after ${maxRetry} retries.`);
    }

    /**
     * End the model.
     */
    end() {
        delete this.transaction;
        delete this._entities;
        delete this.connector;
        delete this.app;
    }
}

export default DbModel;
