const path = require('path');
const { fs } = require('@genx/sys');

const { DbModel } = require('@genx/data');

class {{ className }} extends DbModel {
    constructor(app, connector, i18n) {     
        super(app, connector, i18n);
        
        this.schemaName = '{{ schemaName }}';
        this.entities = {{ entities|safe }};        
    }

    require(moduleRelativePath) {        
        return require(path.resolve(__dirname, this.schemaName, moduleRelativePath));       
    }

    loadCustomModel(modelClassName) { 
        const customModelPath = path.resolve(__dirname, `./${this.schemaName}/${modelClassName}.js`);           
        return fs.existsSync(customModelPath) && require(customModelPath);
    }

    loadModel(modelClassName) {            
        return require(`./${this.schemaName}/base/${modelClassName}.js`);
    }

    async doTransaction_(transaction, errorHandler, connOptions) {
        if (connOptions && connOptions.connection) {
            return transaction(connOptions);
        }

        let connection;

        try {
            connection = await this.connector.beginTransaction_();
            const ret = await transaction({...connOptions, connection});
            await this.connector.commit_(connection);
            return ret;
        } catch(error) {
            if (connection) {
                await this.connector.rollback_(connection);
            }

            if (errorHandler) {
                return errorHandler(error);
            }

            throw error;
        }
    }
}

module.exports = {{ className }};