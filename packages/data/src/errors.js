import { ApplicationError } from '@kitmi/types';

/**
 * Business error.
 * @class
 */
export class BusinessError extends ApplicationError {
    constructor(message, info) {
        super(message, info, 'E_BUSINESS');
    }
}
