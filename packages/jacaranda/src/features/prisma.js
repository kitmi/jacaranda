import path from 'node:path';
import { _, esmCheck, pascalCase, camelCase, unexistDelegate } from '@kitmi/utils';
import { InvalidArgument, ApplicationError } from '@kitmi/types';
import Feature from '../Feature';

const prismsHelper = {
    $pushQuery: (where, query) => {
        let { AND, ..._where } = where;

        _.each(query, (value, key) => {
            const existing = _where[key];
            if (typeof existing !== 'undefined') {
                if (!AND) {
                    AND = [];
                } else {
                    AND = [...AND];
                }

                delete _where[key];
                AND.push({ [key]: existing });
                AND.push({
                    [key]: value,
                });
            } else {
                _where[key] = value;
            }
        });

        if (AND) {
            _where.AND = AND;
        }

        return _where;
    },
    $pushOrQuery: (where, query) => {
        if (!where.OR) {
            where = {
                OR: [where],
            };
        } else {
            where = {
                OR: [...where.OR],
            };
        }

        where.OR.push(query);
        return where;
    },
};

const symCache = Symbol('cache');

export class DefaultModel {
    constructor(prisma, app, pascalModelName) {
        this.db = prisma;
        this.model = prisma[camelCase(pascalModelName)];
        this.app = app;
    }
}

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['@prisma/client'],

    load_: async function (app, options, name) {
        const { modelPath, ttlCacheService, ...prismaOptions } = app.featureConfig(
            options,
            {
                schema: {
                    modelPath: { type: 'string', default: 'models' },
                    ttlCacheService: { type: 'string', optional: true },
                    datasources: { type: 'object', optional: true },
                    log: {
                        type: 'array',
                        element: { type: 'text' },
                        optional: true,
                    },
                },
            },
            name
        );

        const { PrismaClient } = await app.tryRequire_('@prisma/client');

        const _modelPath = path.join(app.sourcePath, modelPath);
        const modelCache = new Map();

        const prisma = new PrismaClient(prismaOptions);

        await prisma.$connect();

        app.on('stopping', async () => {
            await prisma.$disconnect();
        });

        Object.assign(prisma, prismsHelper);

        const modelDelegate = (target, prop) => {
            return target.model[prop];
        };

        prisma.$model = (name) => {
            const _name = name.toLowerCase();
            let modelObject = modelCache.get(_name);
            if (!modelObject) {
                const pascalName = pascalCase(name);

                let Model;

                try {
                    Model = esmCheck(require(path.join(_modelPath, pascalName)));
                } catch (err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        Model = DefaultModel;
                    } else {
                        throw err;
                    }
                }
                const modelInstance = new Model(prisma, app, pascalName);

                modelInstance.retryCreate_ = async (createOptions, onDuplicate, maxRetry) => {
                    maxRetry || (maxRetry = 99);
                    let retry = 0;
                    let error;

                    while (retry++ < maxRetry) {
                        try {
                            return await modelInstance.model.create(createOptions);
                        } catch (err) {
                            //P2002: Unique constraint failed
                            if (err.code !== 'P2002') {
                                throw err;
                            }

                            createOptions = await onDuplicate(createOptions);
                            error = err;
                        }
                    }

                    throw error;
                };

                if (ttlCacheService) {
                    modelInstance.ttlCacheUnique_ = async (key, findUnique, ttl) => {
                        const cache = app.getService(ttlCacheService);
                        const cacheKey = `prisma:${name}:${key}`;
                        return await cache.get_(cacheKey, () => modelInstance.model.findUnique(findUnique), ttl);
                    };

                    modelInstance.ttlCacheMany_ = async (key, findMany, ttl) => {
                        const cache = app.getService(ttlCacheService);
                        const cacheKey = `prisma:${name}:${key}`;
                        return await cache.get_(cacheKey, () => modelInstance.model.findMany(findMany), ttl);
                    };
                }

                modelObject = unexistDelegate(modelInstance, modelDelegate, true);
                modelCache.set(_name, modelObject);
            }
            return modelObject;
        };

        prisma.$setupCache = (modelBox, entries) => {
            if (!modelBox.model) {
                throw new ApplicationError(
                    'prisma.$setupCache should be called in the constructor and after model is assigned.'
                );
            }

            modelBox[symCache] = new Map();

            modelBox.cache_ = async (key) => {
                let cache = modelBox[symCache].get(key);
                if (cache) {
                    return cache;
                }

                const meta = entries[key];
                if (!meta) {
                    throw new InvalidArgument(`No cache setup for key: ${key}`);
                }

                const { where = {}, type = 'list', mapByKey, ...others } = meta;

                let data = await modelBox.model.findMany({
                    where,
                    ...others,
                });

                if (type === 'map') {
                    if (!mapByKey) {
                        throw new InvalidArgument(`No "mapByKey" set for map type cache: ${key}`);
                    }

                    data = data.reduce((result, item) => {
                        result[item[mapByKey]] = item;
                        return result;
                    }, {});
                } // else type === 'list'

                modelBox[symCache].set(key, data);
                return data;
            };

            modelBox.resetCache = (key) => {
                modelBox[symCache].delete(key);
            };
        };

        app.registerService(name, prisma);
    },
};
