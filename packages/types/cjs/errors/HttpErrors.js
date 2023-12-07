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
    BadRequest: function() {
        return BadRequest;
    },
    ExternalServiceError: function() {
        return ExternalServiceError;
    },
    Forbidden: function() {
        return Forbidden;
    },
    NotFound: function() {
        return NotFound;
    },
    PermissionDenied: function() {
        return PermissionDenied;
    },
    ServerError: function() {
        return ServerError;
    },
    ServiceUnavailable: function() {
        return ServiceUnavailable;
    },
    Unauthenticated: function() {
        return Unauthenticated;
    },
    Unauthorized: function() {
        return Unauthorized;
    }
});
const _AppErrors = require("./AppErrors");
const _DataErrors = require("./DataErrors");
const _HttpCode = /*#__PURE__*/ _interop_require_default(require("./HttpCode"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class BadRequest extends _DataErrors.ValidationError {
    constructor(message, info){
        super(message, info);
        this.code = 'E_BAD_REQUEST';
    }
}
class NotFound extends _AppErrors.ExposableError {
    constructor(message, info){
        super(message, info, _HttpCode.default.NOT_FOUND, 'E_NOT_FOUND');
    }
}
class Unauthorized extends _AppErrors.ExposableError {
    constructor(message, info){
        super(message, info, _HttpCode.default.UNAUTHORIZED, 'E_UNAUTHENTICATED');
    }
}
class Forbidden extends _AppErrors.ExposableError {
    constructor(message, info){
        super(message, info, _HttpCode.default.FORBIDDEN, 'E_FORBIDDEN');
    }
}
class ServiceUnavailable extends _AppErrors.GeneralError {
    constructor(message, info){
        super(message, info, _HttpCode.default.SERVICE_UNAVAILABLE, 'E_UNAVAILABLE');
    }
}
class ExternalServiceError extends _AppErrors.GeneralError {
    constructor(message, info){
        super(message, info, _HttpCode.default.SERVICE_UNAVAILABLE, 'E_EXTERNAL');
    }
}
class ServerError extends _AppErrors.ApplicationError {
    constructor(message, info){
        super(message, info, 'E_SERVER');
    }
}
const Unauthenticated = Unauthorized; // try use Unauthenticated instead of Unauthorized for better expressing the error in code
const PermissionDenied = Forbidden;

//# sourceMappingURL=HttpErrors.js.map