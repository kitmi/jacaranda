const { _ } = require('@genx/july');
const Rules = require('../enum/Rules');
const { DATETIME } = require('../types');
const { ApplicationError } = require('../utils/Errors');

function getConnector(entityModel, feature) {
    const app = entityModel.db.app;

    if (!app) {
        entityModel.db.connector.log(
            'warn',
            `"changeLog" feature does not work when used without a service container app.`
        );
        return true;
    }

    return app.getService(feature.dataSource);
}

async function createLogEntry_(entityModel, feature, context, operation) {
    const logEntry = {
        entity: entityModel.meta.name,
        operation,
        which: context.queryKey,
        changedAt: DATETIME.typeObject.local(),
    };

    if (operation !== 'delete') {
        logEntry.data = context.latest;
    } else {
        logEntry.data = context.existing;
    }

    if (feature.withUser) {
        const user = entityModel.getValueFromContext(context, feature.withUser);
        if (_.isNil(user)) {
            throw new ApplicationError(
                `Cannot get value of [${feature.withUser}] from context. Entity: ${entityModel.meta.name}, operation: ${operation}`
            );
        }

        logEntry.changedBy = user;
    }

    // dry-run mode only checks validaty of data
    if (context.options.$dryRun) {
        return;
    }

    const clConnector = getConnector(entityModel, feature);
    await clConnector.insertOne_(
        feature.storeEntity,
        logEntry,
        context.connOptions
    );
}

/**
 * A rule specifies the change of state will be tracked automatically.
 * @module EntityFeatureRuntime_ChangeLog
 */

module.exports = {
    [Rules.RULE_AFTER_CREATE]: (feature, entityModel, context) =>
        createLogEntry_(entityModel, feature, context, 'create'),
    [Rules.RULE_AFTER_UPDATE]: (feature, entityModel, context) =>
        createLogEntry_(entityModel, feature, context, 'update'),
    [Rules.RULE_AFTER_DELETE]: (feature, entityModel, context) =>
        createLogEntry_(entityModel, feature, context, 'delete'),
};
