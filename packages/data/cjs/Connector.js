"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    connectionObjectToString: function() {
        return connectionObjectToString;
    },
    connectionStringToObject: function() {
        return connectionStringToObject;
    }
});
const _nodeurl = require("node:url");
const _utils = require("@kitmi/utils");
const _allSync = require("@kitmi/validators/allSync");
const _drivers = /*#__PURE__*/ _interop_require_default(require("./drivers"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function connectionObjectToString(obj, withoutCredential = false) {
    const { driver, user, password, host, database, ...options } = obj;
    let base = withoutCredential ? `${driver}://${host}/${database}` : `${driver}://${user}:${password}@${host}/${database}`;
    if (!(0, _utils.isEmpty)(options)) {
        base += '?' + new URLSearchParams(options).toString();
    }
    return base;
}
function connectionStringToObject(str, driver) {
    const url = new _nodeurl.URL(str);
    const obj = {
        driver: driver ?? url.protocol.replace(':', ''),
        user: url.username,
        password: url.password,
        host: url.hostname,
        database: url.pathname.substring(1)
    };
    url.searchParams.forEach((value, key)=>{
        obj[key] = value;
    });
    return obj;
}
/**
 * A database storage connector object.
 * @class
 */ class Connector {
    /**
     * Create a connector.
     * @param {App} app - The Jacaranda app object
     * @param {*} driver
     * @param {*} connectionString
     * @param {*} options
     */ static createConnector(app, driver, connectionString, options) {
        if (!(driver in _drivers.default)) {
            throw new Error(`Unsupported connector driver: "${driver}"!`);
        }
        if (!connectionString) {
            throw new Error(`Missing required connection string`);
        }
        const ConnectorClass = _drivers.default[driver].Connector;
        return new ConnectorClass(app, connectionString, options);
    }
    /**
     * Make a new connection components from current connection string and given components.
     * @param {object} components
     * @property {string} [components.user]
     * @property {string} [components.password]
     * @property {string} [components.database]
     * @property {object} [components.options]
     */ makeNewConnectionString(components) {
        const url = new _nodeurl.URL(typeof this.connectionString === 'string' ? this.connectionString : connectionObjectToString(this.connectionString));
        if ('user' in components) {
            url.username = components.user;
        } else if ('username' in components) {
            url.username = components.username;
        }
        if ('password' in components) {
            url.password = components.password;
        }
        if ('database' in components) {
            url.pathname = '/' + components.database;
        } else {
            url.pathname = '/' + this.database;
        }
        if ('options' in components) {
            const options = components.options;
            _utils._.forOwn(options, (value, key)=>{
                url.searchParams.set(key, typeof value === 'boolean' ? value ? 1 : 0 : value);
            });
        }
        return url.href;
    }
    /**
     * Get the connection without credential information, usually used for displaying.
     * @returns {string}
     */ getConnectionStringWithoutCredential(connStr) {
        const strOrObj = connStr || this.connectionString;
        if (typeof strOrObj === 'string') {
            const url = new _nodeurl.URL(strOrObj);
            url.username = '';
            url.password = '';
            return url.href;
        }
        return connectionObjectToString(strOrObj, true);
    }
    /**
     * Database name.
     * @member {string}
     */ get database() {
        if (!this._database) {
            this._database = new _nodeurl.URL(this.connectionString).pathname.substring(1);
        }
        return this._database;
    }
    /**
     * Client library.
     * @member {object}
     */ get driverLib() {
        return this.constructor.driverLib;
    }
    /**
     * Create a connector.
     * @param {App} app - The Jacaranda app object
     * @param {string} driver - Data storage type
     * @param {string} connectionString - The connection string or object
     * @param {object} [options] - Connector options
     */ constructor(app, driver, _connectionString, options){
        const { connection: connectionString } = _allSync.Types.OBJECT.sanitize({
            connection: _connectionString
        }, {
            schema: [
                {
                    connection: [
                        {
                            type: 'text'
                        },
                        {
                            type: 'object',
                            schema: {
                                driver: {
                                    type: 'text',
                                    optional: true
                                },
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
                        }
                    ]
                },
                , 
            ]
        });
        /**
         * The Jacaranda app object
         * @member {App}
         */ this.app = app;
        /**
         * The database storage type, e.g. mysql, mongodb
         * @member {string}
         */ this.driver = driver;
        /**
         * The default URL style connection string, e.g. mysql://username:password@host:port/dbname
         * @member {string}
         */ this.connectionString = connectionString;
        /**
         * Connector options
         * @member {object}
         */ this.options = options || {};
        /**
         * Is the database a relational database
         * @member {boolean}
         */ this.relational = false;
    }
}
module.exports = Connector;

//# sourceMappingURL=Connector.js.map