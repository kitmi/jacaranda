import { _ } from '@kitmi/utils';
import EntityModel from '../relational/EntityModel';
import {
    ApplicationError,
} from '@kitmi/types';
import { Types } from '@kitmi/validators/allSync';

/**
 * PostgresEntityModel entity model class.
 */
class PostgresEntityModel extends EntityModel {
    /**
     * [override] Serialize value into database acceptable format.
     * @param {object} name - Name of the symbol token
     */
    _translateSymbolToken(name) {
        if (name === 'NOW') {
            return this.db.connector.raw('NOW()');
        }

        throw new Error('not support: ' + name);
    }

    /**
     * [override]
     * @param {*} value
     * @param {*} info
     */
    _serializeByTypeInfo(value, info) {
        if (info.type === 'boolean') {
            return value ? true : false;
        }

        if (info.type === 'datetime') {
            return Types.DATETIME.serialize(value);
        }

        if (info.type === 'array' && Array.isArray(value)) {
            if (info.csv) {
                return Types.ARRAY.toCsv(value);
            } else {
                return value;
            }
        }

        /* postgres support jsonb
        if (info.type === 'object') {
            return Types.OBJECT.serialize(value);
        }
        */

        return value;
    }

    /**
     * Post create processing.
     * @param {*} context
     * @property {object} [context.options] - Create options
     * @property {bool} [options.$getCreated] - Retrieve the newly created record from db.
     */
    async _internalAfterCreate_(context) {
        // nothing to do with postgres since it can return directly in insert clause
    }

    /**
     * Post update processing.
     * @param {*} context
     * @property {object} [context.options] - Update options
     * @property {bool} [context.options.$getUpdated] - Retrieve the newly updated record from db.
     */
    async _internalAfterUpdate_(context) {
        const options = context.options;

        if (options.$fullResult) {
            context.rawOptions.$result = context.result || {
                affectedRows: 0,
                changedRows: 0,
            };
        }

        let retrieveUpdated = options.$getUpdated;

        if (!retrieveUpdated) {
            if (
                options.$retrieveActualUpdated &&
                context.result.affectedRows > 0
            ) {
                retrieveUpdated = options.$retrieveActualUpdated;
            } else if (
                options.$retrieveNotUpdate &&
                context.result.affectedRows === 0
            ) {
                retrieveUpdated = options.$retrieveNotUpdate;
            }
        }

        if (retrieveUpdated) {
            const condition = {
                $query: this.getUniqueKeyValuePairsFrom(options.$query),
            };
            if (options.$skipUniqueCheck) {
                condition.$skipUniqueCheck = options.$skipUniqueCheck;
            }

            let retrieveOptions = {};

            if (_.isPlainObject(retrieveUpdated)) {
                retrieveOptions = retrieveUpdated;
            } else if (options.$relationships) {
                retrieveOptions.$relationships = options.$relationships;
            }

            context.return = await this.findOne_(
                {
                    ...condition,
                    $includeDeleted: options.$getDeleted,
                    ...retrieveOptions,
                },
                context.connOptions
            );

            if (context.return) {
                context.queryKey = this.getUniqueKeyValuePairsFrom(
                    context.return
                );
            } else {
                context.queryKey = condition.$query;
            }
        }
    }

    /**
     * Post update processing.
     * @param {*} context
     * @param {object} [options] - Update options
     * @property {bool} [options.$getUpdated] - Retrieve the newly updated record from db.
     */
    async _internalAfterUpdateMany_(context) {
        const options = context.options;

        if (options.$fullResult) {
            context.rawOptions.$result = context.result || {
                affectedRows: 0,
                changedRows: 0,
            };

            /**
             * afterUpdateMany ResultSetHeader {
             * fieldCount: 0,
             * affectedRows: 1,
             * insertId: 0,
             * info: 'Rows matched: 1  Changed: 1  Warnings: 0',
             * serverStatus: 3,
             * warningStatus: 0,
             * changedRows: 1 }
             */
        }

        if (options.$getUpdated) {
            let retrieveOptions = {};

            if (_.isPlainObject(options.$getUpdated)) {
                retrieveOptions = options.$getUpdated;
            } else if (options.$relationships) {
                retrieveOptions.$relationships = options.$relationships;
            }

            context.return = await this.findAll_(
                {
                    $query: options.$query,
                    $includeDeleted: options.$getDeleted,
                    ...retrieveOptions,
                },
                context.connOptions
            );
        }

        context.queryKey = options.$query;
    }

    /**
     * Before deleting an entity.
     * @param {*} context
     * @property {object} [context.options] - Delete options
     * @property {bool} [context.options.$getDeleted] - Retrieve the recently deleted record from db.
     */
    async _internalBeforeDelete_(context) {
        if (context.options.$getDeleted) {
            await this.ensureTransaction_(context);

            const retrieveOptions = _.isPlainObject(
                context.options.$getDeleted
            )
                ? {
                      ...context.options.$getDeleted,
                      $query: context.options.$query,
                  }
                : { $query: context.options.$query };

            if (context.options.$physicalDeletion) {
                retrieveOptions.$includeDeleted = true;
            }

            context.return = context.existing = await this.findOne_(
                retrieveOptions,
                context.connOptions
            );
        }

        return true;
    }

    async _internalBeforeDeleteMany_(context) {
        if (context.options.$getDeleted) {
            await this.ensureTransaction_(context);

            const retrieveOptions = _.isPlainObject(
                context.options.$getDeleted
            )
                ? {
                      ...context.options.$getDeleted,
                      $query: context.options.$query,
                  }
                : { $query: context.options.$query };

            if (context.options.$physicalDeletion) {
                retrieveOptions.$includeDeleted = true;
            }

            context.return = context.existing = await this.findAll_(
                retrieveOptions,
                context.connOptions
            );
        }

        return true;
    }

    /**
     * Post delete processing.
     * @param {*} context
     */
    _internalAfterDelete_(context) {
        if (context.options.$fullResult) {
            context.rawOptions.$result = context.result;
        }
    }

    /**
     * Post delete processing.
     * @param {*} context
     */
    _internalAfterDeleteMany_(context) {
        if (context.options.$fullResult) {
            context.rawOptions.$result = context.result;
        }
    }
}

export default PostgresEntityModel;
