import { ExposableError, ApplicationError } from './AppErrors';
import HttpCode from './HttpCode';

/**
 * Data errors.
 * @module DataErrors
 */

/**
 * Validation error.
 * @class
 */
export class ValidationError extends ExposableError {
    static formatError(error) {
        let fullMessage = error.message;
        if (error.info) {
            if (error.info.path) {
                fullMessage += ' Key: ' + error.info.path;
            }

            if (error.info.error) {
                fullMessage += '\n' + error.info.error;
            }

            if (error.info.errors) {
                fullMessage +=
                    '\nAll of these alternative validations failed:\n' +
                    error.info.errors
                        .map(
                            (_error, i) =>
                                `Option ${i + 1}${_error.info?.path ? ' field ' + _error.info.path : ''}: ${
                                    _error.message
                                }`
                        )
                        .join('\n');
            }
        }

        return fullMessage;
    }

    static extractFromError(error) {
        const _error = {
            message: error.message,
            info: error.info,
        };

        if (error.inner) {
            _error.inner = ValidationError.extractFromError(error.inner);
        }

        return _error;
    }

    constructor(message, info, inner) {
        super(message, info, HttpCode.BAD_REQUEST, 'E_INVALID_DATA');

        this.inner = inner;
    }
}

/**
 * Referenced entity not found.
 * @class
 */
export class ReferencedNotExist extends ExposableError {
    constructor(message, info) {
        super(message, info, HttpCode.BAD_REQUEST, 'E_REFERENCED_NOT_EXIST');
    }
}

/**
 * Duplicate error.
 * @class
 */
export class DuplicateError extends ExposableError {
    constructor(message, info) {
        super(message, info, HttpCode.BAD_REQUEST, 'E_DUPLICATE');
    }
}

/**
 * Unexpected data/state error.
 * @class
 */
export class UnexpectedState extends ApplicationError {
    constructor(message, info) {
        super(message, info, 'E_UNEXPECTED');
    }
}

/**
 * Database operation error.
 * @class
 */
export class DatabaseError extends ApplicationError {
    constructor(message, info) {
        super(message, info, 'E_DATABASE');
    }
}
