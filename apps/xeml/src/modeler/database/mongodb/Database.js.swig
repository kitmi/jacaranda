const { naming } = require('@genx/july');

const { Connector, getEntityModelOfDriver, Errors: { BusinessError } } = require('@k-suite/oolong');
const BaseEntityModel = getEntityModelOfDriver('{{ driver }}');

class {{ className }} {
    constructor(connection, options) {     
        if (typeof connection === 'string') {
            this.connector = Connector.createConnector('{{ driver }}', connection, options);
            this._connectorOwner = true;
        } else {  
            assert: connection.driver && connection.connectionString;
            
            this.connector = connection;
            this.i18n = options;
        }

        this._modelCache = {};
    }

    model(entityName) {
        if (this._modelCache[entityName]) return this._modelCache[entityName];

        let modelClassName = naming.pascalCase(entityName);
        if (this._modelCache[modelClassName]) return this._modelCache[modelClassName];

        let entitySpecMixin;

        try {
            entitySpecMixin = require(`./{{ schemaName }}/${modelClassName}`);        
        } catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                throw new BusinessError(`Entity "${modelClassName}" not found.`);
            }

            throw error;
        }

        let modelClass = entitySpecMixin(this, BaseEntityModel);

        this._modelCache[entityName] = modelClass;
        if (modelClassName !== entityName) {
            this._modelCache[modelClassName] = modelClass;
        }
        
        return modelClass;
    }

    async close_() {
        if (this._connectorOwner) {
            await this.connector.end_();
            delete this._connectorOwner;
        }

        delete this._modelCache;
        delete this.connector;
    }
}

{{ className }}.driver = '{{ driver }}';
{{ className }}.schemaName = '{{ schemaName }}';

module.exports = {{ className }};