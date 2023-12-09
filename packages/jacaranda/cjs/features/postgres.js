"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    stage: _Feature.default.SERVICE,
    groupable: true,
    packages: [
        'pg'
    ],
    load_: async function(app, options, name) {
        options = app.featureConfig(options, {
            schema: [
                {
                    connectionString: {
                        type: 'text'
                    }
                },
                {
                    user: {
                        type: 'text'
                    },
                    password: {
                        type: 'text'
                    },
                    host: {
                        type: 'text'
                    },
                    database: {
                        type: 'text',
                        optional: true
                    },
                    port: {
                        type: 'integer',
                        optional: true
                    }
                }
            ]
        }, name);
        const { Pool, types, escapeLiteral, escapeIdentifier } = await app.tryRequire_('pg');
        const pool = new Pool(options);
        pool.on('connect', ()=>{
            app.log('info', 'Connected to postgresql.', {
                connections: pool.totalCount
            });
        });
        pool.on('error', (err)=>{
            app.logError(err, 'Unexpected error on idle client');
        });
        app.on('stopping', async ()=>{
            await pool.end();
        });
        const service = {
            get types () {
                return types;
            },
            literal: escapeLiteral,
            identifier: escapeIdentifier,
            query_: (...args)=>pool.query(...args),
            execute_: async (fnBusinessLogic_, useTransaction)=>{
                const client = await pool.connect();
                try {
                    if (useTransaction) {
                        await client.query('BEGIN');
                    }
                    const result = await fnBusinessLogic_(client);
                    if (useTransaction) {
                        await client.query('COMMIT');
                    }
                    return result;
                } catch (error) {
                    if (useTransaction) {
                        await client.query('ROLLBACK');
                    }
                    throw error;
                } finally{
                    client.release();
                }
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=postgres.js.map