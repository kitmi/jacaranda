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
const _types = require("@kitmi/types");
const _utils = require("@kitmi/utils");
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    stage: _Feature.default.SERVICE,
    groupable: true,
    load_: async function(app, options, name) {
        const { postgresService, tableName } = app.featureConfig(options, {
            schema: {
                postgresService: {
                    type: 'text',
                    default: 'postgres'
                },
                tableName: {
                    type: 'text',
                    default: 'documents'
                }
            }
        }, name);
        const pg = app.getService(postgresService);
        if (pg == null) {
            throw new _types.InvalidConfiguration(`"${postgresService}" service should be enabled for "${name}" feature.`, app, name);
        }
        const service = {
            ensureStore_: async (_tableName, fnSimilarityCheck, uk)=>{
                _tableName || (_tableName = tableName);
                fnSimilarityCheck || (fnSimilarityCheck = `${_tableName}_similarity_check`);
                await pg.execute_(async (client)=>{
                    const result = [];
                    result.push(await client.query('CREATE EXTENSION IF NOT EXISTS vector;'));
                    const sql = `CREATE TABLE IF NOT EXISTS ${pg.identifier(_tableName)} (
                        id bigserial PRIMARY KEY,
                        content text, ${uk ? '\n' + uk + ' varchar(60) UNIQUE,\n' : ''}                        
                        metadata jsonb,
                        embedding vector(1536) 
                      );`;
                    result.push(await client.query(sql));
                    const sql2 = `CREATE OR REPLACE FUNCTION ${pg.identifier(fnSimilarityCheck)} (
                        query_embedding vector(1536),
                        match_threshold float,
                        max_match_count int DEFAULT 1,
                        filter jsonb DEFAULT '{}'
                      ) RETURNS TABLE (
                        id bigint, ${uk ? '\n' + uk + ' varchar(60),\n' : ''}                        
                        similarity float
                      )
                      LANGUAGE SQL STABLE
                      AS $$
                        SELECT
                          id,
                          1- (embedding <=> query_embedding) AS similarity
                        FROM ${pg.identifier(_tableName)}
                        WHERE metadata @> filter AND (1- (embedding <=> query_embedding) > match_threshold)
                        ORDER BY similarity DESC
                        LIMIT max_match_count;
                      $$;`;
                    result.push(await client.query(sql2));
                    return result;
                });
            },
            addDocuments_: async (documents, _tableName)=>{
                const values = documents.map((document)=>{
                    const { content, metadata, embedding } = document;
                    return '(' + [
                        pg.literal(content),
                        pg.literal(JSON.stringify(metadata)),
                        pg.literal(JSON.stringify(embedding))
                    ].join(',') + ')';
                }).join(',');
                const sql = `INSERT INTO ${pg.identifier(_tableName ?? tableName)} (content, metadata, embedding) VALUES ${values}`;
                return pg.query_(sql);
            },
            checkRelevancy_: async (vector, filter, match_threshold, _tableName, fnSimilarityCheck)=>{
                _tableName || (_tableName = tableName);
                fnSimilarityCheck || (fnSimilarityCheck = `${_tableName}_similarity_check`);
                filter = _types.Types.OBJECT.sanitize(filter, {
                    default: {}
                });
                match_threshold = _types.Types.NUMBER.sanitize(match_threshold);
                const { rows, fields } = await pg.query_(`SELECT ${pg.identifier(fnSimilarityCheck)}($1, $2, $3, $4)`, [
                    vector,
                    match_threshold,
                    1,
                    filter
                ]);
                return rows.length ? (0, _utils.csvLineParse)(rows[0][fields[0].name].slice(1, -1)) : undefined;
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=pgVectorStore.js.map