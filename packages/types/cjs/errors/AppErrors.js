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
    ApplicationError: function() {
        return ApplicationError;
    },
    ExposableError: function() {
        return ExposableError;
    },
    GeneralError: function() {
        return GeneralError;
    },
    InvalidArgument: function() {
        return InvalidArgument;
    },
    InvalidConfiguration: function() {
        return InvalidConfiguration;
    }
});
const _HttpCode = /*#__PURE__*/ _interop_require_default(require("./HttpCode"));
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class GeneralError extends Error {
    constructor(message, info, status, code){
        super(message);
        this.name = this.constructor.name;
        let typeOfInfo = typeof info;
        let typeOfStatus = typeof status;
        let typeOfCode = typeof code;
        if (typeOfCode === 'undefined') {
            if (typeOfStatus === 'string') {
                code = status;
                status = undefined;
                typeOfStatus = 'undefined';
            }
        }
        if (typeOfStatus === 'undefined') {
            if (typeOfInfo === 'number') {
                status = info;
                info = undefined;
            }
            if (typeOfCode === 'undefined' && typeOfInfo === 'string') {
                code = info;
                info = undefined;
            }
        }
        /**
         * Error information
         * @member {object}
         */ this.info = info;
        /**
         * Http status
         * @member {number}
         */ this.status = status;
        /**
         * Error code
         * @member {string}
         */ this.code = code;
    }
}
class ApplicationError extends GeneralError {
    /**
     * @param {string} message - Error message
     * @param {*} info
     * @param {*} code
     */ constructor(message, info, code){
        super(message, info, _HttpCode.default.INTERNAL_SERVER_ERROR, code || 'E_APP');
    }
}
class InvalidConfiguration extends ApplicationError {
    /**
     * @param {string} message - Error message
     * @param {App} [app] - The related app module
     * @param {string} [item] - The related config item
     */ constructor(message, app, item){
        super(message, {
            app: app.name,
            item
        }, 'E_INVALID_CONF');
    }
}
class InvalidArgument extends ApplicationError {
    /**
     * @param {string} message - Error message
     * @param {*} [info] - Extra info
     * @param {string} [item] - The related config item
     */ constructor(message, info){
        super(message, info, 'E_INVALID_ARG');
    }
}
class ExposableError extends GeneralError {
    constructor(...args){
        super(...args);
        _define_property(this, "expose", true);
    }
}

//# sourceMappingURL=AppErrors.js.map