// JSON Validation Syntax
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
    default: function() {
        return _default;
    },
    test: function() {
        return test;
    }
});
const _utils = require("@kitmi/utils");
const _JsvError = /*#__PURE__*/ _interop_require_default(require("./JsvError"));
const _config = require("./config");
const _utils1 = require("./utils");
const _validateOperators = /*#__PURE__*/ _interop_require_default(require("./validateOperators"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getUnmatchedExplanation(op, leftValue, rightValue, context) {
    if (context.ERROR) {
        return context.ERROR;
    }
    const formatter = context.config.messages.validationErrors?.[op];
    if (formatter == null) {
        throw new Error('Missing validation error formatter for operator: ' + op);
    }
    return formatter(context.name, leftValue, rightValue, context);
}
function test(left, op, right, options, context) {
    const handler = context.config.getValidator(op);
    if (!handler) {
        throw new Error(context.config.messages.INVALID_TEST_HANLDER(op));
    }
    return handler(left, right, options, context);
}
/**
 * Validate the given object with JSON Expression Syntax (JES)
 * @param {*} actual - The object to match
 * @param {*} jsv - Expected state in JSON Expression Syntax
 * @param {*} options - Validation options
 * @param {*} [context] - Validation context
 * @property {Object} context.config - The configuration object for the current validation context
 * @property {string} [context.path] - The current path of the data structure being validated
 * @property {*} [context.THIS] - The current value being validated
 * @property {*} [context.ROOT] - The root of the data structure being validated
 * @property {*} [context.PARENT] - The parent of the current field being validated
 * @property {string} [context.KEY] - The key of the current field being validated
 * @property {string|Array} [context.ERROR] - The error message to display if the validation fails
 * @property {Object} [context.mapOfNames] - A map of field names to use for error messages
 * @property {string} [context.name] - The name of the current field being validated, provided by the user
 * @returns {array} - [ {boolean} matched, {string} unmatchedReason ]
 */ function validate(actual, jsv, options, context) {
    if (jsv == null) {
        return true;
    }
    context = (0, _config.initContext)(context, actual);
    const type = typeof jsv;
    if (type === 'string') {
        if (!(0, _utils1.isOperator)(jsv)) {
            throw new Error(context.config.messages.SYNTAX_INVALID_EXPR(jsv));
        }
        return validate(actual, {
            [jsv]: null
        }, options, context);
    }
    const { throwError, abortEarly, asPredicate, plainError } = options;
    if (Array.isArray(jsv)) {
        return validate(actual, {
            $all: jsv
        }, options, context);
    }
    if (type !== 'object') {
        return validate(actual, {
            $equal: jsv
        }, options, context);
    }
    const errors = [];
    const _options = !abortEarly && throwError ? {
        ...options,
        throwError: false
    } : options;
    for(let fieldName in jsv){
        let op, left, _context;
        const opValue = jsv[fieldName];
        if ((0, _utils1.isOperator)(fieldName)) {
            //validator
            op = context.config.getValidatorTag(fieldName);
            if (!op) {
                throw new Error(context.config.messages.UNSUPPORTED_VALIDATION_OP(fieldName, context.path));
            }
            left = actual;
            _context = context;
        } else {
            let isComplexKey = fieldName.indexOf('.') !== -1;
            //pick a field and then apply manipulation
            left = actual != null ? isComplexKey ? (0, _utils.get)(actual, fieldName) : actual[fieldName] : undefined;
            _context = (0, _config.getChildContext)(context, actual, fieldName, left);
            if (opValue != null && typeof opValue === 'object') {
                op = _validateOperators.default.MATCH;
            } else {
                op = _validateOperators.default.EQUAL;
            }
        }
        if (test(left, op, opValue, _options, _context) !== true) {
            if (asPredicate) {
                return false;
            }
            const reason = getUnmatchedExplanation(op, left, opValue, _context);
            if (abortEarly && throwError) {
                throw new _JsvError.default(reason, left, _context);
            }
            errors.push(plainError ? reason : new _JsvError.default(reason, left, _context));
            if (abortEarly) {
                break;
            }
        }
    }
    if (errors.length > 0) {
        if (asPredicate) {
            return false;
        }
        if (throwError) {
            throw new _JsvError.default(errors, actual, context);
        }
        return errors.length === 1 && plainError ? errors[0] : errors;
    }
    return true;
}
const _default = validate;

//# sourceMappingURL=validate.js.map