import { dataSource, dataModel, db } from '@kitmi/data';
import { gitea, devops } from '../../src';
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
            },
        },
    });
};

const start2_ = async (test) => {
    return jacat.startWorker_(test, {
        configPath: './test/conf',
        configType: 'yaml',
        configName: 'test',
        registry: {
            features: {
                gitea,
                devops
            },
            db: {
            },
        },
    });
};

global.tester = {
    start_,
    start2_
};
