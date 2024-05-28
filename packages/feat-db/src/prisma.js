import { _, camelCase, unexistDelegate } from '@kitmi/utils';
import { Feature } from '@kitmi/jacaranda';

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

const DEFAULT_CLIENT = '@prisma/client';

const modelDelegate = (target, prop) => {
    return target.model[prop];
};

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: (app, { clientPath }) => {
        return clientPath && clientPath != DEFAULT_CLIENT ? [] : ['@prisma/client'];
    },

    load_: async function (app, options, name) {
        const { useModels, clientPath, ttlCacheService, ...prismaOptions } = app.featureConfig(
            options,
            {
                schema: {
                    useModels: { type: 'boolean', default: false },
                    clientPath: { type: 'string', default: '@prisma/client' },
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

        const { PrismaClient } = await app.tryRequire_(clientPath);
        const _models = new Map();

        const prisma = new PrismaClient(prismaOptions);
        await prisma.$connect();

        app.on('stopping', async () => {
            await prisma.$disconnect();
        });

        Object.assign(prisma, prismsHelper);

        const cacheService = ttlCacheService && app.getService(ttlCacheService);

        prisma._$env = {
            cacheService,
        };

        if (useModels) {
            if (!app.registry.models) {
                throw new Error('No models found in the app registry');
            }

            _.each(app.registry.models, (ModelClass, name) => {
                const modelInstance = new ModelClass(app, prisma, name);
                const modelObject = unexistDelegate(modelInstance, modelDelegate, true);
                _models.set(modelInstance.name, modelObject);
                const altName = camelCase(modelInstance.name);
                if (altName !== modelInstance.name) {
                    _models.set(altName, modelObject);
                }
            });
        }

        prisma.$model = (name) => _models.get(name);

        app.registerService(name, prisma);
    },
};
