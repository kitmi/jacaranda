import { _ } from '@kitmi/utils';
import { findUnique_ } from './dbFindUnique';

export default async function dbExistUnique(step, settings) {
    const record = await findUnique_(step, settings);
    const recordExists = record != null;

    step.syslog('info', recordExists ? 'Record exists.' : 'Record not found.', {        
        record,
        result: recordExists
    });

    return recordExists;
}
