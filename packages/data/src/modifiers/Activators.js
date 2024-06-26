import typeSystem from '@kitmi/validators/allSync';
import { _ } from '@kitmi/utils';
import { ApplicationError } from '@kitmi/types';

import { v4 } from '@napi-rs/uuid';

// Activator will only be called when the field value is null
// Activator signature: (entity, field, context, ...args) => value
const activatorTable = typeSystem.handlers.activator;
activatorTable['isEqual'] = (args) => args[0] === args[1];
activatorTable['isNotEqual'] = (args) => args[0] !== args[1];
activatorTable['setValueWhen'] = ([value, condition]) => (condition ? value : null);
activatorTable['concat'] = ([sep = '', ...strs]) => strs.join(sep);
activatorTable['sum'] = (args) => args.reduce((sum, v) => (sum += v), 0);
activatorTable['multiply'] = ([multiplier, multiplicand]) => multiplier * multiplicand;
activatorTable['uuid'] = () => v4();
activatorTable['timeOfValueSet'] = ([value]) => (value != null ? new Date() : null);

export const _Activators = _.mapValues(
    activatorTable,
    (activator) =>
        (entity, field, context, ...options) =>
            activator(options, field, context)
);

_Activators.fetch_ = async (entity, field, context, assoc, options) => {
    const parts = assoc.split('.');

    const selectedField = parts.pop();
    const remoteAssoc = parts.join('.');
    const localAssoc = parts.shift();
    let interAssoc;

    if (parts.length > 0) {
        interAssoc = parts.join('.');
    }

    if (!(localAssoc in context.latest)) {
        return undefined;
    }

    const assocValue = context.latest[localAssoc];
    if (assocValue == null) {
        throw new ApplicationError(
            `The value of referenced association "${localAssoc}" of entity "${entity.meta.name}" should not be null.`
        );
    }

    const assocMeta = entity.meta.associations[localAssoc];
    if (!assocMeta) {
        throw new ApplicationError(`"${localAssoc}" is not an association field of entity "${entity.meta.name}".`);
    }

    if (assocMeta.list) {
        throw new ApplicationError(
            `"${localAssoc}" entity "${entity.meta.name}" is a list-style association which is not supported by the built-in fetch_ Activators.`
        );
    }

    // local cache in context, shared by other fields if any
    let remoteEntity = context.populated && context.populated[remoteAssoc];
    if (!remoteEntity) {
        const findOptions = { $select: [selectedField], $where: { [assocMeta.key]: assocValue } };

        if (interAssoc) {
            findOptions.$relation = [interAssoc];
        }

        await entity.ensureTransaction_(context);

        remoteEntity = await entity.db.entity(assocMeta.entity).findOne_(findOptions);

        if (!remoteEntity) {
            throw new ApplicationError(
                `Unable to find the "${assocMeta.entity}" with [${assocMeta.key}=${assocValue}]. Entity: ${entity.meta.name}`
            );
        }

        context.populated || (context.populated = {});
        context.populated[localAssoc] = remoteEntity;

        let currentAssoc = localAssoc;
        while (parts.length > 0) {
            const nextAssoc = parts.shift();
            // todo: nested accessor
            remoteEntity = remoteEntity[':' + nextAssoc];
            if (Array.isArray(remoteEntity)) {
                throw new Error('Remote entity should not be an array.');
            }

            currentAssoc = currentAssoc + '.' + nextAssoc;
            context.populated[currentAssoc] = remoteEntity;
        }
    }

    if (!(selectedField in remoteEntity)) {
        throw new ApplicationError(
            `"${selectedField}" is not a field of remote association "${remoteAssoc}" of entity "${entity.meta.name}".`
        );
    }

    return remoteEntity[selectedField];
};

export default activatorTable;
