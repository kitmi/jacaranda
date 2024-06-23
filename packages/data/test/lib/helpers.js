import { dataSource, dataModel, db } from '../..';
import TestDb from '../src/models/Test';

const start_ = async (test) => {
    return jacat.startWorker_(test, {
        configPath: './test/conf',
        configType: 'yaml',
        configName: 'xeml',
        registry: {
            features: {
                dataModel,
                dataSource,
                db,
            },
            db: {
                test: TestDb,
            },
        },
    });
};

global.tester = {
    start_,
};
