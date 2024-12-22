import { dataSource, dataModel, db } from '../../src';
import TestDb from '../src/models/Test';
import Test2Db from '../src/models/Test2';

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
                test2: Test2Db,
            },
        },
    });
};

const startMQ_ = async (test) => {
    return jacat.startWorker_(test, {
        configPath: './test/conf',
        configType: 'yaml',
        configName: 'rabbitmq',
        registry: {
            features: {
                dataModel,
                dataSource,
                db,
            },
            db: {
                test: TestDb,
                test2: Test2Db,
            },
        },
    });
};

global.tester = {
    start_,
    startMQ_,
};
