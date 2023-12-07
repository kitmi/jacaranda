import { GeneralError, ExposableError, ApplicationError } from './AppErrors';
import { ValidationError } from './DataErrors';
import HttpCode from './HttpCode';

/**
 * HTTP errors.
 * @module HttpErrors
 */

/**
 * Request errors.
 * @class
 * @extends ValidationError
 */
export class BadRequest extends ValidationError {
    constructor(message, info) {
        super(message, info);
        this.code = 'E_BAD_REQUEST';
    }
}

/**
 * Http NotFound, 404.
 * @class
 * @extends ExposableError
 */
export class NotFound extends ExposableError {
    constructor(message, info) {
        super(message, info, HttpCode.NOT_FOUND, 'E_NOT_FOUND');
    }
}

/**
 * Http Unauthorized, 401.
 * @class
 * @extends ExposableError
 *
 * 401 UNAUTHORIZED vs 403 FORBIDDEN (refer to explanation from Daniel Irvine)
 * 401 It’s for authentication, not authorization.
 * Receiving a 401 response is the server telling you, “you aren’t authenticated–either not authenticated at all or authenticated incorrectly–but please reauthenticate and try again.”
 * To help you out, it will always include a WWW-Authenticate header that describes how to authenticate.
 */
export class Unauthorized extends ExposableError {
    constructor(message, info) {
        super(message, info, HttpCode.UNAUTHORIZED, 'E_UNAUTHENTICATED');
    }
}

/**
 * Http Forbidden, 403.
 * @class
 * @extends ExposableError
 *
 * 401 UNAUTHORIZED vs 403 FORBIDDEN (refer to explanation from Daniel Irvine)
 * Receiving a 403 response is the server telling you, “I’m sorry. I know who you are–I believe who you say you are–but you just don’t have permission to access this resource. Maybe if you ask the system administrator nicely, you’ll get permission. But please don’t bother me again until your predicament changes.”
 * In summary, a 401 Unauthorized response should be used for missing or bad authentication, and a 403 Forbidden response should be used afterwards, when the user is authenticated but isn’t authorized to perform the requested operation on the given resource.
 */
export class Forbidden extends ExposableError {
    constructor(message, info) {
        super(message, info, HttpCode.FORBIDDEN, 'E_FORBIDDEN');
    }
}

/**
 * Service unavailable error, 503
 * @class
 * @extends GeneralError
 */
export class ServiceUnavailable extends GeneralError {
    constructor(message, info) {
        super(message, info, HttpCode.SERVICE_UNAVAILABLE, 'E_UNAVAILABLE');
    }
}

/**
 * External server error, 503
 * @class
 * @extends GeneralError
 */
export class ExternalServiceError extends GeneralError {
    constructor(message, info) {
        super(message, info, HttpCode.SERVICE_UNAVAILABLE, 'E_EXTERNAL');
    }
}

/**
 * Internal server error, 500
 * @class
 * @extends ApplicationError
 */
export class ServerError extends ApplicationError {
    constructor(message, info) {
        super(message, info, 'E_SERVER');
    }
}

export const Unauthenticated = Unauthorized; // try use Unauthenticated instead of Unauthorized for better expressing the error in code

export const PermissionDenied = Forbidden;
